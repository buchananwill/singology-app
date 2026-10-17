import {
  createAdminDb,
  createNotificationQueue,
  type DueNotification,
  type NotificationQueue,
} from "@singology/db/admin";
import { type EmailMessage, HOUR_MS, type NotificationKind, NUDGE_CRONS } from "@singology/shared";

import { feedbackReadyEmail, newSubmissionEmail, practiceReminderEmail } from "./templates";
import { createDryRunTransport, createResendTransport, type EmailTransport } from "./transport";

export interface NudgeRunSummary {
  cron: string;
  due: number;
  sent: number;
  skipped: number;
  failed: number;
}

/** `RESEND_API_KEY` is a secret, absent until the sending domain exists. */
export type NudgeEnv = Pick<Env, "HYPERDRIVE" | "EMAIL_FROM" | "APP_ORIGIN"> & {
  RESEND_API_KEY?: string;
};

export interface NudgeSender {
  queue: NotificationQueue;
  transport: EmailTransport;
  origin: string;
}

type Outcome = "sent" | "skipped" | "failed";

/** Feedback and takes older than this are never emailed, so an outage leaves no backlog. */
const LOOKBACK_MS = 7 * 24 * HOUR_MS;

const TEMPLATES = {
  feedback_ready: feedbackReadyEmail,
  new_submission: newSubmissionEmail,
  practice_reminder: practiceReminderEmail,
} satisfies Record<NotificationKind, (due: DueNotification, origin: string) => EmailMessage>;

export function transportFor(env: { RESEND_API_KEY?: string; EMAIL_FROM: string }): EmailTransport {
  return env.RESEND_API_KEY
    ? createResendTransport(env.RESEND_API_KEY, env.EMAIL_FROM)
    : createDryRunTransport();
}

/** The Monday of `now`'s ISO week, in UTC, as an ISO date. */
export function isoWeekStart(now: Date): string {
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  const monday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysSinceMonday,
  );
  return new Date(monday).toISOString().slice(0, 10);
}

async function dueFor(
  queue: NotificationQueue,
  cron: string,
  now: Date,
): Promise<DueNotification[] | null> {
  const since = new Date(now.getTime() - LOOKBACK_MS);
  switch (cron) {
    case NUDGE_CRONS.frequent:
      return [...(await queue.dueFeedbackReady(since)), ...(await queue.dueNewSubmission(since))];
    case NUDGE_CRONS.weekly:
      return queue.duePracticeReminders(isoWeekStart(now));
    default:
      return null;
  }
}

async function deliver(sender: NudgeSender, due: DueNotification): Promise<Outcome> {
  const message = TEMPLATES[due.kind](due, sender.origin);
  const claim = await sender.queue.claim(due);
  if (claim === null) {
    return "skipped";
  }
  let providerMessageId: string;
  try {
    providerMessageId = (await sender.transport.send(message, claim.id)).id;
  } catch (error) {
    await sender.queue.release(claim.id);
    throw error;
  }
  await sender.queue.markSent(claim.id, providerMessageId);
  return "sent";
}

export async function sendNudges(
  sender: NudgeSender,
  cron: string,
  now: Date,
): Promise<{ summary: NudgeRunSummary; errors: string[] }> {
  const summary: NudgeRunSummary = { cron, due: 0, sent: 0, skipped: 0, failed: 0 };
  const errors: string[] = [];
  const due = await dueFor(sender.queue, cron, now);
  if (due === null) {
    errors.push(`no nudge pass runs on cron "${cron}"`);
    return { summary, errors };
  }
  summary.due = due.length;
  // Claim, send and mark are side effects in order for each row, so the loop is sequential.
  for (const notification of due) {
    try {
      summary[await deliver(sender, notification)] += 1;
    } catch (error) {
      summary.failed += 1;
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { summary, errors };
}

export async function runNudges(env: NudgeEnv, cron: string, now: Date): Promise<NudgeRunSummary> {
  const db = createAdminDb(env.HYPERDRIVE);
  const sender = {
    queue: createNotificationQueue(db),
    transport: transportFor(env),
    origin: env.APP_ORIGIN,
  };
  let result: { summary: NudgeRunSummary; errors: string[] };
  try {
    result = await sendNudges(sender, cron, now);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    result = { summary: { cron, due: 0, sent: 0, skipped: 0, failed: 0 }, errors: [reason] };
  } finally {
    // The tick's outcome is already known; a pool that fails to close must not throw it away.
    await db.$client.end().catch(() => undefined);
  }
  console.log(`nudges ${JSON.stringify({ ...result.summary, errors: result.errors })}`);
  return result.summary;
}

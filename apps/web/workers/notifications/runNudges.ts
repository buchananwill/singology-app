import {
  createNotificationQueue,
  type DueNotification,
  type NotificationQueue,
  withAdminDb,
} from "@singology/db/admin";
import { DAY_MS, errorMessage, isoWeekStart, NUDGE_CRONS } from "@singology/shared";

import { nudgeEmail } from "./templates";
import { type EmailTransport, transportFor } from "./transport";
import type { NudgeEnv } from "./types";

export interface NudgeRunSummary {
  cron: string;
  due: number;
  sent: number;
  skipped: number;
  failed: number;
}

export interface NudgeRunResult {
  summary: NudgeRunSummary;
  errors: string[];
}

export interface NudgeSender {
  queue: NotificationQueue;
  transport: EmailTransport;
  origin: string;
}

type Outcome = keyof Omit<NudgeRunSummary, "cron" | "due">;

/** Feedback and takes older than this are never emailed, so an outage leaves no backlog. */
const LOOKBACK_MS = 7 * DAY_MS;

const emptySummary = (cron: string): NudgeRunSummary => ({
  cron,
  due: 0,
  sent: 0,
  skipped: 0,
  failed: 0,
});

async function dueFor(
  queue: NotificationQueue,
  cron: string,
  now: Date,
): Promise<DueNotification[] | null> {
  const since = new Date(now.getTime() - LOOKBACK_MS);
  switch (cron) {
    case NUDGE_CRONS.frequent: {
      const [feedbackReady, newSubmissions] = await Promise.all([
        queue.dueFeedbackReady(since),
        queue.dueNewSubmission(since),
      ]);
      return [...feedbackReady, ...newSubmissions];
    }
    case NUDGE_CRONS.weekly:
      return queue.duePracticeReminders(isoWeekStart(now));
    default:
      return null;
  }
}

async function deliver(sender: NudgeSender, due: DueNotification): Promise<Outcome> {
  const message = nudgeEmail(due, sender.origin);
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
): Promise<NudgeRunResult> {
  const summary = emptySummary(cron);
  const errors: string[] = [];
  let due: DueNotification[] | null;
  try {
    due = await dueFor(sender.queue, cron, now);
  } catch (error) {
    errors.push(`the due queries failed: ${errorMessage(error)}`);
    return { summary, errors };
  }
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
      errors.push(errorMessage(error));
    }
  }
  return { summary, errors };
}

export async function runNudges(env: NudgeEnv, cron: string, now: Date): Promise<NudgeRunSummary> {
  const closeErrors: string[] = [];
  const reportClose = (error: unknown) => {
    closeErrors.push(`the pool did not close: ${errorMessage(error)}`);
  };
  let result: NudgeRunResult;
  try {
    result = await withAdminDb(
      env.HYPERDRIVE,
      (db) =>
        sendNudges(
          {
            queue: createNotificationQueue(db),
            transport: transportFor(env),
            origin: env.APP_ORIGIN,
          },
          cron,
          now,
        ),
      reportClose,
    );
  } catch (error) {
    result = { summary: emptySummary(cron), errors: [errorMessage(error)] };
  }
  result.errors.push(...closeErrors);
  console.log(`nudges ${JSON.stringify({ ...result.summary, errors: result.errors })}`);
  return result.summary;
}

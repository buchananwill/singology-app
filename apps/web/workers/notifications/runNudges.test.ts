import type {
  DueNotification,
  FeedbackReadyDue,
  NewSubmissionDue,
  NotificationQueue,
  PracticeReminderDue,
} from "@singology/db/admin";
import { NUDGE_CRONS } from "@singology/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isoWeekStart, type NudgeSender, sendNudges, transportFor } from "./runNudges";
import type { EmailTransport } from "./transport";

const NOW = new Date("2026-10-15T09:00:00Z");

const feedbackReady: FeedbackReadyDue = {
  kind: "feedback_ready",
  recipient: { userId: "student-1", email: "ada@singology.test", displayName: "Ada Example" },
  feedbackId: "feedback-1",
  submissionId: "submission-1",
  coachFirstName: "Sam",
  exerciseTitle: "Siren slides",
};

const reminder: PracticeReminderDue = {
  kind: "practice_reminder",
  recipient: { userId: "student-2", email: "ben@singology.test", displayName: "Ben Sample" },
  periodStart: "2026-10-12",
  waitingCount: 0,
};

interface Fakes {
  calls: string[];
  queue: NotificationQueue;
  transport: EmailTransport;
  sender: NudgeSender;
}

function fakes(options: {
  due?: {
    feedback?: FeedbackReadyDue[];
    submission?: NewSubmissionDue[];
    reminder?: PracticeReminderDue[];
  };
  claimed?: (due: DueNotification) => boolean;
  sendFails?: boolean;
}): Fakes {
  const calls: string[] = [];
  const queue: NotificationQueue = {
    dueFeedbackReady: (since) => {
      calls.push(`dueFeedbackReady ${since.toISOString()}`);
      return Promise.resolve(options.due?.feedback ?? []);
    },
    dueNewSubmission: (since) => {
      calls.push(`dueNewSubmission ${since.toISOString()}`);
      return Promise.resolve(options.due?.submission ?? []);
    },
    duePracticeReminders: (periodStart) => {
      calls.push(`duePracticeReminders ${periodStart}`);
      return Promise.resolve(options.due?.reminder ?? []);
    },
    claim: (due) => {
      calls.push(`claim ${due.kind}`);
      return Promise.resolve(options.claimed?.(due) ? null : { id: `n-${due.recipient.userId}` });
    },
    markSent: (id, providerMessageId) => {
      calls.push(`markSent ${id} ${providerMessageId}`);
      return Promise.resolve();
    },
    release: (id) => {
      calls.push(`release ${id}`);
      return Promise.resolve();
    },
  };
  const transport: EmailTransport = {
    send: (message, idempotencyKey) => {
      calls.push(`send ${message.to} ${idempotencyKey}`);
      return options.sendFails
        ? Promise.reject(new Error("provider down"))
        : Promise.resolve({ id: `provider-${idempotencyKey}` });
    },
  };
  return { calls, queue, transport, sender: { queue, transport, origin: "https://app.example" } };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendNudges", () => {
  it("claims, sends, then marks each due row, with a seven-day lookback on the frequent cron", async () => {
    const { calls, sender } = fakes({ due: { feedback: [feedbackReady] } });
    const { summary, errors } = await sendNudges(sender, NUDGE_CRONS.frequent, NOW);
    expect(calls).toEqual([
      "dueFeedbackReady 2026-10-08T09:00:00.000Z",
      "dueNewSubmission 2026-10-08T09:00:00.000Z",
      "claim feedback_ready",
      "send ada@singology.test n-student-1",
      "markSent n-student-1 provider-n-student-1",
    ]);
    expect(summary).toEqual({ cron: NUDGE_CRONS.frequent, due: 1, sent: 1, skipped: 0, failed: 0 });
    expect(errors).toEqual([]);
  });

  it("releases the claim and counts a failure when the transport fails", async () => {
    const { calls, sender } = fakes({ due: { feedback: [feedbackReady] }, sendFails: true });
    const { summary, errors } = await sendNudges(sender, NUDGE_CRONS.frequent, NOW);
    expect(calls.slice(2)).toEqual([
      "claim feedback_ready",
      "send ada@singology.test n-student-1",
      "release n-student-1",
    ]);
    expect(summary).toMatchObject({ due: 1, sent: 0, failed: 1 });
    expect(errors).toEqual(["provider down"]);
  });

  it("skips a row another tick already claimed, without sending", async () => {
    const { calls, sender } = fakes({ due: { feedback: [feedbackReady] }, claimed: () => true });
    const { summary } = await sendNudges(sender, NUDGE_CRONS.frequent, NOW);
    expect(calls.slice(2)).toEqual(["claim feedback_ready"]);
    expect(summary).toMatchObject({ due: 1, sent: 0, skipped: 1, failed: 0 });
  });

  it("runs the practice reminders for the current ISO week on the weekly cron", async () => {
    const { calls, sender } = fakes({ due: { reminder: [reminder] } });
    const { summary } = await sendNudges(sender, NUDGE_CRONS.weekly, NOW);
    expect(calls[0]).toBe("duePracticeReminders 2026-10-12");
    expect(calls).toContain("send ben@singology.test n-student-2");
    expect(summary).toMatchObject({ cron: NUDGE_CRONS.weekly, due: 1, sent: 1 });
  });

  it("queries and sends nothing on an unknown cron", async () => {
    const { calls, sender } = fakes({ due: { feedback: [feedbackReady], reminder: [reminder] } });
    const { summary, errors } = await sendNudges(sender, "0 0 * * *", NOW);
    expect(calls).toEqual([]);
    expect(summary).toEqual({ cron: "0 0 * * *", due: 0, sent: 0, skipped: 0, failed: 0 });
    expect(errors).toHaveLength(1);
  });
});

describe("isoWeekStart", () => {
  it("is the Monday of the UTC week, including on the Monday and the Sunday", () => {
    expect(isoWeekStart(new Date("2026-10-12T00:00:00Z"))).toBe("2026-10-12");
    expect(isoWeekStart(NOW)).toBe("2026-10-12");
    expect(isoWeekStart(new Date("2026-10-18T23:59:59Z"))).toBe("2026-10-12");
    expect(isoWeekStart(new Date("2026-11-01T12:00:00Z"))).toBe("2026-10-26");
  });
});

describe("transportFor", () => {
  const message = {
    to: "ada@singology.test",
    subject: "A quick take this week?",
    text: "Hi Ada",
    html: "<p>Hi Ada</p>",
  };

  it("chooses the dry-run transport when the key is absent or empty", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const env of [{ EMAIL_FROM: "x" }, { EMAIL_FROM: "x", RESEND_API_KEY: "" }]) {
      expect(await transportFor(env).send(message, "n-1")).toEqual({ id: "dry-run:n-1" });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to Resend with the key, the sender and the notification id as idempotency key", async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(Response.json({ id: "re_123" })));
    vi.stubGlobal("fetch", fetchSpy);
    const transport = transportFor({ EMAIL_FROM: "Singology <hi@x.example>", RESEND_API_KEY: "k" });
    expect(await transport.send(message, "n-1")).toEqual({ id: "re_123" });
    expect(fetchSpy).toHaveBeenCalledWith("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer k",
        "Content-Type": "application/json",
        "Idempotency-Key": "n-1",
      },
      body: JSON.stringify({ from: "Singology <hi@x.example>", ...message }),
    });
  });

  it("fails the send on a non-2xx response", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("nope", { status: 422 })));
    const transport = transportFor({ EMAIL_FROM: "x", RESEND_API_KEY: "k" });
    await expect(transport.send(message, "n-1")).rejects.toThrow(/422/);
  });
});

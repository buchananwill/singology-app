// The nudge queue against the test project, which the globalSetup reseeds before the run.
import { DAY_MS, isoDate } from "@singology/shared";
import { inArray } from "drizzle-orm";
import { afterAll, assert, beforeAll, describe, expect, it } from "vitest";

import type { Db } from "../../src/client";
import { createAdminDbFromEnv } from "../../src/adminDbFromEnv";
import {
  createNotificationQueue,
  type NotificationQueue,
  type Recipient,
} from "../../src/notificationQueue";
import { PLACEHOLDER_EMAIL_DOMAIN } from "../../src/placeholderEmail";
import { notifications } from "../../src/schema";
import { CTO_DISPLAY_NAME, CTO_EMAIL, FOUNDER_EMAIL } from "../../src/seed/alphaCast";
import { fixtureUuid } from "../../src/seed/fixtureUuid";
import { requireUserIdByEmail } from "../../src/seed/userIdByEmail";

const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
const tomorrow = new Date(now.getTime() + DAY_MS);
const daysFromNow = (days: number) => isoDate(new Date(now.getTime() + days * DAY_MS));

let admin: Db;
let queue: NotificationQueue;
let ctoRecipient: Recipient;
let founderId: string;
const claimed: string[] = [];

beforeAll(async () => {
  admin = createAdminDbFromEnv();
  queue = createNotificationQueue(admin);
  ctoRecipient = {
    userId: await requireUserIdByEmail(admin, CTO_EMAIL),
    email: CTO_EMAIL,
    displayName: CTO_DISPLAY_NAME,
  };
  founderId = await requireUserIdByEmail(admin, FOUNDER_EMAIL);
});

afterAll(async () => {
  if (claimed.length > 0) {
    await admin.delete(notifications).where(inArray(notifications.id, claimed));
  }
  await admin.$client.end();
});

async function claimOrFail(...args: Parameters<NotificationQueue["claim"]>): Promise<string> {
  const row = await queue.claim(...args);
  assert(row, "the first claim inserts a row");
  claimed.push(row.id);
  return row.id;
}

describe("feedback ready", () => {
  it("finds the seeded feedback sent in the last seven days, once, addressed to the student", async () => {
    const due = await queue.dueFeedbackReady(weekAgo);
    const ids = due.map((row) => row.feedbackId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(fixtureUuid("fb-ada-siren-1"));
    expect(ids).not.toContain(fixtureUuid("fb-cara-arpeggio"));
    expect(due.find((row) => row.feedbackId === fixtureUuid("fb-ada-siren-2"))).toEqual({
      kind: "feedback_ready",
      recipient: ctoRecipient,
      feedbackId: fixtureUuid("fb-ada-siren-2"),
      submissionId: fixtureUuid("sub-ada-siren-2"),
      coachFirstName: "Singology",
      exerciseTitle: "Siren slides",
    });
  });

  it("finds nothing sent since a time after the last feedback", async () => {
    expect(await queue.dueFeedbackReady(tomorrow)).toEqual([]);
  });

  it("claims once, drops claimed feedback from the due list, and lets a released claim be retaken", async () => {
    const [due] = (await queue.dueFeedbackReady(weekAgo)).filter(
      (row) => row.feedbackId === fixtureUuid("fb-ada-siren-2"),
    );
    assert(due, "the seeded feedback is due");
    const id = await claimOrFail(due);
    expect(await queue.claim(due)).toBeNull();
    const afterClaim = await queue.dueFeedbackReady(weekAgo);
    expect(afterClaim.map((row) => row.feedbackId)).not.toContain(due.feedbackId);

    await queue.release(id);
    const retaken = await claimOrFail(due);
    expect(retaken).not.toBe(id);

    await queue.markSent(retaken, "dry-run:test");
    await queue.release(retaken);
    expect(await queue.claim(due)).toBeNull();
  });
});

describe("new submission", () => {
  it("finds the seeded awaiting takes from the last seven days, addressed to the coach", async () => {
    const due = await queue.dueNewSubmission(weekAgo);
    const ids = due.map((row) => row.submissionId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(due.find((row) => row.submissionId === fixtureUuid("sub-dev-bridge"))).toEqual({
      kind: "new_submission",
      recipient: ctoRecipient,
      submissionId: fixtureUuid("sub-dev-bridge"),
      studentFirstName: "Dev",
      exerciseTitle: "Crossing the bridge",
    });
    const benTake = due.find((row) => row.submissionId === fixtureUuid("sub-ben-hiss"));
    expect(benTake?.recipient.userId).toBe(founderId);
  });

  it("finds nothing submitted since a time after the last take", async () => {
    expect(await queue.dueNewSubmission(tomorrow)).toEqual([]);
  });

  it("claims a take once and drops it from the due list", async () => {
    const [due] = (await queue.dueNewSubmission(weekAgo)).filter(
      (row) => row.submissionId === fixtureUuid("sub-dev-bridge"),
    );
    assert(due, "the seeded take is due");
    await claimOrFail(due);
    expect(await queue.claim(due)).toBeNull();
    const afterClaim = await queue.dueNewSubmission(weekAgo);
    expect(afterClaim.map((row) => row.submissionId)).not.toContain(due.submissionId);
  });
});

describe("practice reminder", () => {
  it("reminds the student with no take since the period began, counting waiting exercises", async () => {
    const periodStart = daysFromNow(1);
    const ada = (await queue.duePracticeReminders(periodStart)).find(
      (row) => row.recipient.userId === ctoRecipient.userId,
    );
    assert(ada, "the seeded student has no take since tomorrow");
    expect(ada).toMatchObject({ kind: "practice_reminder", recipient: ctoRecipient, periodStart });
    // `asg-ada-runs` at least has no take; other suites may add takes for the rest.
    expect(ada.waitingCount).toBeGreaterThanOrEqual(1);
  });

  it("omits the student who sent a take since the period began", async () => {
    const due = await queue.duePracticeReminders(daysFromNow(-5));
    expect(due.map((row) => row.recipient.userId)).not.toContain(ctoRecipient.userId);
  });

  it("never reminds a placeholder student, who would only bounce", async () => {
    const due = await queue.duePracticeReminders(daysFromNow(1));
    expect(due.length).toBeGreaterThan(0);
    expect(due.every((row) => !row.recipient.email.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`))).toBe(
      true,
    );
  });

  it("finds nobody when every deliverable active student has a take since the period began", async () => {
    expect(await queue.duePracticeReminders(daysFromNow(-30))).toEqual([]);
  });

  it("claims one reminder per student per period", async () => {
    const periodStart = daysFromNow(1);
    const [due] = (await queue.duePracticeReminders(periodStart)).filter(
      (row) => row.recipient.userId === ctoRecipient.userId,
    );
    assert(due, "the seeded student is due");
    await claimOrFail(due);
    expect(await queue.claim(due)).toBeNull();
    const after = await queue.duePracticeReminders(periodStart);
    expect(after.map((row) => row.recipient.userId)).not.toContain(ctoRecipient.userId);
    await claimOrFail({ ...due, periodStart: daysFromNow(-12) });
  });
});

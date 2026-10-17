// The nudge queue against the test project, which the globalSetup reseeds before the run.
import { HOUR_MS } from "@singology/shared";
import { inArray } from "drizzle-orm";
import { afterAll, assert, beforeAll, describe, expect, it } from "vitest";

import { connectionSettingsFromUrl, createAdminDb, type Db } from "../../src/admin";
import { requireEnv } from "../../src/env";
import { createNotificationQueue, type NotificationQueue } from "../../src/notificationQueue";
import { notifications } from "../../src/schema";
import { CTO_DISPLAY_NAME, CTO_EMAIL, placeholderEmail } from "../../src/seed/alphaCast";
import { fixtureUuid } from "../../src/seed/fixtureUuid";
import { userIdByEmail } from "../../src/seed/userIdByEmail";

const DAY_MS = 24 * HOUR_MS;
const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
const tomorrow = new Date(now.getTime() + DAY_MS);

const isoDate = (at: Date) => at.toISOString().slice(0, 10);
const daysFromNow = (days: number) => isoDate(new Date(now.getTime() + days * DAY_MS));

let admin: Db;
let queue: NotificationQueue;
let ctoId: string;
let caraId: string;
const claimed: string[] = [];

async function userId(email: string): Promise<string> {
  const id = await userIdByEmail(admin, email);
  assert(id, `the seed created ${email}`);
  return id;
}

beforeAll(async () => {
  admin = createAdminDb(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
  queue = createNotificationQueue(admin);
  ctoId = await userId(CTO_EMAIL);
  caraId = await userId(placeholderEmail("student-cara"));
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
    const entityIds = due.map((row) => row.entityId);
    expect(new Set(entityIds).size).toBe(entityIds.length);
    expect(entityIds).not.toContain(fixtureUuid("fb-ada-siren-1"));
    expect(entityIds).not.toContain(fixtureUuid("fb-cara-arpeggio"));
    expect(due.find((row) => row.entityId === fixtureUuid("fb-ada-siren-2"))).toEqual({
      kind: "feedback_ready",
      userId: ctoId,
      email: CTO_EMAIL,
      entityId: fixtureUuid("fb-ada-siren-2"),
      link: { submissionId: fixtureUuid("sub-ada-siren-2") },
      displayName: CTO_DISPLAY_NAME,
      about: { displayName: "Singology founder", exerciseTitle: "Siren slides" },
    });
  });

  it("finds nothing sent since a time after the last feedback", async () => {
    expect(await queue.dueFeedbackReady(tomorrow)).toEqual([]);
  });

  it("claims once, drops claimed feedback from the due list, and lets a released claim be retaken", async () => {
    const [due] = (await queue.dueFeedbackReady(weekAgo)).filter(
      (row) => row.entityId === fixtureUuid("fb-ada-siren-2"),
    );
    assert(due, "the seeded feedback is due");
    const id = await claimOrFail(due);
    expect(await queue.claim(due)).toBeNull();
    const afterClaim = await queue.dueFeedbackReady(weekAgo);
    expect(afterClaim.map((row) => row.entityId)).not.toContain(due.entityId);

    await queue.release(id);
    const retaken = await claimOrFail(due);
    expect(retaken).not.toBe(id);

    await queue.markSent(retaken, "dry-run:test");
    await queue.release(retaken);
    expect(await queue.claim(due)).toBeNull();
  });
});

describe("new submission", () => {
  it("finds the seeded awaiting take from the last seven days, addressed to the coach", async () => {
    const due = await queue.dueNewSubmission(weekAgo);
    const entityIds = due.map((row) => row.entityId);
    expect(new Set(entityIds).size).toBe(entityIds.length);
    expect(due.find((row) => row.entityId === fixtureUuid("sub-dev-bridge"))).toEqual({
      kind: "new_submission",
      userId: ctoId,
      email: CTO_EMAIL,
      entityId: fixtureUuid("sub-dev-bridge"),
      link: { submissionId: fixtureUuid("sub-dev-bridge") },
      displayName: CTO_DISPLAY_NAME,
      about: { displayName: "Dev Demo", exerciseTitle: "Crossing the bridge" },
    });
  });

  it("finds nothing submitted since a time after the last take", async () => {
    expect(await queue.dueNewSubmission(tomorrow)).toEqual([]);
  });

  it("claims a take once", async () => {
    const [due] = (await queue.dueNewSubmission(weekAgo)).filter(
      (row) => row.entityId === fixtureUuid("sub-dev-bridge"),
    );
    assert(due, "the seeded take is due");
    await claimOrFail(due);
    expect(await queue.claim(due)).toBeNull();
  });
});

describe("practice reminder", () => {
  it("reminds the student with no take since the period began and omits one who has", async () => {
    const periodStart = daysFromNow(-5);
    const due = await queue.duePracticeReminders(periodStart);
    expect(due.map((row) => row.userId)).not.toContain(ctoId);
    expect(due.find((row) => row.userId === caraId)).toEqual({
      kind: "practice_reminder",
      userId: caraId,
      email: placeholderEmail("student-cara"),
      periodStart,
      link: { exerciseIds: [] },
      displayName: "Cara Placeholder",
    });
  });

  it("lists the student's exercises that still have no take", async () => {
    const due = await queue.duePracticeReminders(daysFromNow(1));
    const ada = due.find((row) => row.userId === ctoId);
    assert(ada && "exerciseIds" in ada.link, "every active student is due from tomorrow");
    expect(ada.link.exerciseIds).toContain(fixtureUuid("lib-agility-five-note"));
    expect(ada.link.exerciseIds).not.toContain(fixtureUuid("lib-range-siren"));
  });

  it("finds nobody when every active student has a take since the period began", async () => {
    expect(await queue.duePracticeReminders(daysFromNow(-30))).toEqual([]);
  });

  it("claims one reminder per student per period", async () => {
    const periodStart = daysFromNow(-5);
    const [due] = (await queue.duePracticeReminders(periodStart)).filter(
      (row) => row.userId === caraId,
    );
    assert(due, "the seeded student is due");
    await claimOrFail(due);
    expect(await queue.claim(due)).toBeNull();
    expect((await queue.duePracticeReminders(periodStart)).map((row) => row.userId)).not.toContain(
      caraId,
    );
    await claimOrFail({ ...due, periodStart: daysFromNow(-12) });
  });
});

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AssignmentSchema,
  CoachOfferSchema,
  CoachSchema,
  EnrolmentSchema,
  FeedbackCommentSchema,
  FeedbackSchema,
  LibraryItemSchema,
  LIBRARY_CATEGORIES,
  MediaAssetSchema,
  reviewSla,
  StudentSchema,
  SubmissionSchema,
} from "@singology/shared";
import { describe, expect, it } from "vitest";

import { createFixtureRepositories } from "./createFixtureRepositories";
import { createFixtureData, DEMO_COACH_ID, DEMO_STUDENT_ID } from "./data";

/** Any fixed instant: fixture times are offsets from it. */
const TEST_NOW = new Date("2026-09-23T12:00:00.000Z");
const fixtureData = createFixtureData(TEST_NOW);

const PUBLIC_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../apps/web/public",
);

function byId<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

const coaches = byId(fixtureData.coaches);
const offers = byId(fixtureData.coachOffers);
const students = byId(fixtureData.students);
const enrolments = byId(fixtureData.enrolments);
const library = byId(fixtureData.libraryItems);
const media = byId(fixtureData.mediaAssets);
const assignments = byId(fixtureData.assignments);
const submissions = byId(fixtureData.submissions);
const feedback = byId(fixtureData.feedback);

describe("fixture data", () => {
  it("parses against the shared Zod schemas", () => {
    expect(() => {
      CoachSchema.array().parse(fixtureData.coaches);
      CoachOfferSchema.array().parse(fixtureData.coachOffers);
      StudentSchema.array().parse(fixtureData.students);
      EnrolmentSchema.array().parse(fixtureData.enrolments);
      LibraryItemSchema.array().parse(fixtureData.libraryItems);
      MediaAssetSchema.array().parse(fixtureData.mediaAssets);
      AssignmentSchema.array().parse(fixtureData.assignments);
      SubmissionSchema.array().parse(fixtureData.submissions);
      FeedbackSchema.array().parse(fixtureData.feedback);
      FeedbackCommentSchema.array().parse(fixtureData.feedbackComments);
    }).not.toThrow();
  });

  it("stores times as offsets from now, so every timestamp moves with now", () => {
    const hundredDays = 1000 * 60 * 60 * 24 * 100;
    const later = createFixtureData(new Date(TEST_NOW.getTime() + hundredDays));
    const shift = (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime();
    fixtureData.submissions.forEach((s, i) =>
      expect(shift(s.submittedAt, later.submissions[i]?.submittedAt ?? "")).toBe(hundredDays),
    );
    fixtureData.assignments.forEach((a, i) =>
      expect(shift(a.assignedAt, later.assignments[i]?.assignedAt ?? "")).toBe(hundredDays),
    );
    fixtureData.feedback.forEach((f, i) =>
      expect(shift(f.sentAt, later.feedback[i]?.sentAt ?? "")).toBe(hundredDays),
    );
    fixtureData.enrolments.forEach((e, i) =>
      expect(shift(e.currentPeriodEnd, later.enrolments[i]?.currentPeriodEnd ?? "")).toBe(
        hundredDays,
      ),
    );
  });

  it("puts past events in the past and enrolment periods in the future", () => {
    const now = TEST_NOW.toISOString();
    for (const item of [
      ...fixtureData.assignments.map((a) => a.assignedAt),
      ...fixtureData.submissions.map((s) => s.submittedAt),
      ...fixtureData.feedback.map((f) => f.sentAt),
    ]) {
      expect(item < now).toBe(true);
    }
    for (const enrolment of fixtureData.enrolments) {
      expect(enrolment.currentPeriodEnd > now).toBe(true);
    }
  });

  it("has unique ids in every collection", () => {
    const collections: ReadonlyArray<ReadonlyArray<{ id: string }>> = Object.values(fixtureData);
    for (const collection of collections) {
      const ids = collection.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("has the decision 17 cast", () => {
    expect(fixtureData.coaches.map((c) => [c.displayName, c.tier])).toEqual([
      ["Singology founder", "premium"],
      ["Standard coach", "standard"],
    ]);
    expect(fixtureData.students).toHaveLength(4);
    expect(fixtureData.libraryItems).toHaveLength(8);
    expect(new Set(fixtureData.libraryItems.map((i) => i.category))).toEqual(
      new Set(LIBRARY_CATEGORIES),
    );
    expect(fixtureData.submissions.length).toBeGreaterThanOrEqual(5);
    expect(fixtureData.feedback.length).toBeGreaterThanOrEqual(3);
    for (const item of fixtureData.feedback) {
      const count = fixtureData.feedbackComments.filter((c) => c.feedbackId === item.id).length;
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(5);
    }
    expect(
      fixtureData.submissions.some((s) => media.get(s.mediaId)?.kind === "video"),
    ).toBe(true);
    expect(new Set(fixtureData.assignments.map((a) => a.status))).toEqual(
      new Set(["todo", "submitted", "feedback_ready"]),
    );
  });

  it("has the illustrative pricing", () => {
    const price = (coachId: string, billing: string) =>
      fixtureData.coachOffers.find((o) => o.coachId === coachId && o.billing === billing)
        ?.pricePence;
    expect(price("coach-founder", "monthly")).toBe(8000);
    expect(price("coach-standard", "monthly")).toBe(4500);
    expect(price("coach-founder", "single")).toBe(2500);
    expect(price("coach-standard", "single")).toBe(1200);
    for (const offer of fixtureData.coachOffers) {
      expect(offer.submissionsPerPeriod).toBe(offer.billing === "monthly" ? 4 : 1);
      expect(offer.tier).toBe(coaches.get(offer.coachId)?.tier);
    }
  });

  it("has two takes of the same exercise by the demo student, for A/B", () => {
    const takes = fixtureData.submissions.filter(
      (s) => enrolments.get(s.enrolmentId)?.studentId === DEMO_STUDENT_ID,
    );
    const perItem = new Map<string, Set<string>>();
    for (const take of takes) {
      perItem.set(take.libraryItemId, (perItem.get(take.libraryItemId) ?? new Set()).add(take.mediaId));
    }
    expect([...perItem.values()].some((mediaIds) => mediaIds.size >= 2)).toBe(true);
  });

  it("has demo identities that exist", () => {
    expect(students.has(DEMO_STUDENT_ID)).toBe(true);
    expect(coaches.has(DEMO_COACH_ID)).toBe(true);
  });

  it("has coach avatars in the web app's public folder", () => {
    for (const coach of fixtureData.coaches) {
      expect(existsSync(path.join(PUBLIC_DIR, ...coach.avatarSrc.split("/").filter(Boolean)))).toBe(
        true,
      );
    }
  });

  it("references only existing coaches from offers", () => {
    for (const offer of fixtureData.coachOffers) {
      expect(coaches.has(offer.coachId)).toBe(true);
    }
  });

  it("references existing students, coaches and that coach's offers from enrolments", () => {
    for (const enrolment of fixtureData.enrolments) {
      expect(students.has(enrolment.studentId)).toBe(true);
      expect(coaches.has(enrolment.coachId)).toBe(true);
      expect(offers.get(enrolment.offerId)?.coachId).toBe(enrolment.coachId);
    }
  });

  it("references only existing media from library items", () => {
    for (const item of fixtureData.libraryItems) {
      expect(media.has(item.demoMediaId)).toBe(true);
      if (item.backingTrackMediaId !== undefined) {
        expect(media.get(item.backingTrackMediaId)?.kind).toBe("audio");
      }
    }
  });

  it("references existing enrolments and library items from assignments", () => {
    for (const assignment of fixtureData.assignments) {
      expect(enrolments.has(assignment.enrolmentId)).toBe(true);
      expect(library.has(assignment.libraryItemId)).toBe(true);
    }
  });

  it("references a matching enrolment, assignment, library item and media from submissions", () => {
    for (const submission of fixtureData.submissions) {
      expect(enrolments.has(submission.enrolmentId)).toBe(true);
      expect(library.has(submission.libraryItemId)).toBe(true);
      expect(media.has(submission.mediaId)).toBe(true);
      if (submission.assignmentId !== undefined) {
        const assignment = assignments.get(submission.assignmentId);
        expect(assignment?.enrolmentId).toBe(submission.enrolmentId);
        expect(assignment?.libraryItemId).toBe(submission.libraryItemId);
      }
    }
  });

  it("keeps assignment and submission statuses consistent with feedback", () => {
    for (const submission of fixtureData.submissions) {
      const hasFeedback = fixtureData.feedback.some((f) => f.submissionId === submission.id);
      expect(submission.status).toBe(hasFeedback ? "reviewed" : "awaiting_review");
      if (submission.assignmentId !== undefined) {
        expect(assignments.get(submission.assignmentId)?.status).toBe(
          hasFeedback ? "feedback_ready" : "submitted",
        );
      }
    }
    for (const assignment of fixtureData.assignments) {
      const submitted = fixtureData.submissions.some((s) => s.assignmentId === assignment.id);
      expect(assignment.status === "todo").toBe(!submitted);
    }
  });

  it("references the submission's own coach and existing reply media from feedback", () => {
    for (const item of fixtureData.feedback) {
      const submission = submissions.get(item.submissionId);
      expect(submission).toBeDefined();
      expect(item.coachId).toBe(enrolments.get(submission?.enrolmentId ?? "")?.coachId);
      if (item.replyMediaId !== undefined) {
        expect(media.has(item.replyMediaId)).toBe(true);
      }
      expect(item.sentAt > (submission?.submittedAt ?? "")).toBe(true);
    }
  });

  it("positions every comment within its submission's media", () => {
    for (const comment of fixtureData.feedbackComments) {
      const submission = submissions.get(feedback.get(comment.feedbackId)?.submissionId ?? "");
      const asset = media.get(submission?.mediaId ?? "");
      expect(asset).toBeDefined();
      expect(comment.tSeconds).toBeLessThan(asset?.durationSec ?? 0);
    }
  });
});

describe("review queue against the turnaround promise (journal decision 32)", () => {
  // Any now: fixture times are offsets from it, so the queue never goes stale.
  const NOWS = [
    TEST_NOW,
    new Date("2020-02-29T00:00:00.000Z"),
    new Date("2027-06-30T23:59:59.999Z"),
    new Date("2040-12-31T17:45:00.000Z"),
  ];

  it.each(NOWS)("has every item within its SLA, exactly one due soon, at %s", async (now) => {
    const repos = createFixtureRepositories({ now });
    const queue = (
      await Promise.all(fixtureData.coaches.map((c) => repos.submissions.queueForCoach(c.id)))
    ).flat();
    expect(queue.length).toBeGreaterThanOrEqual(3);
    const states = await Promise.all(
      queue.map(async (submission) => {
        const enrolment = await repos.enrolments.get(submission.enrolmentId);
        const coach = await repos.coaches.get(enrolment?.coachId ?? "");
        return reviewSla(submission.submittedAt, now.getTime(), coach?.turnaroundHours).state;
      }),
    );
    expect(states).not.toContain("overdue");
    expect(states.filter((state) => state === "due_soon")).toHaveLength(1);
  });

  it("puts the due-soon item in the demo coach's queue", async () => {
    const repos = createFixtureRepositories({ now: TEST_NOW });
    const queue = await repos.submissions.queueForCoach(DEMO_COACH_ID);
    expect(
      queue.map((s) => reviewSla(s.submittedAt, TEST_NOW.getTime()).state),
    ).toContain("due_soon");
  });
});

describe("createFixtureRepositories", () => {
  it("lists coaches", async () => {
    const repos = createFixtureRepositories({ now: TEST_NOW });
    const coaches = await repos.coaches.list();
    expect(coaches.map((c) => c.displayName)).toEqual(["Singology founder", "Standard coach"]);
  });

  it("returns copies that cannot mutate the fixtures", async () => {
    const repos = createFixtureRepositories({ now: TEST_NOW });
    const [coach] = await repos.coaches.list();
    expect(coach).toBeDefined();
    if (coach) {
      coach.displayName = "Mutated";
    }
    const [again] = await repos.coaches.list();
    expect(again?.displayName).toBe("Singology founder");
  });

  it("filters the library by category and voice type", async () => {
    const repos = createFixtureRepositories({ now: TEST_NOW });
    expect(await repos.library.list({ category: "range" })).toHaveLength(2);
    const bass = await repos.library.list({ voiceType: "bass" });
    expect(bass.every((i) => i.voiceTypes.includes("bass"))).toBe(true);
    expect(bass.length).toBeLessThan(8);
  });

  it("lists a student's feedback newest first", async () => {
    const repos = createFixtureRepositories({ now: TEST_NOW });
    const items = await repos.feedback.forStudent(DEMO_STUDENT_ID);
    expect(items.map((f) => f.id)).toEqual(["fb-ada-siren-2", "fb-ada-siren-1"]);
    expect(await repos.feedback.forStudent("student-ben")).toEqual([]);
  });

  it("resolves fixture times against the now it is given", async () => {
    const now = new Date("2031-01-15T08:00:00.000Z");
    const repos = createFixtureRepositories({ now });
    const [oldest] = await repos.submissions.queueForCoach(DEMO_COACH_ID);
    expect(oldest?.submittedAt).toBe(
      new Date(now.getTime() - 62 * 60 * 60 * 1000).toISOString(),
    );
  });

  it("queues a coach's unreviewed submissions oldest first", async () => {
    const repos = createFixtureRepositories({ now: TEST_NOW });
    const queue = await repos.submissions.queueForCoach("coach-founder");
    expect(queue.map((s) => s.id)).toEqual(["sub-ben-hiss", "sub-ada-onset"]);
  });
});

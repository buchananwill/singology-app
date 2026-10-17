// Integration tests for createDrizzleRepositories against the test project, which the globalSetup
// reseeds before the run (`pnpm --filter @singology/db test:db`).
import {
  CoachSchema,
  CollectionSchema,
  EnrolmentSchema,
  LibraryItemSchema,
  MediaAssetSchema,
  MeSchema,
  type RegisterMedia,
  SubmissionSchema,
} from "@singology/shared";
import { and, eq } from "drizzle-orm";
import { afterAll, assert, beforeAll, describe, expect, it } from "vitest";

import { connectionSettingsFromUrl, createAdminDb, type Db } from "../../src/admin";
import { authenticatedClaims, createUserDb } from "../../src/client";
import { createDrizzleRepositories } from "../../src/drizzle/createDrizzleRepositories";
import { requireEnv } from "../../src/env";
import type { Repositories } from "../../src/repositories";
import { events, feedback, mediaAssets, submissions } from "../../src/schema";
import { CTO_EMAIL, FOUNDER_EMAIL } from "../../src/seed/alphaCast";
import { fixtureUuid } from "../../src/seed/fixtureUuid";
import { userIdByEmail } from "../../src/seed/userIdByEmail";

const settings = connectionSettingsFromUrl(requireEnv("DATABASE_URL"));
const startedAt = new Date();
const CTO_AS_ADA_ENROLMENT_ID = fixtureUuid("enrol-ada");

let admin: Db;
let founderId: string;
let ctoId: string;
let asFounder: Repositories;
let asCto: Repositories;
let asAnon: Repositories;
const takes: string[] = [];

const upload = (storeKey: string): RegisterMedia => ({
  kind: "audio",
  store: "local",
  storeKey,
  originalFileName: "take.m4a",
  sizeBytes: 1000,
  mimeType: "audio/mp4",
});

/** Stands in for the media job (decision 25): only adminDb makes an asset ready. */
async function markReady(mediaId: string, submissionId?: string) {
  await admin
    .update(mediaAssets)
    .set({
      status: "ready",
      src: "/media/student-take-a.m4a",
      peaksSrc: "/media/student-take-a.peaks.json",
      durationSec: 76.6,
    })
    .where(eq(mediaAssets.id, mediaId));
  if (submissionId !== undefined) {
    await admin
      .update(submissions)
      .set({ status: "awaiting_review" })
      .where(eq(submissions.id, submissionId));
  }
}

async function userId(email: string): Promise<string> {
  const id = await userIdByEmail(admin, email);
  assert(id, `the seed created ${email}`);
  return id;
}

beforeAll(async () => {
  admin = createAdminDb(settings);
  founderId = await userId(FOUNDER_EMAIL);
  ctoId = await userId(CTO_EMAIL);
  const repos = (sub?: string) =>
    createDrizzleRepositories(
      createUserDb(settings, sub === undefined ? { role: "anon" } : authenticatedClaims(sub)),
      { now: startedAt },
    );
  asFounder = repos(founderId);
  asCto = repos(ctoId);
  asAnon = repos();
});

afterAll(async () => {
  await admin.$client.end();
});

describe("reads", () => {
  it("reads the caller's own profile and roles, and nothing for anon", async () => {
    const cto = await asCto.me.get();
    expect(MeSchema.parse(cto)).toEqual(cto);
    expect(cto?.profile).toEqual({ id: ctoId, displayName: "Singology CTO" });
    expect(cto?.student?.id).toBe(ctoId);
    expect(cto?.coach?.id).toBe(ctoId);
    const founder = await asFounder.me.get();
    expect(founder?.student).toBeNull();
    expect(founder?.coach?.displayName).toBe("Singology founder");
    expect(await asAnon.me.get()).toBeNull();
  });

  it("queues the facade's two awaiting takes for the founder, oldest first", async () => {
    const queue = await asFounder.submissions.queueViewForCoach(founderId);
    expect(queue.map((row) => row.submission.id)).toEqual([
      fixtureUuid("sub-ben-hiss"),
      fixtureUuid("sub-ada-onset"),
    ]);
    expect(queue.map((row) => row.student.displayName)).toEqual(["Ben Sample", "Singology CTO"]);
  });

  it("lists active coaches with their offers", async () => {
    const rows = await asCto.coaches.listWithOffers();
    expect(rows.map((row) => row.coach.id).sort()).toEqual([founderId, ctoId].sort());
    for (const row of rows) {
      CoachSchema.parse(row.coach);
      expect(row.offers.map((o) => o.billing)).toEqual(["monthly", "single"]);
    }
  });

  it("lists both active coaches with their names for anon, the founder tier first", async () => {
    const rows = await asAnon.coaches.listWithOffers();
    expect(rows.map((row) => row.coach.id).sort()).toEqual([founderId, ctoId].sort());
    expect(rows.map((row) => row.coach.displayName)).toEqual([
      "Singology founder",
      "Singology CTO",
    ]);
  });

  it("gets a coach and a student", async () => {
    expect((await asCto.coaches.get(founderId))?.displayName).toBe("Singology founder");
    expect((await asFounder.students.get(ctoId))?.voiceType).toBeDefined();
    expect(await asFounder.students.get(founderId)).toBeUndefined();
  });

  it("lists the student's enrolment", async () => {
    const [enrolment, ...rest] = await asCto.enrolments.forStudent(ctoId);
    expect(rest).toEqual([]);
    expect(EnrolmentSchema.parse(enrolment).id).toBe(CTO_AS_ADA_ENROLMENT_ID);
  });

  it("lists and filters the library", async () => {
    const all = await asCto.library.list();
    expect(all).toHaveLength(8);
    LibraryItemSchema.array().parse(all);
    expect(await asCto.library.list({ category: "range" })).toHaveLength(2);
    const beginner = await asCto.library.list({ difficulty: "beginner" });
    expect(beginner.map((i) => i.title).sort()).toEqual(
      ["Balanced onsets on 'ah'", "Lip trill on one breath", "Sustained hiss"].sort(),
    );
    const legato = await asCto.library.list({ tag: "legato" });
    expect(legato.length).toBeGreaterThan(0);
    expect(legato.every((i) => i.tags.some((t) => t.slug === "legato"))).toBe(true);
    const bass = await asCto.library.list({ voiceType: "bass" });
    expect(bass.every((i) => i.voiceTypes.includes("bass"))).toBe(true);
    expect(bass.length).toBeLessThan(8);
  });

  it("gets library items, many in the order asked", async () => {
    expect((await asCto.library.get(fixtureUuid("lib-breath-hiss")))?.title).toBe("Sustained hiss");
    const items = await asCto.library.getMany([
      fixtureUuid("lib-range-siren"),
      fixtureUuid("no-such-item"),
      fixtureUuid("lib-breath-hiss"),
    ]);
    expect(items.map((i) => i.id)).toEqual([
      fixtureUuid("lib-range-siren"),
      fixtureUuid("lib-breath-hiss"),
    ]);
    expect(await asCto.library.getMany([])).toEqual([]);
  });

  it("lists collections in order with their items in order", async () => {
    const collections = await asCto.library.listCollections();
    CollectionSchema.array().parse(collections);
    expect(collections.map((c) => c.title)).toEqual(["Foundations", "Range and agility"]);
    expect(collections[1]?.itemIds[0]).toBe(fixtureUuid("lib-range-siren"));
  });

  it("gets ready media, many in the order asked", async () => {
    const video = await asCto.media.get(fixtureUuid("media-test-pattern"));
    expect(MediaAssetSchema.parse(video).hlsSrc).toBe("/media/test-pattern-hls/index.m3u8");
    const assets = await asCto.media.getMany([
      fixtureUuid("media-coach-reply"),
      fixtureUuid("media-backing-track"),
    ]);
    expect(assets.map((a) => a.id)).toEqual([
      fixtureUuid("media-coach-reply"),
      fixtureUuid("media-backing-track"),
    ]);
  });

  it("lets anon read nothing but the public coach tables", async () => {
    await expect(asAnon.library.list()).rejects.toMatchObject({ cause: { code: "42501" } });
  });
});

describe("the coaching loop", () => {
  let firstTake: string;
  let secondTake: string;
  let feedbackId: string;

  it("registers a pending upload that reads as missing until it is ready", async () => {
    const { id } = await asCto.media.register(upload("tests/first.m4a"));
    expect(await asCto.media.get(id)).toBeUndefined();
    firstTake = id;
  });

  it("creates a processing submission", async () => {
    const submission = await asCto.submissions.create({
      enrolmentId: CTO_AS_ADA_ENROLMENT_ID,
      libraryItemId: fixtureUuid("lib-breath-hiss"),
      mediaId: firstTake,
      note: "Integration test take",
    });
    takes.push(submission.id);
    expect(SubmissionSchema.parse(submission).status).toBe("processing");
    await markReady(firstTake, submission.id);
    expect((await asCto.submissions.forStudent(ctoId)).map((s) => s.id)).toContain(submission.id);
    expect(await asCto.media.get(firstTake)).toBeDefined();
  });

  it("rejects a take on someone else's media or the wrong exercise", async () => {
    await expect(
      asCto.submissions.create({
        enrolmentId: CTO_AS_ADA_ENROLMENT_ID,
        libraryItemId: fixtureUuid("lib-breath-hiss"),
        mediaId: fixtureUuid("media-student-take-a"),
        note: "",
      }),
    ).rejects.toThrow();
  });

  it("queues the take for the coach, with student, exercise and media kind", async () => {
    const [submissionId] = takes;
    const queue = await asFounder.submissions.queueViewForCoach(founderId);
    const row = queue.find((r) => r.submission.id === submissionId);
    assert(row, "the take is in the founder's queue");
    expect(row.student.id).toBe(ctoId);
    expect(row.item.id).toBe(fixtureUuid("lib-breath-hiss"));
    expect(row.mediaKind).toBe("audio");
    const ctoQueue = await asCto.submissions.queueViewForCoach(ctoId);
    expect(ctoQueue.map((r) => r.submission.id)).not.toContain(submissionId);
  });

  it("gets the submission for its student and its coach only", async () => {
    const [submissionId] = takes;
    assert(submissionId, "a submission was created");
    expect((await asCto.submissions.getForStudent(ctoId, submissionId))?.enrolment.id).toBe(
      CTO_AS_ADA_ENROLMENT_ID,
    );
    expect((await asFounder.submissions.getForCoach(founderId, submissionId))?.submission.id).toBe(
      submissionId,
    );
    expect(await asCto.submissions.getForCoach(ctoId, submissionId)).toBeUndefined();
  });

  it("sends a whole review in one transaction", async () => {
    const [submissionId] = takes;
    assert(submissionId, "a submission was created");
    const { id: replyId } = await asFounder.media.register(upload("tests/reply.m4a"));
    const sent = await asFounder.feedback.send({
      intent: "send",
      submissionId,
      summary: "Steadier air.",
      comments: [
        { tSeconds: 20, body: "Here it wobbles." },
        { tSeconds: 4, body: "Good start." },
      ],
      reply: null,
      replyMediaId: replyId,
      assignLibraryItemIds: [fixtureUuid("lib-breath-lip-trill")],
    });
    feedbackId = sent.feedback.id;
    expect(sent.feedback.coachId).toBe(founderId);
    expect(sent.comments.map((c) => c.tSeconds)).toEqual([4, 20]);
    expect(await asCto.feedback.forSubmissionWithComments(submissionId)).toEqual(sent);
    expect(await asCto.feedback.comments(feedbackId)).toEqual(sent.comments);
    expect((await asCto.feedback.forStudent(ctoId))[0]?.id).toBe(feedbackId);
    const owned = await asCto.submissions.getForStudent(ctoId, submissionId);
    expect(owned?.submission.status).toBe("reviewed");
    const assigned = await asCto.assignments.forStudent(ctoId);
    expect(
      assigned.some(
        (a) => a.libraryItemId === fixtureUuid("lib-breath-lip-trill") && a.status === "todo",
      ),
    ).toBe(true);
    const fromReview = await asFounder.assignments.forFeedback(feedbackId);
    expect(fromReview.map((a) => [a.libraryItemId, a.feedbackId])).toEqual([
      [fixtureUuid("lib-breath-lip-trill"), feedbackId],
    ]);
  });

  it("lists a seeded review's assignments for its coach and its student only", async () => {
    const benReview = fixtureUuid("fb-ben-hiss-1");
    expect((await asFounder.assignments.forFeedback(benReview)).map((a) => a.id)).toEqual([
      fixtureUuid("asg-ben-hiss"),
    ]);
    expect(await asCto.assignments.forFeedback(benReview)).toEqual([]);
    const adaReview = fixtureUuid("fb-ada-siren-1");
    const inOrder = [fixtureUuid("asg-ada-siren-2"), fixtureUuid("asg-ada-onset")];
    expect((await asCto.assignments.forFeedback(adaReview)).map((a) => a.id)).toEqual(inOrder);
    expect((await asFounder.assignments.forFeedback(adaReview)).map((a) => a.id)).toEqual(inOrder);
  });

  it("rolls the whole review back when any part fails", async () => {
    const [submissionId] = takes;
    assert(submissionId, "a submission was created");
    await expect(
      asFounder.feedback.send({
        intent: "send",
        submissionId,
        summary: "A second review",
        comments: [],
        reply: null,
        assignLibraryItemIds: [],
      }),
    ).rejects.toThrow();
    const rows = await admin.select().from(feedback).where(eq(feedback.submissionId, submissionId));
    expect(rows).toHaveLength(1);
  });

  it("derives assignment status from the submissions that reference it", async () => {
    const todo = (await asCto.assignments.forStudent(ctoId)).find(
      (a) => a.libraryItemId === fixtureUuid("lib-breath-lip-trill"),
    );
    assert(todo, "the review assigned the lip trill");
    const { id } = await asCto.media.register(upload("tests/assigned.m4a"));
    const take = await asCto.submissions.create({
      enrolmentId: CTO_AS_ADA_ENROLMENT_ID,
      assignmentId: todo.id,
      libraryItemId: fixtureUuid("lib-breath-lip-trill"),
      mediaId: id,
      note: "",
    });
    takes.push(take.id);
    const after = (await asCto.assignments.forStudent(ctoId)).find((a) => a.id === todo.id);
    expect(after?.status).toBe("submitted");
    await expect(
      asCto.submissions.create({
        enrolmentId: CTO_AS_ADA_ENROLMENT_ID,
        assignmentId: todo.id,
        libraryItemId: fixtureUuid("lib-breath-hiss"),
        mediaId: id,
        note: "",
      }),
    ).rejects.toThrow(/different enrolment or exercise/);
  });

  it("finds the previous take of the same exercise", async () => {
    const { id } = await asCto.media.register(upload("tests/second.m4a"));
    const second = await asCto.submissions.create({
      enrolmentId: CTO_AS_ADA_ENROLMENT_ID,
      libraryItemId: fixtureUuid("lib-breath-hiss"),
      mediaId: id,
      note: "Second go",
    });
    takes.push(second.id);
    secondTake = second.id;
    expect((await asFounder.submissions.previousFor(secondTake))?.id).toBe(takes[0]);
  });

  it("records the caller's own event", async () => {
    await asCto.events.record({
      kind: "feedback_viewed",
      entityId: secondTake,
      meta: { feedbackId },
    });
    const rows = await admin
      .select()
      .from(events)
      .where(and(eq(events.userId, ctoId), eq(events.kind, "feedback_viewed")));
    expect(rows.some((row) => row.at >= startedAt)).toBe(true);
    await expect(asAnon.events.record({ kind: "signed_in" })).rejects.toThrow();
  });
});

import {
  AssignmentSchema,
  CoachOfferSchema,
  CoachSchema,
  CollectionSchema,
  EnrolmentSchema,
  FeedbackCommentSchema,
  FeedbackSchema,
  LibraryItemSchema,
  MediaAssetSchema,
  MeSchema,
  StudentSchema,
  SubmissionSchema,
  TagSchema,
} from "@singology/shared";
import { describe, expect, it } from "vitest";

import type { assignments, mediaAssets, tags } from "../schema";
import {
  type Row,
  toAssignment,
  toCoach,
  toCoachOffer,
  toCollection,
  toEnrolment,
  toFeedback,
  toFeedbackComment,
  toLibraryItem,
  toMe,
  toMediaAsset,
  toStudent,
  toSubmission,
  toTag,
} from "./mappers";

const at = new Date("2026-10-16T09:30:00.000Z");
const timestamps = { createdAt: at, updatedAt: at };
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const readyMedia = {
  id: uuid(1),
  kind: "audio",
  ownerUserId: null,
  store: "local",
  storeKey: "/media/take.m4a",
  status: "ready",
  src: "/media/take.m4a",
  hlsSrc: null,
  peaksSrc: "/media/take.peaks.json",
  durationSec: 76.6,
  originalFileName: "",
  sizeBytes: null,
  mimeType: null,
  failureReason: null,
  ...timestamps,
} satisfies Row<typeof mediaAssets>;

const assignmentRow = {
  id: uuid(9),
  enrolmentId: uuid(6),
  libraryItemId: uuid(7),
  assignedAt: at,
  feedbackId: null,
  createdAt: at,
} satisfies Row<typeof assignments>;

const tagRow = {
  id: uuid(2),
  kind: "focus",
  slug: "legato",
  label: "Legato",
  position: 0,
  ...timestamps,
} satisfies Row<typeof tags>;

describe("mappers", () => {
  it("project identity rows onto the shared schemas", () => {
    const coach = toCoach(
      {
        userId: uuid(3),
        tier: "premium",
        bio: "",
        avatarSrc: "/avatars/coach-founder.svg",
        turnaroundHours: 72,
        active: true,
        ...timestamps,
      },
      "Founder",
    );
    expect(CoachSchema.parse(coach)).toEqual(coach);

    const offer = toCoachOffer({
      id: uuid(4),
      coachId: uuid(3),
      tier: "premium",
      name: "Monthly coaching",
      billing: "monthly",
      pricePence: 8000,
      submissionsPerPeriod: 4,
      active: true,
      ...timestamps,
    });
    expect(CoachOfferSchema.parse(offer)).toEqual(offer);

    const student = toStudent({ userId: uuid(5), voiceType: "mezzo", ...timestamps }, "Ada");
    expect(StudentSchema.parse(student)).toEqual(student);

    const profileRow = { id: uuid(5), displayName: "Ada", ...timestamps };
    const me = toMe(profileRow, { userId: uuid(5), voiceType: "mezzo", ...timestamps }, null);
    expect(MeSchema.parse(me)).toEqual(me);
    expect(me).toEqual({ profile: { id: uuid(5), displayName: "Ada" }, student, coach: null });
    const coachOnly = toMe(profileRow, null, {
      userId: uuid(5),
      tier: "standard",
      bio: "",
      avatarSrc: "/avatars/coach-standard.svg",
      turnaroundHours: 72,
      active: false,
      ...timestamps,
    });
    expect(MeSchema.parse(coachOnly)).toEqual(coachOnly);
    expect(coachOnly.coach?.displayName).toBe("Ada");
    expect(coachOnly.student).toBeNull();

    const enrolment = toEnrolment({
      id: uuid(6),
      studentId: uuid(5),
      coachId: uuid(3),
      offerId: uuid(4),
      status: "active",
      startedAt: at,
      endedAt: null,
      createdAt: at,
    });
    expect(EnrolmentSchema.parse(enrolment)).toEqual(enrolment);
    expect(enrolment.startedAt).toBe("2026-10-16T09:30:00.000Z");
  });

  it("project library rows onto the shared schemas", () => {
    const tag = toTag(tagRow);
    expect(TagSchema.parse(tag)).toEqual(tag);
    expect(() => toTag({ ...tagRow, kind: "colour" })).toThrow();

    const item = toLibraryItem(
      {
        id: uuid(7),
        title: "Siren slides",
        category: "range",
        difficulty: "improver",
        voiceTypes: ["mezzo", "tenor"],
        instructions: "Slide.",
        demoMediaId: uuid(1),
        backingTrackMediaId: null,
        ownerCoachId: null,
        active: true,
        ...timestamps,
      },
      [tag],
    );
    expect(LibraryItemSchema.parse(item)).toEqual(item);
    expect(item.backingTrackMediaId).toBeUndefined();

    const collection = toCollection(
      {
        id: uuid(8),
        title: "Foundations",
        description: "",
        ownerCoachId: null,
        position: 0,
        active: true,
        ...timestamps,
      },
      [uuid(7)],
    );
    expect(CollectionSchema.parse(collection)).toEqual(collection);
  });

  it("project a ready media row and refuse one that is not ready", () => {
    const asset = toMediaAsset(readyMedia);
    expect(MediaAssetSchema.parse(asset)).toEqual(asset);
    expect(asset.hlsSrc).toBeUndefined();
    expect(() =>
      toMediaAsset({ ...readyMedia, status: "pending", peaksSrc: null, durationSec: null }),
    ).toThrow();
  });

  it("project coaching rows onto the shared schemas", () => {
    const assignment = toAssignment(assignmentRow, "todo");
    expect(AssignmentSchema.parse(assignment)).toEqual(assignment);
    expect(assignment.feedbackId).toBeUndefined();
    expect(toAssignment({ ...assignmentRow, feedbackId: uuid(11) }, "todo").feedbackId).toBe(
      uuid(11),
    );

    const submission = toSubmission({
      id: uuid(10),
      enrolmentId: uuid(6),
      assignmentId: null,
      libraryItemId: uuid(7),
      mediaId: uuid(1),
      note: "",
      submittedAt: at,
      status: "processing",
      createdAt: at,
    });
    expect(SubmissionSchema.parse(submission)).toEqual(submission);
    expect(submission.assignmentId).toBeUndefined();

    const sent = toFeedback({
      id: uuid(11),
      submissionId: uuid(10),
      coachId: uuid(3),
      body: "Good.",
      replyMediaId: uuid(1),
      sentAt: at,
      createdAt: at,
    });
    expect(FeedbackSchema.parse(sent)).toEqual(sent);

    const comment = toFeedbackComment({
      id: uuid(12),
      feedbackId: uuid(11),
      tSeconds: 4.5,
      body: "Nice.",
      createdAt: at,
    });
    expect(FeedbackCommentSchema.parse(comment)).toEqual(comment);
  });
});

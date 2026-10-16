import {
  type Assignment,
  type AssignmentStatus,
  type Coach,
  type CoachOffer,
  type Collection,
  type Enrolment,
  type Feedback,
  type FeedbackComment,
  type LibraryItem,
  type MediaAsset,
  type Student,
  type Submission,
  type Tag,
  TagKindSchema,
} from "@singology/shared";

import type {
  assignments,
  coaches,
  coachOffers,
  collections,
  enrolments,
  feedback,
  feedbackComments,
  libraryItems,
  mediaAssets,
  students,
  submissions,
  tags,
} from "../schema";

export type Row<T extends { $inferSelect: unknown }> = T["$inferSelect"];

const iso = (date: Date) => date.toISOString();
const optional = <T>(value: T | null): T | undefined => value ?? undefined;

export function toCoach(row: Row<typeof coaches>, displayName: string): Coach {
  return {
    id: row.userId,
    displayName,
    tier: row.tier,
    bio: row.bio,
    avatarSrc: row.avatarSrc,
    turnaroundHours: row.turnaroundHours,
  };
}

export function toCoachOffer(row: Row<typeof coachOffers>): CoachOffer {
  return {
    id: row.id,
    coachId: row.coachId,
    tier: row.tier,
    name: row.name,
    billing: row.billing,
    pricePence: row.pricePence,
    submissionsPerPeriod: row.submissionsPerPeriod,
  };
}

export function toStudent(row: Row<typeof students>, displayName: string): Student {
  return { id: row.userId, displayName, voiceType: row.voiceType };
}

export function toEnrolment(row: Row<typeof enrolments>): Enrolment {
  return {
    id: row.id,
    studentId: row.studentId,
    coachId: row.coachId,
    offerId: row.offerId,
    status: row.status,
    startedAt: iso(row.startedAt),
  };
}

// `kind` is text in the database (decision 80), so it is checked on the way out.
export function toTag(row: Row<typeof tags>): Tag {
  return { kind: TagKindSchema.parse(row.kind), slug: row.slug, label: row.label };
}

export function toLibraryItem(row: Row<typeof libraryItems>, itemTags: Tag[]): LibraryItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    voiceTypes: row.voiceTypes,
    tags: itemTags,
    instructions: row.instructions,
    demoMediaId: row.demoMediaId,
    backingTrackMediaId: optional(row.backingTrackMediaId),
  };
}

export function toCollection(row: Row<typeof collections>, itemIds: string[]): Collection {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    position: row.position,
    itemIds,
  };
}

export function toMediaAsset(row: Row<typeof mediaAssets>): MediaAsset {
  if (
    row.status !== "ready" ||
    row.src === null ||
    row.peaksSrc === null ||
    row.durationSec === null
  ) {
    throw new Error(`Media asset ${row.id} is not ready.`);
  }
  return {
    id: row.id,
    kind: row.kind,
    src: row.src,
    hlsSrc: optional(row.hlsSrc),
    peaksSrc: row.peaksSrc,
    durationSec: row.durationSec,
  };
}

export function toAssignment(row: Row<typeof assignments>, status: AssignmentStatus): Assignment {
  return {
    id: row.id,
    enrolmentId: row.enrolmentId,
    libraryItemId: row.libraryItemId,
    assignedAt: iso(row.assignedAt),
    status,
  };
}

export function toSubmission(row: Row<typeof submissions>): Submission {
  return {
    id: row.id,
    enrolmentId: row.enrolmentId,
    assignmentId: optional(row.assignmentId),
    libraryItemId: row.libraryItemId,
    mediaId: row.mediaId,
    note: row.note,
    submittedAt: iso(row.submittedAt),
    status: row.status,
  };
}

export function toFeedback(row: Row<typeof feedback>): Feedback {
  return {
    id: row.id,
    submissionId: row.submissionId,
    coachId: row.coachId,
    body: row.body,
    replyMediaId: optional(row.replyMediaId),
    sentAt: iso(row.sentAt),
  };
}

export function toFeedbackComment(row: Row<typeof feedbackComments>): FeedbackComment {
  return { id: row.id, feedbackId: row.feedbackId, tSeconds: row.tSeconds, body: row.body };
}

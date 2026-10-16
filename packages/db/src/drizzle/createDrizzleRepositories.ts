import {
  AssignmentStatusSchema,
  type LibraryFilter,
  type LibraryItem,
  type Tag,
} from "@singology/shared";
import { and, arrayContains, asc, desc, eq, exists, inArray, lt, type SQL, sql } from "drizzle-orm";

import type { Transaction, UserDb } from "../client";
import type { Repositories, RepositoryOptions } from "../repositories";
import {
  assignments,
  coaches,
  coachOffers,
  collectionItems,
  collections,
  enrolments,
  events,
  feedback,
  feedbackComments,
  libraryItems,
  libraryItemTags,
  mediaAssets,
  profiles,
  students,
  submissions,
  tags,
} from "../schema";
import {
  toAssignment,
  toCoach,
  toCoachOffer,
  toCollection,
  toEnrolment,
  toFeedback,
  toFeedbackComment,
  toLibraryItem,
  toMediaAsset,
  toStudent,
  toSubmission,
  toTag,
} from "./mappers";

const callerId = sql<string>`(select auth.uid())`;

// Derived, never stored (decision 27): a stored status would be a second copy of submissions.
const assignmentStatus = sql<string>`case
  when exists (
    select 1 from ${submissions} s where s.assignment_id = ${assignments.id} and s.status = 'reviewed'
  ) then 'feedback_ready'
  when exists (select 1 from ${submissions} s where s.assignment_id = ${assignments.id}) then 'submitted'
  else 'todo'
end`;

function inOrder<T extends { id: string }>(rows: readonly T[], ids: readonly string[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

async function tagsByItem(tx: Transaction, itemIds: string[]): Promise<Map<string, Tag[]>> {
  const byItem = new Map<string, Tag[]>();
  if (itemIds.length === 0) {
    return byItem;
  }
  const rows = await tx
    .select({ itemId: libraryItemTags.libraryItemId, tag: tags })
    .from(libraryItemTags)
    .innerJoin(tags, eq(tags.id, libraryItemTags.tagId))
    .where(inArray(libraryItemTags.libraryItemId, itemIds))
    .orderBy(asc(tags.position), asc(tags.label));
  for (const { itemId, tag } of rows) {
    byItem.set(itemId, [...(byItem.get(itemId) ?? []), toTag(tag)]);
  }
  return byItem;
}

async function libraryItemsWhere(tx: Transaction, where: SQL | undefined): Promise<LibraryItem[]> {
  const rows = await tx
    .select()
    .from(libraryItems)
    .where(and(eq(libraryItems.active, true), where))
    .orderBy(asc(libraryItems.category), asc(libraryItems.difficulty), asc(libraryItems.title));
  const itemTags = await tagsByItem(
    tx,
    rows.map((row) => row.id),
  );
  return rows.map((row) => toLibraryItem(row, itemTags.get(row.id) ?? []));
}

function libraryFilter(filter: LibraryFilter | undefined): SQL | undefined {
  return and(
    filter?.category === undefined ? undefined : eq(libraryItems.category, filter.category),
    filter?.voiceType === undefined
      ? undefined
      : arrayContains(libraryItems.voiceTypes, [filter.voiceType]),
    filter?.difficulty === undefined ? undefined : eq(libraryItems.difficulty, filter.difficulty),
    filter?.tag === undefined
      ? undefined
      : exists(
          sql`select 1 from ${libraryItemTags} lit join ${tags} t on t.id = lit.tag_id
              where lit.library_item_id = ${libraryItems.id} and t.slug = ${filter.tag}`,
        ),
  );
}

async function ownedSubmission(
  tx: Transaction,
  owner: typeof enrolments.studentId | typeof enrolments.coachId,
  ownerId: string,
  submissionId: string,
) {
  const [row] = await tx
    .select({ submission: submissions, enrolment: enrolments })
    .from(submissions)
    .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
    .where(and(eq(submissions.id, submissionId), eq(owner, ownerId)));
  return row && { submission: toSubmission(row.submission), enrolment: toEnrolment(row.enrolment) };
}

async function commentsFor(tx: Transaction, feedbackId: string) {
  const rows = await tx
    .select()
    .from(feedbackComments)
    .where(eq(feedbackComments.feedbackId, feedbackId))
    .orderBy(asc(feedbackComments.tSeconds), asc(feedbackComments.createdAt));
  return rows.map(toFeedbackComment);
}

/** `options` is accepted for parity with the fixtures and ignored: the database holds real times. */
export function createDrizzleRepositories(db: UserDb, _options: RepositoryOptions): Repositories {
  return {
    coaches: {
      listWithOffers: () =>
        db(async (tx) => {
          const coachRows = await tx
            .select({ coach: coaches, displayName: profiles.displayName })
            .from(coaches)
            .innerJoin(profiles, eq(profiles.id, coaches.userId))
            .where(eq(coaches.active, true))
            .orderBy(asc(coaches.createdAt), asc(coaches.userId));
          const offerRows = await tx
            .select()
            .from(coachOffers)
            .where(
              and(
                eq(coachOffers.active, true),
                inArray(
                  coachOffers.coachId,
                  coachRows.map((row) => row.coach.userId),
                ),
              ),
            )
            .orderBy(asc(coachOffers.billing), desc(coachOffers.pricePence));
          return coachRows.map(({ coach, displayName }) => ({
            coach: toCoach(coach, displayName),
            offers: offerRows.filter((o) => o.coachId === coach.userId).map(toCoachOffer),
          }));
        }),
      get: (id) =>
        db(async (tx) => {
          const [row] = await tx
            .select({ coach: coaches, displayName: profiles.displayName })
            .from(coaches)
            .innerJoin(profiles, eq(profiles.id, coaches.userId))
            .where(eq(coaches.userId, id));
          return row && toCoach(row.coach, row.displayName);
        }),
    },
    students: {
      get: (id) =>
        db(async (tx) => {
          const [row] = await tx
            .select({ student: students, displayName: profiles.displayName })
            .from(students)
            .innerJoin(profiles, eq(profiles.id, students.userId))
            .where(eq(students.userId, id));
          return row && toStudent(row.student, row.displayName);
        }),
    },
    enrolments: {
      forStudent: (studentId) =>
        db(async (tx) => {
          const rows = await tx
            .select()
            .from(enrolments)
            .where(eq(enrolments.studentId, studentId))
            .orderBy(desc(enrolments.startedAt));
          return rows.map(toEnrolment);
        }),
    },
    library: {
      list: (filter) => db((tx) => libraryItemsWhere(tx, libraryFilter(filter))),
      get: (id) =>
        db(async (tx) => {
          const [item] = await libraryItemsWhere(tx, eq(libraryItems.id, id));
          return item;
        }),
      getMany: (ids) =>
        ids.length === 0
          ? Promise.resolve([])
          : db(async (tx) =>
              inOrder(await libraryItemsWhere(tx, inArray(libraryItems.id, [...ids])), ids),
            ),
      listCollections: () =>
        db(async (tx) => {
          const rows = await tx
            .select()
            .from(collections)
            .where(eq(collections.active, true))
            .orderBy(asc(collections.position), asc(collections.title));
          const items =
            rows.length === 0
              ? []
              : await tx
                  .select()
                  .from(collectionItems)
                  .where(
                    inArray(
                      collectionItems.collectionId,
                      rows.map((row) => row.id),
                    ),
                  )
                  .orderBy(asc(collectionItems.position));
          return rows.map((row) =>
            toCollection(
              row,
              items.filter((i) => i.collectionId === row.id).map((i) => i.libraryItemId),
            ),
          );
        }),
    },
    media: {
      get: (id) =>
        db(async (tx) => {
          const [row] = await tx
            .select()
            .from(mediaAssets)
            .where(and(eq(mediaAssets.id, id), eq(mediaAssets.status, "ready")));
          return row && toMediaAsset(row);
        }),
      getMany: (ids) =>
        ids.length === 0
          ? Promise.resolve([])
          : db(async (tx) => {
              const rows = await tx
                .select()
                .from(mediaAssets)
                .where(and(inArray(mediaAssets.id, [...ids]), eq(mediaAssets.status, "ready")));
              return inOrder(rows.map(toMediaAsset), ids);
            }),
      register: (input) =>
        db(async (tx) => {
          const [row] = await tx
            .insert(mediaAssets)
            .values({ ...input, ownerUserId: callerId, status: "pending" })
            .returning({ id: mediaAssets.id });
          if (row === undefined) {
            throw new Error("The media asset was not registered.");
          }
          return row;
        }),
    },
    assignments: {
      forStudent: (studentId) =>
        db(async (tx) => {
          const rows = await tx
            .select({ assignment: assignments, status: assignmentStatus })
            .from(assignments)
            .innerJoin(enrolments, eq(enrolments.id, assignments.enrolmentId))
            .where(eq(enrolments.studentId, studentId))
            .orderBy(asc(assignments.assignedAt), asc(assignments.createdAt));
          return rows.map((row) =>
            toAssignment(row.assignment, AssignmentStatusSchema.parse(row.status)),
          );
        }),
    },
    submissions: {
      getForStudent: (studentId, submissionId) =>
        db((tx) => ownedSubmission(tx, enrolments.studentId, studentId, submissionId)),
      getForCoach: (coachId, submissionId) =>
        db((tx) => ownedSubmission(tx, enrolments.coachId, coachId, submissionId)),
      forStudent: (studentId) =>
        db(async (tx) => {
          const rows = await tx
            .select({ submission: submissions })
            .from(submissions)
            .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
            .where(eq(enrolments.studentId, studentId))
            .orderBy(asc(submissions.submittedAt));
          return rows.map((row) => toSubmission(row.submission));
        }),
      queueViewForCoach: (coachId) =>
        db(async (tx) => {
          const rows = await tx
            .select({
              submission: submissions,
              student: students,
              displayName: profiles.displayName,
              mediaKind: mediaAssets.kind,
            })
            .from(submissions)
            .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
            .innerJoin(students, eq(students.userId, enrolments.studentId))
            .innerJoin(profiles, eq(profiles.id, students.userId))
            .innerJoin(mediaAssets, eq(mediaAssets.id, submissions.mediaId))
            .where(and(eq(enrolments.coachId, coachId), eq(submissions.status, "awaiting_review")))
            .orderBy(asc(submissions.submittedAt));
          const items = await libraryItemsWhere(
            tx,
            inArray(libraryItems.id, [...new Set(rows.map((row) => row.submission.libraryItemId))]),
          );
          return rows.flatMap((row) => {
            const item = items.find((i) => i.id === row.submission.libraryItemId);
            return item === undefined
              ? []
              : [
                  {
                    submission: toSubmission(row.submission),
                    student: toStudent(row.student, row.displayName),
                    item,
                    mediaKind: row.mediaKind,
                  },
                ];
          });
        }),
      previousFor: (submissionId) =>
        db(async (tx) => {
          const [current] = await tx
            .select({ submission: submissions, studentId: enrolments.studentId })
            .from(submissions)
            .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
            .where(eq(submissions.id, submissionId));
          if (current === undefined) {
            return undefined;
          }
          const [previous] = await tx
            .select({ submission: submissions })
            .from(submissions)
            .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
            .where(
              and(
                eq(enrolments.studentId, current.studentId),
                eq(submissions.libraryItemId, current.submission.libraryItemId),
                lt(submissions.submittedAt, current.submission.submittedAt),
              ),
            )
            .orderBy(desc(submissions.submittedAt))
            .limit(1);
          return previous && toSubmission(previous.submission);
        }),
      create: (input) =>
        db(async (tx) => {
          if (input.assignmentId !== undefined) {
            const [assignment] = await tx
              .select()
              .from(assignments)
              .where(eq(assignments.id, input.assignmentId));
            if (
              assignment?.enrolmentId !== input.enrolmentId ||
              assignment.libraryItemId !== input.libraryItemId
            ) {
              throw new Error("The assignment is for a different enrolment or exercise.");
            }
          }
          const [media] = await tx
            .select({ id: mediaAssets.id })
            .from(mediaAssets)
            .where(and(eq(mediaAssets.id, input.mediaId), eq(mediaAssets.ownerUserId, callerId)));
          if (media === undefined) {
            throw new Error("The submission's media is not the caller's upload.");
          }
          // The insert policy checks the enrolment is the caller's and active.
          const [row] = await tx.insert(submissions).values(input).returning();
          if (row === undefined) {
            throw new Error("The submission was not created.");
          }
          return toSubmission(row);
        }),
    },
    feedback: {
      forSubmissionWithComments: (submissionId) =>
        db(async (tx) => {
          const [row] = await tx
            .select()
            .from(feedback)
            .where(eq(feedback.submissionId, submissionId));
          return row && { feedback: toFeedback(row), comments: await commentsFor(tx, row.id) };
        }),
      forStudent: (studentId) =>
        db(async (tx) => {
          const rows = await tx
            .select({ feedback })
            .from(feedback)
            .innerJoin(submissions, eq(submissions.id, feedback.submissionId))
            .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
            .where(eq(enrolments.studentId, studentId))
            .orderBy(desc(feedback.sentAt));
          return rows.map((row) => toFeedback(row.feedback));
        }),
      comments: (feedbackId) => db((tx) => commentsFor(tx, feedbackId)),
      send: (input) =>
        db(async (tx) => {
          const [target] = await tx
            .select({ enrolmentId: enrolments.id, coachId: enrolments.coachId })
            .from(submissions)
            .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
            .where(and(eq(submissions.id, input.submissionId), eq(enrolments.coachId, callerId)));
          if (target === undefined) {
            throw new Error("The submission is not one of the caller's students'.");
          }
          if (input.replyMediaId !== undefined) {
            const [reply] = await tx
              .select({ id: mediaAssets.id })
              .from(mediaAssets)
              .where(
                and(eq(mediaAssets.id, input.replyMediaId), eq(mediaAssets.ownerUserId, callerId)),
              );
            if (reply === undefined) {
              throw new Error("The reply media is not the caller's upload.");
            }
          }
          const [row] = await tx
            .insert(feedback)
            .values({
              submissionId: input.submissionId,
              coachId: target.coachId,
              body: input.summary,
              replyMediaId: input.replyMediaId,
            })
            .returning();
          if (row === undefined) {
            throw new Error("The feedback was not created.");
          }
          if (input.comments.length > 0) {
            await tx
              .insert(feedbackComments)
              .values(input.comments.map((comment) => ({ ...comment, feedbackId: row.id })));
          }
          await tx
            .update(submissions)
            .set({ status: "reviewed" })
            .where(eq(submissions.id, input.submissionId));
          if (input.assignLibraryItemIds.length > 0) {
            await tx.insert(assignments).values(
              input.assignLibraryItemIds.map((libraryItemId) => ({
                enrolmentId: target.enrolmentId,
                libraryItemId,
                feedbackId: row.id,
              })),
            );
          }
          return { feedback: toFeedback(row), comments: await commentsFor(tx, row.id) };
        }),
    },
    events: {
      record: (input) =>
        db(async (tx) => {
          await tx.insert(events).values({
            userId: callerId,
            kind: input.kind,
            entityId: input.entityId,
            meta: input.meta ?? {},
          });
        }),
    },
  };
}

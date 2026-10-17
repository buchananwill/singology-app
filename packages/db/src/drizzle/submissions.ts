import { indexById } from "@singology/shared";
import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import type { SelectResultFields } from "drizzle-orm/query-builders/select.types";

import { assertAssignmentMatches } from "../assertAssignmentMatches";
import type { Transaction, UserDb } from "../client";
import type { EnrolmentParty } from "../enrolmentParty";
import { firstOrThrow } from "../orThrow";
import type {
  CoachQueueItem,
  OwnedSubmission,
  ReviewedQueueItem,
  SubmissionRepository,
} from "../repositories";
import {
  assignments,
  enrolments,
  feedback,
  libraryItems,
  mediaAssets,
  profiles,
  students,
  submissions,
} from "../schema";
import { libraryItemsWhere } from "./library";
import { toEnrolment, toFeedback, toStudent, toSubmission } from "./mappers";
import { assertCallersMedia } from "./queries";

async function ownedSubmission(
  tx: Transaction,
  party: EnrolmentParty,
  partyId: string,
  submissionId: string,
): Promise<OwnedSubmission | undefined> {
  const [row] = await tx
    .select({ submission: submissions, enrolment: enrolments })
    .from(submissions)
    .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
    .where(and(eq(submissions.id, submissionId), eq(enrolments[party], partyId)));
  return row && { submission: toSubmission(row.submission), enrolment: toEnrolment(row.enrolment) };
}

const queueFields = {
  submission: submissions,
  student: students,
  displayName: profiles.displayName,
  mediaKind: mediaAssets.kind,
};

type QueueRow = SelectResultFields<typeof queueFields>;

async function toQueueItems<TRow extends QueueRow, TItem>(
  tx: Transaction,
  rows: TRow[],
  extend: (row: TRow, item: CoachQueueItem) => TItem,
): Promise<TItem[]> {
  const items = indexById(
    await libraryItemsWhere(
      tx,
      inArray(libraryItems.id, [...new Set(rows.map((row) => row.submission.libraryItemId))]),
    ),
  );
  return rows.flatMap((row): TItem[] => {
    const item = items.get(row.submission.libraryItemId);
    return item === undefined
      ? []
      : [
          extend(row, {
            submission: toSubmission(row.submission),
            student: toStudent(row.student, row.displayName),
            item,
            mediaKind: row.mediaKind,
          }),
        ];
  });
}

export function drizzleSubmissions(db: UserDb): SubmissionRepository {
  return {
    getForStudent: (studentId, submissionId) =>
      db((tx) => ownedSubmission(tx, "studentId", studentId, submissionId)),
    getForCoach: (coachId, submissionId) =>
      db((tx) => ownedSubmission(tx, "coachId", coachId, submissionId)),
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
          .select(queueFields)
          .from(submissions)
          .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
          .innerJoin(students, eq(students.userId, enrolments.studentId))
          .innerJoin(profiles, eq(profiles.id, students.userId))
          .innerJoin(mediaAssets, eq(mediaAssets.id, submissions.mediaId))
          .where(and(eq(enrolments.coachId, coachId), eq(submissions.status, "awaiting_review")))
          .orderBy(asc(submissions.submittedAt));
        return toQueueItems(tx, rows, (_, item) => item);
      }),
    recentlyReviewedForCoach: (coachId, limit) =>
      db(async (tx) => {
        const rows = await tx
          .select({ ...queueFields, feedback })
          .from(submissions)
          .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
          .innerJoin(students, eq(students.userId, enrolments.studentId))
          .innerJoin(profiles, eq(profiles.id, students.userId))
          .innerJoin(mediaAssets, eq(mediaAssets.id, submissions.mediaId))
          .innerJoin(feedback, eq(feedback.submissionId, submissions.id))
          .where(and(eq(enrolments.coachId, coachId), eq(submissions.status, "reviewed")))
          .orderBy(desc(feedback.sentAt))
          .limit(limit);
        return toQueueItems(tx, rows, (row, item): ReviewedQueueItem => ({
          ...item,
          sentAt: toFeedback(row.feedback).sentAt,
        }));
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
          assertAssignmentMatches(assignment, input);
        }
        await assertCallersMedia(
          tx,
          input.mediaId,
          "The submission's media is not the caller's upload.",
        );
        // The insert policy checks the enrolment is the caller's and active.
        const row = firstOrThrow(
          await tx.insert(submissions).values(input).returning(),
          "The submission was not created.",
        );
        return toSubmission(row);
      }),
  };
}

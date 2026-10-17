import { groupBy } from "@singology/shared";
import { inArray, notInArray } from "drizzle-orm";

import type { Transaction } from "../client";
import type { FixtureData } from "../fixtures/data";
import {
  assignments,
  enrolments,
  events,
  feedback,
  feedbackComments,
  notifications,
  submissions,
} from "../schema";
import { fixtureUuid } from "./fixtureUuid";

export type UserOfFixture = (fixtureId: string) => string;

const optionalUuid = (fixtureId: string | undefined) =>
  fixtureId === undefined ? null : fixtureUuid(fixtureId);

/**
 * Empties the coaching tables and reloads the fixture coaching data, with its times resolved
 * against this seed run, so every run ends in the same state as the facade's fixtures.
 */
export async function loadCoaching(
  tx: Transaction,
  fixtures: FixtureData,
  userOf: UserOfFixture,
): Promise<void> {
  await tx.delete(feedbackComments);
  await tx.delete(feedback);
  await tx.delete(submissions);
  await tx.delete(assignments);
  await tx.delete(events);
  await tx.delete(notifications);

  // An enrolment from an earlier cast would hold the student's one active enrolment.
  const enrolmentIds = fixtures.enrolments.map((enrolment) => fixtureUuid(enrolment.id));
  await tx.delete(enrolments).where(notInArray(enrolments.id, enrolmentIds));
  for (const enrolment of fixtures.enrolments) {
    const row = {
      id: fixtureUuid(enrolment.id),
      studentId: userOf(enrolment.studentId),
      coachId: userOf(enrolment.coachId),
      offerId: fixtureUuid(enrolment.offerId),
      status: enrolment.status,
      startedAt: new Date(enrolment.startedAt),
      endedAt: null,
    };
    await tx.insert(enrolments).values(row).onConflictDoUpdate({ target: enrolments.id, set: row });
  }

  await tx.insert(assignments).values(
    fixtures.assignments.map((assignment) => ({
      id: fixtureUuid(assignment.id),
      enrolmentId: fixtureUuid(assignment.enrolmentId),
      libraryItemId: fixtureUuid(assignment.libraryItemId),
      assignedAt: new Date(assignment.assignedAt),
    })),
  );
  await tx.insert(submissions).values(
    fixtures.submissions.map((submission) => ({
      id: fixtureUuid(submission.id),
      enrolmentId: fixtureUuid(submission.enrolmentId),
      assignmentId: optionalUuid(submission.assignmentId),
      libraryItemId: fixtureUuid(submission.libraryItemId),
      mediaId: fixtureUuid(submission.mediaId),
      note: submission.note,
      submittedAt: new Date(submission.submittedAt),
      status: submission.status,
    })),
  );
  await tx.insert(feedback).values(
    fixtures.feedback.map((sent) => ({
      id: fixtureUuid(sent.id),
      submissionId: fixtureUuid(sent.submissionId),
      coachId: userOf(sent.coachId),
      body: sent.body,
      replyMediaId: optionalUuid(sent.replyMediaId),
      sentAt: new Date(sent.sentAt),
    })),
  );
  await tx.insert(feedbackComments).values(
    fixtures.feedbackComments.map((comment) => ({
      id: fixtureUuid(comment.id),
      feedbackId: fixtureUuid(comment.feedbackId),
      tSeconds: comment.tSeconds,
      body: comment.body,
    })),
  );

  // Linked last: assignments, submissions and feedback reference each other in a cycle.
  const fromFeedback = groupBy(
    fixtures.assignments.filter((assignment) => assignment.feedbackId !== undefined),
    (assignment) => assignment.feedbackId,
  );
  for (const [feedbackId, assigned] of fromFeedback) {
    await tx
      .update(assignments)
      .set({ feedbackId: optionalUuid(feedbackId) })
      .where(
        inArray(
          assignments.id,
          assigned.map((assignment) => fixtureUuid(assignment.id)),
        ),
      );
  }
}

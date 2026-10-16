import { and, asc, desc, eq } from "drizzle-orm";
import { authUid } from "drizzle-orm/supabase";

import type { Transaction, UserDb } from "../client";
import type { FeedbackRepository } from "../repositories";
import { assignments, enrolments, feedback, feedbackComments, submissions } from "../schema";
import { toFeedback, toFeedbackComment } from "./mappers";
import { assertCallersMedia, firstOrThrow } from "./queries";

async function commentsFor(tx: Transaction, feedbackId: string) {
  const rows = await tx
    .select()
    .from(feedbackComments)
    .where(eq(feedbackComments.feedbackId, feedbackId))
    .orderBy(asc(feedbackComments.tSeconds), asc(feedbackComments.createdAt));
  return rows.map(toFeedbackComment);
}

export function drizzleFeedback(db: UserDb): FeedbackRepository {
  return {
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
        const target = firstOrThrow(
          await tx
            .select({ enrolmentId: enrolments.id, coachId: enrolments.coachId })
            .from(submissions)
            .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
            .where(and(eq(submissions.id, input.submissionId), eq(enrolments.coachId, authUid))),
          "The submission is not one of the caller's students'.",
        );
        if (input.replyMediaId !== undefined) {
          await assertCallersMedia(
            tx,
            input.replyMediaId,
            "The reply media is not the caller's upload.",
          );
        }
        const row = firstOrThrow(
          await tx
            .insert(feedback)
            .values({
              submissionId: input.submissionId,
              coachId: target.coachId,
              body: input.summary,
              replyMediaId: input.replyMediaId,
            })
            .returning(),
          "The feedback was not created.",
        );
        // An empty insert is a syntax error, not a no-op.
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
  };
}

import type { Feedback, FeedbackComment } from "@singology/shared";

import type { FeedbackRepository } from "../../repositories";
import { enrolmentIdsFor, type FixtureState } from "../state";

export function fixtureFeedback(state: FixtureState): FeedbackRepository {
  const { data } = state;
  const commentsFor = (feedbackId: string) =>
    data.feedbackComments
      .filter((c) => c.feedbackId === feedbackId)
      .sort((a, b) => a.tSeconds - b.tSeconds);

  return {
    forSubmissionWithComments: async (submissionId) => {
      const feedback = data.feedback.find((f) => f.submissionId === submissionId);
      return feedback === undefined
        ? undefined
        : structuredClone({ feedback, comments: commentsFor(feedback.id) });
    },
    forStudent: async (studentId) => {
      const enrolmentIds = enrolmentIdsFor(state, "studentId", studentId);
      const submissionIds = new Set(
        data.submissions.filter((s) => enrolmentIds.has(s.enrolmentId)).map((s) => s.id),
      );
      return structuredClone(
        data.feedback
          .filter((f) => submissionIds.has(f.submissionId))
          .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
      );
    },
    comments: async (feedbackId) => structuredClone(commentsFor(feedbackId)),
    send: async (input) => {
      const submission = data.submissions.find((s) => s.id === input.submissionId);
      const enrolment = data.enrolments.find((e) => e.id === submission?.enrolmentId);
      if (submission === undefined || enrolment === undefined) {
        throw new Error("No such submission.");
      }
      if (data.feedback.some((f) => f.submissionId === submission.id)) {
        throw new Error("This submission already has feedback.");
      }
      const feedback: Feedback = {
        id: crypto.randomUUID(),
        submissionId: submission.id,
        coachId: enrolment.coachId,
        body: input.summary,
        replyMediaId: input.replyMediaId,
        sentAt: state.nowIso,
      };
      const comments = input.comments.map((comment): FeedbackComment => ({
        id: crypto.randomUUID(),
        feedbackId: feedback.id,
        ...comment,
      }));
      data.feedback.push(feedback);
      data.feedbackComments.push(...comments);
      submission.status = "reviewed";
      data.assignments.push(
        ...input.assignLibraryItemIds.map((libraryItemId) => ({
          id: crypto.randomUUID(),
          enrolmentId: enrolment.id,
          libraryItemId,
          assignedAt: state.nowIso,
        })),
      );
      return structuredClone({ feedback, comments: commentsFor(feedback.id) });
    },
  };
}

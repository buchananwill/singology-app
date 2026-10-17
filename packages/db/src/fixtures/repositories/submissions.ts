import { indexById, type Submission } from "@singology/shared";

import { assertAssignmentMatches } from "../../assertAssignmentMatches";
import type {
  CoachQueueItem,
  OwnedSubmission,
  ReviewedQueueItem,
  SubmissionRepository,
} from "../../repositories";
import type { EnrolmentParty } from "../../enrolmentParty";
import { enrolmentIdsFor, type FixtureState } from "../state";

export function fixtureSubmissions(state: FixtureState): SubmissionRepository {
  const { data } = state;

  const ownedSubmission = (
    party: EnrolmentParty,
    partyId: string,
    submissionId: string,
  ): OwnedSubmission | undefined => {
    const submission = data.submissions.find((s) => s.id === submissionId);
    const enrolment = data.enrolments.find((e) => e.id === submission?.enrolmentId);
    return submission && enrolment?.[party] === partyId
      ? structuredClone({ submission, enrolment })
      : undefined;
  };

  const toQueueItems = <TRow extends { submission: Submission }, TItem>(
    rows: TRow[],
    extend: (row: TRow, item: CoachQueueItem) => TItem,
  ): TItem[] => {
    const enrolments = indexById(data.enrolments);
    const students = indexById(data.students);
    const items = indexById(data.libraryItems);
    const media = indexById(data.mediaAssets);
    return rows.flatMap((row): TItem[] => {
      const { submission } = row;
      const studentId = enrolments.get(submission.enrolmentId)?.studentId;
      const student = studentId === undefined ? undefined : students.get(studentId);
      const item = items.get(submission.libraryItemId);
      const asset = media.get(submission.mediaId);
      return student && item && asset
        ? [extend(row, { submission, student, item, mediaKind: asset.kind })]
        : [];
    });
  };

  return {
    getForStudent: async (studentId, submissionId) =>
      ownedSubmission("studentId", studentId, submissionId),
    getForCoach: async (coachId, submissionId) => ownedSubmission("coachId", coachId, submissionId),
    forStudent: async (studentId) => {
      const enrolmentIds = enrolmentIdsFor(state, "studentId", studentId);
      return structuredClone(data.submissions.filter((s) => enrolmentIds.has(s.enrolmentId)));
    },
    queueViewForCoach: async (coachId) => {
      const enrolmentIds = enrolmentIdsFor(state, "coachId", coachId);
      return structuredClone(
        toQueueItems(
          data.submissions
            .filter((s) => s.status === "awaiting_review" && enrolmentIds.has(s.enrolmentId))
            .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
            .map((submission) => ({ submission })),
          (_, item) => item,
        ),
      );
    },
    recentlyReviewedForCoach: async (coachId, limit) => {
      const enrolmentIds = enrolmentIdsFor(state, "coachId", coachId);
      const submissions = indexById(data.submissions);
      return structuredClone(
        toQueueItems(
          data.feedback
            .flatMap((sent) => {
              const submission = submissions.get(sent.submissionId);
              return submission?.status === "reviewed" && enrolmentIds.has(submission.enrolmentId)
                ? [{ submission, sent }]
                : [];
            })
            .sort((a, b) => b.sent.sentAt.localeCompare(a.sent.sentAt))
            .slice(0, limit),
          ({ sent }, item): ReviewedQueueItem => ({ ...item, sentAt: sent.sentAt }),
        ),
      );
    },
    previousFor: async (submissionId) => {
      const current = data.submissions.find((s) => s.id === submissionId);
      const studentId = data.enrolments.find((e) => e.id === current?.enrolmentId)?.studentId;
      if (current === undefined || studentId === undefined) {
        return undefined;
      }
      const enrolmentIds = enrolmentIdsFor(state, "studentId", studentId);
      const [previous] = data.submissions
        .filter(
          (s) =>
            enrolmentIds.has(s.enrolmentId) &&
            s.libraryItemId === current.libraryItemId &&
            s.submittedAt < current.submittedAt,
        )
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      return structuredClone(previous);
    },
    create: async (input) => {
      const enrolment = data.enrolments.find((e) => e.id === input.enrolmentId);
      if (enrolment?.status !== "active") {
        throw new Error("No active enrolment for this submission.");
      }
      const knownMedia =
        state.pendingMediaIds.has(input.mediaId) ||
        data.mediaAssets.some((m) => m.id === input.mediaId);
      if (!knownMedia) {
        throw new Error("The submission's media is not registered.");
      }
      if (input.assignmentId !== undefined) {
        assertAssignmentMatches(
          data.assignments.find((a) => a.id === input.assignmentId),
          input,
        );
      }
      const submission: Submission = {
        id: crypto.randomUUID(),
        enrolmentId: input.enrolmentId,
        assignmentId: input.assignmentId,
        libraryItemId: input.libraryItemId,
        mediaId: input.mediaId,
        note: input.note,
        submittedAt: state.nowIso,
        status: "processing",
      };
      data.submissions.push(submission);
      return structuredClone(submission);
    },
  };
}

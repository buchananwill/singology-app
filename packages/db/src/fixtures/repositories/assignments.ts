import type { AssignmentRepository } from "../../repositories";
import type { FixtureData } from "../data";
import { assignmentStatusFrom, enrolmentIdsFor, type FixtureState } from "../state";

type FixtureAssignment = FixtureData["assignments"][number];

export function fixtureAssignments(state: FixtureState): AssignmentRepository {
  const withStatus = (matches: (assignment: FixtureAssignment) => boolean) =>
    structuredClone(
      state.data.assignments
        .filter(matches)
        // The array is in creation order, so the stable sort breaks a tie as `created_at` does.
        .toSorted((a, b) => a.assignedAt.localeCompare(b.assignedAt))
        .map((a) => ({ ...a, status: assignmentStatusFrom(state.data.submissions, a.id) })),
    );
  return {
    forStudent: async (studentId) => {
      const enrolmentIds = enrolmentIdsFor(state, "studentId", studentId);
      return withStatus((a) => enrolmentIds.has(a.enrolmentId));
    },
    forFeedback: async (feedbackId) => withStatus((a) => a.feedbackId === feedbackId),
  };
}

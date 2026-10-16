import type { AssignmentRepository } from "../../repositories";
import { assignmentStatusFrom, enrolmentIdsFor, type FixtureState } from "../state";

export function fixtureAssignments(state: FixtureState): AssignmentRepository {
  return {
    forStudent: async (studentId) => {
      const enrolmentIds = enrolmentIdsFor(state, "studentId", studentId);
      return structuredClone(
        state.data.assignments
          .filter((a) => enrolmentIds.has(a.enrolmentId))
          .map((a) => ({ ...a, status: assignmentStatusFrom(state.data.submissions, a.id) })),
      );
    },
  };
}

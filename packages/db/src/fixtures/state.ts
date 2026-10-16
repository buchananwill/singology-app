import type { AssignmentStatus, RecordEvent, Submission } from "@singology/shared";

import type { FixtureData } from "./data";

/** One request's own copy of the fixtures, which its writes change. */
export interface FixtureState {
  data: FixtureData;
  nowIso: string;
  pendingMediaIds: Set<string>;
  events: RecordEvent[];
}

export type EnrolmentParty = "studentId" | "coachId";

export function enrolmentIdsFor(
  state: FixtureState,
  party: EnrolmentParty,
  partyId: string,
): Set<string> {
  return new Set(state.data.enrolments.filter((e) => e[party] === partyId).map((e) => e.id));
}

/** The same rule as the database's derived status (decision 27). */
export function assignmentStatusFrom(
  submissions: readonly Submission[],
  assignmentId: string,
): AssignmentStatus {
  const takes = submissions.filter((s) => s.assignmentId === assignmentId);
  if (takes.length === 0) {
    return "todo";
  }
  return takes.some((s) => s.status === "reviewed") ? "feedback_ready" : "submitted";
}

import type { Assignment, CreateSubmission } from "@singology/shared";

/** An assigned take must be on the assignment's enrolment and of the assignment's exercise. */
export function assertAssignmentMatches(
  assignment: Pick<Assignment, "enrolmentId" | "libraryItemId"> | undefined,
  input: Pick<CreateSubmission, "enrolmentId" | "libraryItemId">,
): void {
  if (
    assignment?.enrolmentId !== input.enrolmentId ||
    assignment.libraryItemId !== input.libraryItemId
  ) {
    throw new Error("The assignment is for a different enrolment or exercise.");
  }
}

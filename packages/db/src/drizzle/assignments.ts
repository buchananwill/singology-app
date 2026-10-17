import type { AssignmentStatus, SubmissionStatus } from "@singology/shared";
import { asc, eq, sql } from "drizzle-orm";

import type { UserDb } from "../client";
import type { AssignmentRepository } from "../repositories";
import { assignments, enrolments, submissions } from "../schema";
import { toAssignment } from "./mappers";

// Derived, never stored (decision 27). Raw SQL because the query builder has no CASE; the
// statuses are bound parameters checked against the shared types, so they cannot drift.
const assignmentStatus = sql<AssignmentStatus>`case
  when exists (
    select 1 from ${submissions}
    where ${submissions.assignmentId} = ${assignments.id}
      and ${submissions.status} = ${"reviewed" satisfies SubmissionStatus}
  ) then ${"feedback_ready" satisfies AssignmentStatus}
  when exists (
    select 1 from ${submissions} where ${submissions.assignmentId} = ${assignments.id}
  ) then ${"submitted" satisfies AssignmentStatus}
  else ${"todo" satisfies AssignmentStatus}
end`;

export function drizzleAssignments(db: UserDb): AssignmentRepository {
  return {
    forStudent: (studentId) =>
      db(async (tx) => {
        const rows = await tx
          .select({ assignment: assignments, status: assignmentStatus })
          .from(assignments)
          .innerJoin(enrolments, eq(enrolments.id, assignments.enrolmentId))
          .where(eq(enrolments.studentId, studentId))
          .orderBy(asc(assignments.assignedAt), asc(assignments.createdAt));
        return rows.map((row) => toAssignment(row.assignment, row.status));
      }),
    forFeedback: (feedbackId) =>
      db(async (tx) => {
        const rows = await tx
          .select({ assignment: assignments, status: assignmentStatus })
          .from(assignments)
          .where(eq(assignments.feedbackId, feedbackId))
          .orderBy(asc(assignments.assignedAt), asc(assignments.createdAt));
        return rows.map((row) => toAssignment(row.assignment, row.status));
      }),
  };
}

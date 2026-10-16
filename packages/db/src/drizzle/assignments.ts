import type { AssignmentStatus } from "@singology/shared";
import { asc, eq, sql } from "drizzle-orm";

import type { UserDb } from "../client";
import type { AssignmentRepository } from "../repositories";
import { assignments, enrolments, submissions } from "../schema";
import { toAssignment } from "./mappers";

// Derived, never stored (decision 27). Raw SQL because the query builder has no CASE.
const assignmentStatus = sql<AssignmentStatus>`case
  when exists (
    select 1 from ${submissions} s where s.assignment_id = ${assignments.id} and s.status = 'reviewed'
  ) then 'feedback_ready'
  when exists (select 1 from ${submissions} s where s.assignment_id = ${assignments.id}) then 'submitted'
  else 'todo'
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
  };
}

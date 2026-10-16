import { desc, eq } from "drizzle-orm";

import type { UserDb } from "../client";
import type { EnrolmentRepository } from "../repositories";
import { enrolments } from "../schema";
import { toEnrolment } from "./mappers";

export function drizzleEnrolments(db: UserDb): EnrolmentRepository {
  return {
    forStudent: (studentId) =>
      db(async (tx) => {
        const rows = await tx
          .select()
          .from(enrolments)
          .where(eq(enrolments.studentId, studentId))
          .orderBy(desc(enrolments.startedAt));
        return rows.map(toEnrolment);
      }),
  };
}

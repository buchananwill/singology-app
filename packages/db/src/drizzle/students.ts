import { eq } from "drizzle-orm";

import type { UserDb } from "../client";
import type { StudentRepository } from "../repositories";
import { profiles, students } from "../schema";
import { toStudent } from "./mappers";

export function drizzleStudents(db: UserDb): StudentRepository {
  return {
    get: (id) =>
      db(async (tx) => {
        const [row] = await tx
          .select({ student: students, displayName: profiles.displayName })
          .from(students)
          .innerJoin(profiles, eq(profiles.id, students.userId))
          .where(eq(students.userId, id));
        return row && toStudent(row.student, row.displayName);
      }),
  };
}

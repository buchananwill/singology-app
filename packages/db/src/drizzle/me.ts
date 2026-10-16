import { eq, sql } from "drizzle-orm";
import { authUid } from "drizzle-orm/supabase";

import type { UserDb } from "../client";
import type { MeRepository } from "../repositories";
import { coaches, profiles, students } from "../schema";
import { toMe } from "./mappers";

export function drizzleMe(db: UserDb): MeRepository {
  return {
    get: () =>
      db(async (tx) => {
        // anon holds no grant on the role tables, so it must not reach the join.
        const { rows } = await tx.execute<{ uid: string | null }>(sql`select ${authUid} as uid`);
        if (rows[0]?.uid == null) {
          return null;
        }
        const [row] = await tx
          .select({ profile: profiles, student: students, coach: coaches })
          .from(profiles)
          .leftJoin(students, eq(students.userId, profiles.id))
          .leftJoin(coaches, eq(coaches.userId, profiles.id))
          .where(eq(profiles.id, authUid));
        return row ? toMe(row.profile, row.student, row.coach) : null;
      }),
  };
}

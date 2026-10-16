import { eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import type { Db } from "../client";

export async function userIdByEmail(
  db: Db,
  email: string,
): Promise<(typeof authUsers.$inferSelect)["id"] | undefined> {
  const [row] = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, email));
  return row?.id;
}

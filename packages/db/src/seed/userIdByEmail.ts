import { eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import type { Db } from "../client";

export type UserId = (typeof authUsers.$inferSelect)["id"];

export async function userIdByEmail(db: Db, email: string): Promise<UserId | undefined> {
  const [row] = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, email));
  return row?.id;
}

export async function requireUserIdByEmail(db: Db, email: string): Promise<UserId> {
  const id = await userIdByEmail(db, email);
  if (id === undefined) {
    throw new Error(`No user has the address ${email}; run the seed first.`);
  }
  return id;
}

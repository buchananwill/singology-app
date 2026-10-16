import { eq } from "drizzle-orm";

import type { UserDb } from "../client";
import { coaches } from "../schema";

/** The `/lab/db` proof: one RLS transaction from the Worker, readable as `anon`. */
export function countActiveCoaches(db: UserDb): Promise<number> {
  return db((tx) => tx.$count(coaches, eq(coaches.active, true)));
}

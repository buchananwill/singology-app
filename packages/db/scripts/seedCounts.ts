// Row counts per table, e.g. to show that re-running the seed adds nothing.
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import { createAdminDbFromEnv } from "../src/env";
import * as schema from "../src/schema";

const db = createAdminDbFromEnv();
try {
  const tables = [authUsers, ...Object.values(schema).filter((value) => is(value, PgTable))];
  const counts: string[] = [];
  for (const table of tables) {
    counts.push(`${getTableName(table)}=${await db.$count(table)}`);
  }
  console.log(counts.join(" "));
} finally {
  await db.$client.end();
}

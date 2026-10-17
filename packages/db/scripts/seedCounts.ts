// Row counts per table, e.g. to show that re-running the seed adds nothing.
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import { connectionSettingsFromUrl, withAdminDb } from "../src/client";
import { requireEnv } from "../src/env";
import { rethrow } from "../src/orThrow";
import * as schema from "../src/schema";

const counts = await withAdminDb(
  connectionSettingsFromUrl(requireEnv("DATABASE_URL")),
  async (db) => {
    const tables = [authUsers, ...Object.values(schema).filter((value) => is(value, PgTable))];
    const lines: string[] = [];
    for (const table of tables) {
      lines.push(`${getTableName(table)}=${await db.$count(table)}`);
    }
    return lines;
  },
  rethrow,
);
console.log(counts.join(" "));

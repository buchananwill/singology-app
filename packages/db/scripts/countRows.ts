// Diagnostic: row counts per public table and alpha users, e.g. to show a seed re-run adds nothing.
import pg from "pg";

import { requireEnv } from "../src/seed/env";

const TABLES = [
  "profiles",
  "coaches",
  "coach_offers",
  "students",
  "enrolments",
  "media_assets",
  "library_items",
  "tags",
  "library_item_tags",
  "collections",
  "collection_items",
  "assignments",
  "submissions",
  "feedback",
  "feedback_comments",
  "events",
] as const;

const client = new pg.Client({ connectionString: requireEnv("DATABASE_URL") });
await client.connect();
try {
  const counts: string[] = [];
  for (const table of TABLES) {
    const result = await client.query<{ count: number }>(
      `select count(*)::int as count from public.${table}`,
    );
    counts.push(`${table}=${result.rows[0]?.count}`);
  }
  const users = await client.query<{ count: number }>(
    "select count(*)::int as count from auth.users",
  );
  console.log(`auth.users=${users.rows[0]?.count} ${counts.join(" ")}`);
} finally {
  await client.end();
}

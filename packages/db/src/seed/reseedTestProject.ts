import { createAuthAdmin } from "../authAdmin";
import { connectionSettingsFromUrl, createAdminDb } from "../client";
import { assertTestEnv, requireEnv } from "../env";
import { type SeedSummary, seedAlpha } from "./seedAlpha";

/** Puts the test project back to the fixture state; refuses to run against any other project. */
export async function reseedTestProject(): Promise<SeedSummary> {
  assertTestEnv();
  const db = createAdminDb(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
  try {
    return await seedAlpha(db, createAuthAdmin());
  } finally {
    await db.$client.end();
  }
}

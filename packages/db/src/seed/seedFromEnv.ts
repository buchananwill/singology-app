import { createAuthAdmin } from "../authAdmin";
import { connectionSettingsFromUrl, createAdminDb } from "../client";
import { assertTestEnv, requireEnv } from "../env";
import { type SeedSummary, seedAlpha } from "./seedAlpha";

/** Seeds the project the env selects, closing its admin client however the seed ends. */
export async function seedFromEnv(): Promise<SeedSummary> {
  const db = createAdminDb(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
  try {
    return await seedAlpha(db, createAuthAdmin());
  } finally {
    await db.$client.end();
  }
}

/** Refuses to run against any project but the test one. */
export async function reseedTestProject(): Promise<SeedSummary> {
  assertTestEnv();
  return seedFromEnv();
}

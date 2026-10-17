import { createAuthAdmin } from "../authAdmin";
import { connectionSettingsFromUrl, withAdminDb } from "../client";
import { assertTestEnv, requireEnv } from "../env";
import { rethrow } from "../orThrow";
import { type SeedSummary, seedAlpha } from "./seedAlpha";

/** Seeds the project the env selects, closing its admin client however the seed ends. */
export function seedFromEnv(): Promise<SeedSummary> {
  return withAdminDb(
    connectionSettingsFromUrl(requireEnv("DATABASE_URL")),
    (db) => seedAlpha(db, createAuthAdmin()),
    rethrow,
  );
}

/** Refuses to run against any project but the test one. */
export async function reseedTestProject(): Promise<SeedSummary> {
  assertTestEnv();
  return seedFromEnv();
}

import { connectionSettingsFromUrl, createAdminDb, type Db } from "./client";
import { requireEnv } from "./env";

/** For Node scripts and tests: the admin client of the project the env selects. */
export function createAdminDbFromEnv(): Db {
  return createAdminDb(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
}

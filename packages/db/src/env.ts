import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

import { connectionSettingsFromUrl, createAdminDb, type Db } from "./client";

// SINGOLOGY_ENV=test selects the test project, which the e2e suite may wipe; unset is the alpha.
const ENV_FILES = { dev: ".env", test: ".env.test" } as const;

export type EnvName = keyof typeof ENV_FILES;

const ENV_KEYS = ["DATABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_PUBLISHABLE_KEY"] as const;

export type EnvKey = (typeof ENV_KEYS)[number];

function selectedEnv(): EnvName {
  const value = process.env.SINGOLOGY_ENV;
  if (value === undefined || value === "") {
    return "dev";
  }
  if (value !== "test") {
    throw new Error(`SINGOLOGY_ENV must be unset or "test", not "${value}".`);
  }
  return value;
}

/** Throws unless the test project is selected, before anything that wipes or reseeds data. */
export function assertTestEnv(): void {
  if (selectedEnv() !== "test") {
    throw new Error("This runs only against the test project: set SINGOLOGY_ENV=test.");
  }
}

type EnvValues = Partial<Record<EnvKey, string>>;

function pickKeys(source: Record<string, string | undefined>): EnvValues {
  return Object.fromEntries(
    ENV_KEYS.flatMap((key) => {
      const value = source[key];
      return value ? [[key, value]] : [];
    }),
  );
}

/** The file wins over the inherited environment; test never falls back to it. */
export function envValues(name: EnvName, dir: URL): EnvValues {
  const file = new URL(ENV_FILES[name], dir);
  if (!existsSync(file)) {
    if (name === "test") {
      throw new Error(`SINGOLOGY_ENV=test needs packages/db/${ENV_FILES.test}, which is missing.`);
    }
    return pickKeys(process.env);
  }
  const values = parseEnv(readFileSync(file, "utf8"));
  return pickKeys(name === "test" ? values : { ...process.env, ...values });
}

let loaded: EnvValues | undefined;

export function requireEnv(key: EnvKey): string {
  // Resolved on first use: workerd bundles this module and has no file URL to resolve against.
  loaded ??= envValues(selectedEnv(), new URL("../", import.meta.url));
  const value = loaded[key];
  if (!value) {
    throw new Error(`${key} is not set in packages/db/${ENV_FILES[selectedEnv()]}`);
  }
  return value;
}

/** For Node scripts and tests: the admin client of the project the env selects. */
export function createAdminDbFromEnv(): Db {
  return createAdminDb(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
}

/** The Supabase project ref, from the pooler user name `postgres.<ref>`. */
export function projectRefFrom(databaseUrl: string): string {
  const ref = new URL(databaseUrl).username.split(".")[1];
  if (!ref) {
    throw new Error("DATABASE_URL's user is not `postgres.<project-ref>`.");
  }
  return ref;
}

export function supabaseUrlFrom(databaseUrl: string): string {
  return `https://${projectRefFrom(databaseUrl)}.supabase.co`;
}

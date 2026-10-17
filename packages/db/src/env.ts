import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

// SINGOLOGY_ENV=test selects the test project, which the e2e suite may wipe; unset is the alpha.
const ENV_FILES = { dev: ".env", test: ".env.test" } as const;

export type EnvName = keyof typeof ENV_FILES;

export type EnvKey = "DATABASE_URL" | "SUPABASE_SECRET_KEY" | "SUPABASE_PUBLISHABLE_KEY";

const PACKAGE_DIR = new URL("../", import.meta.url);

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

/**
 * The values `requireEnv` reads for `name` from the env files in `dir`. The file wins over the
 * inherited environment (a stale system-level value once shadowed it); the test project has no
 * fallback at all, so a missing file can never send a test run to whatever the shell holds.
 */
export function envValues(name: EnvName, dir: URL): Record<string, string | undefined> {
  const file = new URL(ENV_FILES[name], dir);
  if (!existsSync(file)) {
    if (name === "test") {
      throw new Error(`SINGOLOGY_ENV=test needs packages/db/${ENV_FILES.test}, which is missing.`);
    }
    return process.env;
  }
  const values = parseEnv(readFileSync(file, "utf8"));
  return name === "test" ? values : { ...process.env, ...values };
}

let loaded: Record<string, string | undefined> | undefined;

export function requireEnv(key: EnvKey): string {
  loaded ??= envValues(selectedEnv(), PACKAGE_DIR);
  const value = loaded[key];
  if (!value) {
    throw new Error(`${key} is not set in packages/db/${ENV_FILES[selectedEnv()]}`);
  }
  return value;
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

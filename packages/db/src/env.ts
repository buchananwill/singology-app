import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

// SINGOLOGY_ENV=test selects the test project, which the e2e suite may wipe; unset is the alpha.
const ENV_FILES = { dev: ".env", test: ".env.test" } as const;

type EnvName = keyof typeof ENV_FILES;

export type EnvKey =
  "DATABASE_URL" | "SUPABASE_SECRET_KEY" | "SUPABASE_URL" | "SUPABASE_PUBLISHABLE_KEY";

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

function envFileName(): string {
  return ENV_FILES[selectedEnv()];
}

let loaded = false;

// The selected file overrides the inherited environment.
function loadDbEnv(): void {
  if (loaded) {
    return;
  }
  loaded = true;
  const file = fileURLToPath(new URL(`../${envFileName()}`, import.meta.url));
  if (existsSync(file)) {
    Object.assign(process.env, parseEnv(readFileSync(file, "utf8")));
  }
}

/** Reads a key from the selected `packages/db` env file (or, failing that, the environment). */
export function requireEnv(key: EnvKey): string {
  loadDbEnv();
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set in packages/db/${envFileName()}`);
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

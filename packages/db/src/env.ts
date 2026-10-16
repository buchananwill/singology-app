import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const ENV_FILE = fileURLToPath(new URL("../.env", import.meta.url));

type EnvKey = "DATABASE_URL" | "SUPABASE_SECRET_KEY";

let loaded = false;

// Precedence: packages/db/.env overrides the inherited environment, which once held a stale
// DATABASE_URL; the environment is used only for keys the file does not set.
function loadDbEnv(): void {
  if (loaded) {
    return;
  }
  loaded = true;
  if (existsSync(ENV_FILE)) {
    Object.assign(process.env, parseEnv(readFileSync(ENV_FILE, "utf8")));
  }
}

/** Reads a key from `packages/db/.env` (or, failing that, the environment). */
export function requireEnv(key: EnvKey): string {
  loadDbEnv();
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set in packages/db/.env`);
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

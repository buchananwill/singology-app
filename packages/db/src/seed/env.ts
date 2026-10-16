import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const ENV_FILE = fileURLToPath(new URL("../../.env", import.meta.url));

type EnvKey = "DATABASE_URL" | "SUPABASE_DB_PASSWORD" | "SUPABASE_SECRET_KEY";

let loaded = false;

// Precedence: packages/db/.env overrides the inherited environment (a stale system DATABASE_URL
// once shadowed it; pitfall 18). The environment is used only for keys the file does not set.
export function loadDbEnv(): void {
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

/** `https://<ref>.supabase.co`, from the pooler user name `postgres.<ref>`. */
export function supabaseUrlFrom(databaseUrl: string): string {
  const ref = new URL(databaseUrl).username.split(".")[1];
  if (!ref) {
    throw new Error("DATABASE_URL's user is not `postgres.<project-ref>`.");
  }
  return `https://${ref}.supabase.co`;
}

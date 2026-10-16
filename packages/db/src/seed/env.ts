import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ENV_FILE = fileURLToPath(new URL("../../.env", import.meta.url));

type EnvKey = "DATABASE_URL" | "SUPABASE_SECRET_KEY";

/** Reads a key from `packages/db/.env` (or the environment), for scripts and database tests. */
export function requireEnv(key: EnvKey): string {
  if (process.env[key] === undefined && existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
  }
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

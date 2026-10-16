// The e2e server: the built Worker under `wrangler dev`, against the test project. One file,
// packages/db/.env.test, is the whole test environment: its DATABASE_URL becomes the local
// Hyperdrive string (Wrangler reads that only from the process environment) and its Supabase URL
// and publishable key replace the dev values in wrangler.jsonc. The file is parsed here rather than
// with `node --env-file`, which never overrides a variable already set (a stale system-level
// DATABASE_URL would win).
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseArgs, parseEnv } from "node:util";

const ENV_TEST = new URL("../../../packages/db/.env.test", import.meta.url);
const envTest = parseEnv(readFileSync(ENV_TEST, "utf8"));

function fromEnvTest(key: string): string {
  const value = envTest[key];
  if (!value) {
    throw new Error(`${key} is not set in packages/db/.env.test`);
  }
  return value;
}

const { values } = parseArgs({ options: { port: { type: "string" } } });

const wrangler = spawn(
  process.execPath,
  [
    "node_modules/wrangler/bin/wrangler.js",
    "dev",
    "--config",
    "build/server/wrangler.json",
    "--ip",
    "127.0.0.1",
    ...(values.port === undefined ? [] : ["--port", values.port]),
    "--var",
    `SUPABASE_URL:${fromEnvTest("SUPABASE_URL")}`,
    "--var",
    `SUPABASE_PUBLISHABLE_KEY:${fromEnvTest("SUPABASE_PUBLISHABLE_KEY")}`,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      SINGOLOGY_ENV: "test",
      CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: fromEnvTest("DATABASE_URL"),
    },
  },
);
wrangler.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

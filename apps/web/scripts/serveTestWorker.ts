import { spawn } from "node:child_process";
import { parseArgs } from "node:util";

import { requireEnv, supabaseUrlFrom } from "@singology/db/admin";

process.env.SINGOLOGY_ENV = "test";
const databaseUrl = requireEnv("DATABASE_URL");

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
    `SUPABASE_URL:${supabaseUrlFrom(databaseUrl)}`,
    "--var",
    `SUPABASE_PUBLISHABLE_KEY:${requireEnv("SUPABASE_PUBLISHABLE_KEY")}`,
  ],
  {
    stdio: "inherit",
    // Wrangler reads the local Hyperdrive string only from the process environment.
    env: { ...process.env, CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: databaseUrl },
  },
);
wrangler.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

// Runs the Supabase CLI from the repo root with SUPABASE_DB_PASSWORD taken from packages/db/.env
// (which wins over the inherited environment). `link` gets the project ref from DATABASE_URL.
//   pnpm --filter @singology/db supabase link
//   pnpm --filter @singology/db supabase db push
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { requireEnv } from "../src/seed/env";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const args = process.argv.slice(2);
const ref = new URL(requireEnv("DATABASE_URL")).username.split(".")[1];
const cliArgs = args[0] === "link" && ref !== undefined ? [...args, "--project-ref", ref] : args;

requireEnv("SUPABASE_DB_PASSWORD");
const result = spawnSync("pnpm", ["exec", "supabase", ...cliArgs], {
  cwd: repoRoot,
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exitCode = result.status ?? 1;

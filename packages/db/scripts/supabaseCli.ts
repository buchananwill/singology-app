// Runs the Supabase CLI from the repo root against the alpha database. `db push` and `test db`
// get `--db-url` from DATABASE_URL (the session pooler); `link` gets the project ref from it.
// The CLI's JS launcher runs under node with no shell, so the URL is never parsed by cmd.exe.
//   pnpm --filter @singology/db supabase db push
//   pnpm --filter @singology/db supabase migration list
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { requireEnv } from "../src/seed/env";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const launcher = createRequire(new URL("../../../package.json", import.meta.url)).resolve(
  "supabase/dist/supabase.js",
);
const databaseUrl = requireEnv("DATABASE_URL");
const args = process.argv.slice(2);
const command = args.slice(0, 2).join(" ");

const extra =
  command === "db push" || command === "test db" || command === "migration list"
    ? ["--db-url", databaseUrl]
    : args[0] === "link"
      ? ["--project-ref", new URL(databaseUrl).username.split(".")[1] ?? ""]
      : [];

const result = spawnSync(process.execPath, [launcher, ...args, ...extra], {
  cwd: repoRoot,
  stdio: "inherit",
});
process.exitCode = result.status ?? 1;

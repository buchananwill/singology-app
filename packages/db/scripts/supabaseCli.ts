// Runs the Supabase CLI from the repo root against the alpha database. `db push` and
// `migration list` get `--db-url` from DATABASE_URL (the session pooler); `link` gets the project
// ref from it. The CLI's JS launcher runs under node with no shell, so the URL is never parsed by
// cmd.exe.
//   pnpm --filter @singology/db supabase db push
//   pnpm --filter @singology/db supabase migration list
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { projectRefFrom, requireEnv } from "../src/env";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const launcher = createRequire(new URL("../../../package.json", import.meta.url)).resolve(
  "supabase/dist/supabase.js",
);
const databaseUrl = requireEnv("DATABASE_URL");
const args = process.argv.slice(2);
const command = args.slice(0, 2).join(" ");

const extra =
  command === "db push" || command === "migration list"
    ? ["--db-url", databaseUrl]
    : args[0] === "link"
      ? ["--project-ref", projectRefFrom(databaseUrl)]
      : [];

const result = spawnSync(process.execPath, [launcher, ...args, ...extra], {
  cwd: repoRoot,
  stdio: "inherit",
});
process.exitCode = result.status ?? 1;

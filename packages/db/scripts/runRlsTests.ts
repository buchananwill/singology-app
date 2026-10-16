// Runs supabase/tests/*.sql (pgTAP) against the alpha database without Docker (spec decision 76).
// Each file runs in one transaction with supabase/tests/support/setup.sql first, then rolls back.
//
//   pnpm --filter @singology/db test:rls                 every file
//   pnpm --filter @singology/db test:rls profiles        one file
//   pnpm --filter @singology/db test:rls --mutate        convict each file: it must fail with its
//                                                        policy loosened, then pass as migrated
import { readdir, readFile } from "node:fs/promises";

import pg from "pg";

import { requireEnv } from "../src/seed/env";

const TESTS_DIR = new URL("../../../supabase/tests/", import.meta.url);

// The policies each file guards, loosened or dropped. Each is applied alone inside the test's own
// transaction, so the rollback restores it, and each must make the file fail.
const MUTATIONS: Record<string, string | string[]> = {
  assignments: "alter policy assignments_select_as_coach on public.assignments using (true)",
  coach_offers: "alter policy coach_offers_select_own on public.coach_offers using (true)",
  coaches: "alter policy coaches_select_own on public.coaches using (true)",
  collection_items: "drop policy collection_items_select on public.collection_items",
  collections: "alter policy collections_select_active on public.collections using (true)",
  enrolments: "alter policy enrolments_select_as_coach on public.enrolments using (true)",
  events: "create policy events_leak on public.events for select to authenticated using (true)",
  feedback: "alter policy feedback_select_as_coach on public.feedback using (true)",
  feedback_comments:
    "alter policy feedback_comments_select on public.feedback_comments using (true)",
  library_item_tags: "drop policy library_item_tags_select on public.library_item_tags",
  library_items: "alter policy library_items_select_active on public.library_items using (true)",
  media_assets: "alter policy media_assets_select_own on public.media_assets using (true)",
  notifications:
    "create policy notifications_leak on public.notifications for select to authenticated using (true)",
  profiles: [
    "alter policy profiles_select_own on public.profiles using (true)",
    "alter policy profiles_select_active_coach on public.profiles using (true)",
  ],
  students: "alter policy students_select_by_coach on public.students using (true)",
  submissions: "alter policy submissions_select_as_coach on public.submissions using (true)",
  tags: "drop policy tags_select on public.tags",
};

interface TapResult {
  planned: number;
  passed: number;
  failures: string[];
  error?: string;
}

function parseTap(output: string[]): TapResult {
  const lines = output.flatMap((value) => value.split("\n"));
  const plan = lines.map((line) => /^1\.\.(\d+)$/.exec(line)).find((match) => match !== null);
  return {
    planned: plan ? Number(plan[1]) : 0,
    passed: lines.filter((line) => /^ok \d+/.test(line)).length,
    failures: lines.filter((line) => /^not ok \d+/.test(line)),
  };
}

const isPass = (result: TapResult) =>
  result.error === undefined &&
  result.failures.length === 0 &&
  result.planned > 0 &&
  result.passed === result.planned;

async function runFile(
  client: pg.Client,
  setup: string,
  test: string,
  mutation?: string,
): Promise<TapResult> {
  await client.query("begin");
  try {
    if (mutation !== undefined) {
      await client.query(mutation);
    }
    await client.query(setup);
    const results = [await client.query<Record<string, unknown>>(test)].flat();
    const output = results.flatMap((result) =>
      result.rows.flatMap((row) =>
        Object.values(row).filter((value): value is string => typeof value === "string"),
      ),
    );
    return parseTap(output);
  } catch (error) {
    return { planned: 0, passed: 0, failures: [], error: (error as Error).message };
  } finally {
    await client.query("rollback");
  }
}

function describe(result: TapResult): string {
  if (result.error !== undefined) {
    return `error: ${result.error}`;
  }
  const failed = result.failures.length > 0 ? `; ${result.failures.join("; ")}` : "";
  return `${result.passed}/${result.planned} ok${failed}`;
}

const args = process.argv.slice(2);
const mutate = args.includes("--mutate");
const only = new Set(args.filter((arg) => !arg.startsWith("--")));

const setup = await readFile(new URL("support/setup.sql", TESTS_DIR), "utf8");
const names = (await readdir(TESTS_DIR))
  .filter((file) => file.endsWith(".sql"))
  .map((file) => file.replace(/\.sql$/, ""))
  .filter((name) => only.size === 0 || only.has(name))
  .sort();

const client = new pg.Client({ connectionString: requireEnv("DATABASE_URL") });
await client.connect();
let allGood = true;
try {
  for (const name of names) {
    const test = await readFile(new URL(`${name}.sql`, TESTS_DIR), "utf8");
    const clean = await runFile(client, setup, test);
    if (!mutate) {
      allGood &&= isPass(clean);
      console.log(`${isPass(clean) ? "PASS" : "FAIL"} ${name}: ${describe(clean)}`);
      continue;
    }
    const mutations = [MUTATIONS[name] ?? []].flat();
    if (mutations.length === 0) {
      allGood = false;
      console.log(`FAIL ${name}: no mutation is defined for this file`);
      continue;
    }
    for (const mutation of mutations) {
      const mutated = await runFile(client, setup, test, mutation);
      const convicted = !isPass(mutated) && mutated.error === undefined && isPass(clean);
      allGood &&= convicted;
      console.log(`${convicted ? "CONVICTED" : "NOT CONVICTED"} ${name}`);
      console.log(`  mutated (${mutation}): ${describe(mutated)}`);
      console.log(`  restored: ${describe(clean)}`);
    }
  }
} finally {
  await client.end();
}
process.exitCode = allGood ? 0 : 1;

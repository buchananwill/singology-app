// Runs supabase/tests/<table>.sql (pgTAP) against the alpha database without Docker (spec decision
// 76). Each file runs in one transaction with supabase/tests/support/setup.sql first, then rolls
// back. With --mutate, each <table>.mutation*.sql beside it (a policy loosened or dropped) is applied
// alone inside that transaction and must make the file fail.
//
//   pnpm --filter @singology/db test:rls                 every file
//   pnpm --filter @singology/db test:rls profiles        one file
//   pnpm --filter @singology/db test:rls --mutate        convict every file by its mutations
import { readdir, readFile } from "node:fs/promises";

import { errorMessage } from "@singology/shared";
import pg from "pg";

import { connectionSettingsFromUrl } from "../src/admin";
import { requireEnv } from "../src/env";

const TESTS_DIR = new URL("../../../supabase/tests/", import.meta.url);

interface TapResult {
  planned: number;
  passed: number;
  failures: string[];
  error?: string;
}

type TapRow = Record<string, unknown>;

// pg returns one result per statement for a multi-statement query, and a bare result for one.
function toResultArray(raw: pg.QueryResult<TapRow> | pg.QueryResult<TapRow>[]) {
  return Array.isArray(raw) ? raw : [raw];
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
    const results = toResultArray(await client.query<TapRow>(test));
    const output = results.flatMap((result) =>
      result.rows.flatMap((row) =>
        Object.values(row).filter((value): value is string => typeof value === "string"),
      ),
    );
    return parseTap(output);
  } catch (error) {
    return { planned: 0, passed: 0, failures: [], error: errorMessage(error) };
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

const readTestFile = (file: string) => readFile(new URL(file, TESTS_DIR), "utf8");

const args = process.argv.slice(2);
const mutate = args.includes("--mutate");
const only = new Set(args.filter((arg) => !arg.startsWith("--")));

const files = (await readdir(TESTS_DIR)).filter((file) => file.endsWith(".sql")).sort();
const mutationFiles = files.filter((file) => file.includes(".mutation"));
const names = files
  .filter((file) => !file.includes(".mutation"))
  .map((file) => file.replace(/\.sql$/, ""))
  .filter((name) => only.size === 0 || only.has(name));
const setup = await readTestFile("support/setup.sql");

const client = new pg.Client(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
await client.connect();
let allGood = true;
try {
  for (const name of names) {
    const test = await readTestFile(`${name}.sql`);
    const clean = await runFile(client, setup, test);
    if (!mutate) {
      allGood &&= isPass(clean);
      console.log(`${isPass(clean) ? "PASS" : "FAIL"} ${name}: ${describe(clean)}`);
      continue;
    }
    const own = mutationFiles.filter((file) => file.startsWith(`${name}.mutation`));
    if (own.length === 0) {
      allGood = false;
      console.log(`FAIL ${name}: no ${name}.mutation*.sql beside it`);
      continue;
    }
    for (const file of own) {
      const mutation = (await readTestFile(file)).trim();
      const mutated = await runFile(client, setup, test, mutation);
      const convicted = !isPass(mutated) && mutated.error === undefined && isPass(clean);
      allGood &&= convicted;
      console.log(`${convicted ? "CONVICTED" : "NOT CONVICTED"} ${name} by ${file}`);
      console.log(`  mutated (${mutation}): ${describe(mutated)}`);
      console.log(`  restored: ${describe(clean)}`);
    }
  }
} finally {
  await client.end();
}
process.exitCode = allGood ? 0 : 1;

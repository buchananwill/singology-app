// Spike (spec decisions 43 and 58): does the session pooler honour `set local role` and a
// transaction-local `request.jwt.claims`, so that `auth.uid()` round-trips?
import { randomUUID } from "node:crypto";

import pg from "pg";

import { connectionSettingsFromUrl } from "../src/client";
import { requireEnv } from "../src/seed/env";

const settings = connectionSettingsFromUrl(requireEnv("DATABASE_URL"));

const sub = randomUUID();
const client = new pg.Client(settings);
await client.connect();
try {
  await client.query("begin");
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ role: "authenticated", sub }),
  ]);
  const role = await client.query<{ current_user: string }>("select current_user");
  const uid = await client.query<{ uid: string | null }>("select auth.uid() as uid");
  await client.query("commit");
  const after = await client.query<{ claims: string | null }>(
    "select current_setting('request.jwt.claims', true) as claims",
  );
  const roundTrips = uid.rows[0]?.uid === sub;
  console.log(`current_user inside the transaction: ${role.rows[0]?.current_user}`);
  console.log(`auth.uid() round-trips: ${roundTrips}`);
  console.log(`claims cleared after commit: ${!after.rows[0]?.claims}`);
  process.exitCode = roundTrips ? 0 : 1;
} finally {
  await client.end();
}

import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

/** `$client` is exposed so a script can end the pool when it is done. */
export type Db = NodePgDatabase<typeof schema> & { $client: pg.Pool };
export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type Claims = { role: "anon" } | { role: "authenticated"; sub: string; email?: string };

export type AuthenticatedClaims = Extract<Claims, { role: "authenticated" }>;

export function authenticatedClaims(sub: string, email?: string): AuthenticatedClaims {
  return email === undefined
    ? { role: "authenticated", sub }
    : { role: "authenticated", sub, email };
}

/** Discrete fields, never a URL, so the Worker can pass `env.HYPERDRIVE` straight through. */
export interface ConnectionSettings {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/** For Node scripts, the seed and tests, which hold DATABASE_URL. */
export function connectionSettingsFromUrl(url: string): ConnectionSettings {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port === "" ? 5432 : Number(parsed.port),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.slice(1)) || "postgres",
  };
}

// `env.HYPERDRIVE` also carries `connectionString`, which pg would prefer over the fields.
const pickConnectionFields = ({
  host,
  port,
  user,
  password,
  database,
}: ConnectionSettings): pg.ClientConfig => ({ host, port, user, password, database });

/** One RLS-scoped transaction per call; each repository method is one call. */
export type UserDb = <T>(work: (tx: Transaction) => Promise<T>) => Promise<T>;

// The role is chosen from this whitelist, never interpolated (spec decision 43).
const SET_LOCAL_ROLE = {
  authenticated: sql`set local role authenticated`,
  anon: sql`set local role anon`,
} satisfies Record<Claims["role"], unknown>;

export function createUserDb(settings: ConnectionSettings, claims: Claims): UserDb {
  const config = pickConnectionFields(settings);
  const setRole = SET_LOCAL_ROLE[claims.role];
  const claimsJson = JSON.stringify(claims);
  return async (work) => {
    const client = new pg.Client(config);
    await client.connect();
    try {
      return await drizzle(client, { schema }).transaction(async (tx) => {
        await tx.execute(setRole);
        await tx.execute(sql`select set_config('request.jwt.claims', ${claimsJson}, true)`);
        return work(tx);
      });
    } finally {
      await client.end();
    }
  };
}

/** Bypasses RLS. */
export function createAdminDb(settings: ConnectionSettings): Db {
  return drizzle(new pg.Pool(pickConnectionFields(settings)), { schema });
}

/** Runs `work` on a fresh admin pool and always ends it; a failure to end goes to `onCloseError`. */
export async function withAdminDb<T>(
  settings: ConnectionSettings,
  work: (db: Db) => Promise<T>,
  onCloseError: (error: unknown) => void,
): Promise<T> {
  const db = createAdminDb(settings);
  try {
    return await work(db);
  } finally {
    await db.$client.end().catch(onCloseError);
  }
}

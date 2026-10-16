import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

/** `$client` is exposed so a script can end the pool when it is done. */
export type Db = NodePgDatabase<typeof schema> & { $client: pg.Pool };
export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

export interface Claims {
  role: "authenticated" | "anon";
  sub?: string;
  email?: string;
}

/**
 * Discrete fields, never a URL: the Worker passes `env.HYPERDRIVE` straight through, because local
 * Hyperdrive rebuilds its connection string with the password decoded (pitfall 19).
 */
export type ConnectionSettings = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

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

const pgConfig = ({
  host,
  port,
  user,
  password,
  database,
}: ConnectionSettings): pg.ClientConfig => ({
  host,
  port,
  user,
  password,
  database,
});

/** One RLS-scoped transaction per call; each repository method is one call. */
export type UserDb = <T>(work: (tx: Transaction) => Promise<T>) => Promise<T>;

// The role is chosen from this whitelist, never interpolated (spec decision 43).
const SET_LOCAL_ROLE = {
  authenticated: sql`set local role authenticated`,
  anon: sql`set local role anon`,
} satisfies Record<Claims["role"], unknown>;

export function createUserDb(settings: ConnectionSettings, claims: Claims): UserDb {
  const config = pgConfig(settings);
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

/** Bypasses RLS. Only the routes and jobs that spec decision 61 lists may import it. */
export function createAdminDb(settings: ConnectionSettings): Db {
  return drizzle(new pg.Pool(pgConfig(settings)), { schema });
}

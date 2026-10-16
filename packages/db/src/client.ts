import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

export interface Claims {
  role: "authenticated" | "anon";
  sub?: string;
  email?: string;
}

/** One RLS-scoped transaction per call; each repository method is one call. */
export type UserDb = <T>(work: (tx: Transaction) => Promise<T>) => Promise<T>;

// The role is chosen from this whitelist, never interpolated (spec decision 43).
const SET_LOCAL_ROLE = {
  authenticated: sql`set local role authenticated`,
  anon: sql`set local role anon`,
} satisfies Record<Claims["role"], unknown>;

export function createUserDb(connectionString: string, claims: Claims): UserDb {
  const setRole = SET_LOCAL_ROLE[claims.role];
  const claimsJson = JSON.stringify(claims);
  return async (work) => {
    const client = new pg.Client({ connectionString });
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
export function createAdminDb(connectionString: string): Db {
  return drizzle(new pg.Pool({ connectionString }), { schema });
}

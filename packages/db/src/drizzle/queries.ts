import { and, eq } from "drizzle-orm";
import type { PgInsertValue, PgTable } from "drizzle-orm/pg-core";
import { authUid } from "drizzle-orm/supabase";

import type { Transaction } from "../client";
import { firstOrThrow } from "../orThrow";
import { mediaAssets } from "../schema";

/** `run` only when there is something to look up: an empty list costs no round trip. */
export async function whenAny<I, T>(
  items: readonly I[],
  run: () => PromiseLike<T[]>,
): Promise<T[]> {
  return items.length === 0 ? [] : await run();
}

/** An empty insert is a syntax error in drizzle, so no rows means no statement. */
export async function insertMany<T extends PgTable>(
  tx: Transaction,
  table: T,
  rows: PgInsertValue<T>[],
): Promise<void> {
  if (rows.length > 0) {
    await tx.insert(table).values(rows);
  }
}

export async function assertCallersMedia(
  tx: Transaction,
  mediaId: string,
  message: string,
): Promise<void> {
  const rows = await tx
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.ownerUserId, authUid)));
  firstOrThrow(rows, message);
}

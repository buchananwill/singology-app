import { and, eq } from "drizzle-orm";
import { authUid } from "drizzle-orm/supabase";

import type { Transaction } from "../client";
import { mediaAssets } from "../schema";

export function firstOrThrow<T>(rows: readonly T[], message: string): T {
  const [first] = rows;
  if (first === undefined) {
    throw new Error(message);
  }
  return first;
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

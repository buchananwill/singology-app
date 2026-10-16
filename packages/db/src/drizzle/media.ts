import { pickByIds } from "@singology/shared";
import { and, eq, inArray } from "drizzle-orm";
import { authUid } from "drizzle-orm/supabase";

import type { UserDb } from "../client";
import type { MediaRepository } from "../repositories";
import { mediaAssets } from "../schema";
import { firstOrThrow } from "../orThrow";
import { toMediaAsset } from "./mappers";
import { whenAny } from "./queries";

export function drizzleMedia(db: UserDb): MediaRepository {
  return {
    get: (id) =>
      db(async (tx) => {
        const [row] = await tx
          .select()
          .from(mediaAssets)
          .where(and(eq(mediaAssets.id, id), eq(mediaAssets.status, "ready")));
        return row && toMediaAsset(row);
      }),
    getMany: (ids) =>
      whenAny(ids, () =>
        db(async (tx) => {
          const rows = await tx
            .select()
            .from(mediaAssets)
            .where(and(inArray(mediaAssets.id, [...ids]), eq(mediaAssets.status, "ready")));
          return pickByIds(rows.map(toMediaAsset), ids);
        }),
      ),
    register: (input) =>
      db(async (tx) =>
        firstOrThrow(
          await tx
            .insert(mediaAssets)
            .values({ ...input, ownerUserId: authUid, status: "pending" })
            .returning({ id: mediaAssets.id }),
          "The media asset was not registered.",
        ),
      ),
  };
}

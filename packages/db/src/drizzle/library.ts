import { groupBy, type LibraryFilter, type LibraryItem, pickByIds } from "@singology/shared";
import { and, arrayContains, asc, eq, inArray, type SQL } from "drizzle-orm";

import type { Transaction, UserDb } from "../client";
import type { LibraryRepository } from "../repositories";
import { collectionItems, collections, libraryItems, libraryItemTags, tags } from "../schema";
import { toCollection, toLibraryItem, toTag } from "./mappers";
import { whenAny } from "./queries";

/** Active items matching `where`, each with its tags; `where` may reference `libraryItems`. */
export async function libraryItemsWhere(
  tx: Transaction,
  where: SQL | undefined,
): Promise<LibraryItem[]> {
  const rows = await tx
    .select()
    .from(libraryItems)
    .where(and(eq(libraryItems.active, true), where))
    .orderBy(asc(libraryItems.category), asc(libraryItems.difficulty), asc(libraryItems.title));
  const tagRows = await whenAny(rows, () =>
    tx
      .select({ itemId: libraryItemTags.libraryItemId, tag: tags })
      .from(libraryItemTags)
      .innerJoin(tags, eq(tags.id, libraryItemTags.tagId))
      .where(
        inArray(
          libraryItemTags.libraryItemId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(tags.position), asc(tags.label)),
  );
  const tagsByItem = groupBy(tagRows, (row) => row.itemId);
  return rows.map((row) =>
    toLibraryItem(
      row,
      (tagsByItem.get(row.id) ?? []).map(({ tag }) => toTag(tag)),
    ),
  );
}

function libraryFilter(tx: Transaction, filter: LibraryFilter | undefined): SQL | undefined {
  return and(
    filter?.category === undefined ? undefined : eq(libraryItems.category, filter.category),
    filter?.voiceType === undefined
      ? undefined
      : arrayContains(libraryItems.voiceTypes, [filter.voiceType]),
    filter?.difficulty === undefined ? undefined : eq(libraryItems.difficulty, filter.difficulty),
    filter?.tag === undefined
      ? undefined
      : inArray(
          libraryItems.id,
          tx
            .select({ id: libraryItemTags.libraryItemId })
            .from(libraryItemTags)
            .innerJoin(tags, eq(tags.id, libraryItemTags.tagId))
            .where(eq(tags.slug, filter.tag)),
        ),
  );
}

export function drizzleLibrary(db: UserDb): LibraryRepository {
  return {
    list: (filter) => db((tx) => libraryItemsWhere(tx, libraryFilter(tx, filter))),
    get: (id) =>
      db(async (tx) => {
        const [item] = await libraryItemsWhere(tx, eq(libraryItems.id, id));
        return item;
      }),
    getMany: (ids) =>
      whenAny(ids, () =>
        db(async (tx) =>
          pickByIds(await libraryItemsWhere(tx, inArray(libraryItems.id, [...ids])), ids),
        ),
      ),
    listCollections: () =>
      db(async (tx) => {
        const rows = await tx
          .select()
          .from(collections)
          .where(eq(collections.active, true))
          .orderBy(asc(collections.position), asc(collections.title));
        const itemRows = await whenAny(rows, () =>
          tx
            .select()
            .from(collectionItems)
            .where(
              inArray(
                collectionItems.collectionId,
                rows.map((row) => row.id),
              ),
            )
            .orderBy(asc(collectionItems.position)),
        );
        const itemsByCollection = groupBy(itemRows, (item) => item.collectionId);
        return rows.map((row) =>
          toCollection(
            row,
            (itemsByCollection.get(row.id) ?? []).map((item) => item.libraryItemId),
          ),
        );
      }),
  };
}

import { type LibraryFilter, type LibraryItem, pickByIds } from "@singology/shared";

import type { LibraryRepository } from "../../repositories";
import type { FixtureState } from "../state";

function matchesFilter(item: LibraryItem, filter: LibraryFilter | undefined): boolean {
  if (filter?.category !== undefined && item.category !== filter.category) {
    return false;
  }
  if (filter?.voiceType !== undefined && !item.voiceTypes.includes(filter.voiceType)) {
    return false;
  }
  if (filter?.difficulty !== undefined && item.difficulty !== filter.difficulty) {
    return false;
  }
  if (filter?.tag !== undefined && !item.tags.some((tag) => tag.slug === filter.tag)) {
    return false;
  }
  return true;
}

export function fixtureLibrary({ data }: FixtureState): LibraryRepository {
  return {
    list: async (filter) =>
      structuredClone(data.libraryItems.filter((i) => matchesFilter(i, filter))),
    get: async (id) => structuredClone(data.libraryItems.find((i) => i.id === id)),
    getMany: async (ids) => structuredClone(pickByIds(data.libraryItems, ids)),
    listCollections: async () =>
      structuredClone(data.collections.toSorted((a, b) => a.position - b.position)),
  };
}

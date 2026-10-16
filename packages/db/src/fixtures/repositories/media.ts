import { pickByIds } from "@singology/shared";

import type { MediaRepository } from "../../repositories";
import type { FixtureState } from "../state";

export function fixtureMedia({ data, pendingMediaIds }: FixtureState): MediaRepository {
  return {
    get: async (id) => structuredClone(data.mediaAssets.find((m) => m.id === id)),
    getMany: async (ids) => structuredClone(pickByIds(data.mediaAssets, ids)),
    register: async () => {
      const id = crypto.randomUUID();
      pendingMediaIds.add(id);
      return { id };
    },
  };
}

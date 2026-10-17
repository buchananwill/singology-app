import { authUid } from "drizzle-orm/supabase";

import type { UserDb } from "../client";
import type { EventRepository } from "../repositories";
import { events } from "../schema";

export function drizzleEvents(db: UserDb): EventRepository {
  return {
    record: (input) =>
      db(async (tx) => {
        await tx.insert(events).values({
          userId: authUid,
          kind: input.kind,
          entityId: "entityId" in input ? input.entityId : null,
          meta: input.meta ?? {},
        });
      }),
  };
}

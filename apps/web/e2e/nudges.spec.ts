import { expect, test } from "@playwright/test";
import { fixtureUuid } from "@singology/db";
import { createAdminDbFromEnv, type Db, notifications } from "@singology/db/admin";
import { NUDGE_CRONS } from "@singology/shared";
import { inArray } from "drizzle-orm";

// Seeded within the last seven days and left untouched by the other specs.
const SEEDED_DUE = [
  { kind: "feedback_ready", entityId: fixtureUuid("fb-ada-siren-2") },
  { kind: "new_submission", entityId: fixtureUuid("sub-ben-hiss") },
  { kind: "new_submission", entityId: fixtureUuid("sub-dev-bridge") },
] as const satisfies readonly Pick<typeof notifications.$inferSelect, "kind" | "entityId">[];

let admin: Db;

test.beforeAll(() => {
  admin = createAdminDbFromEnv();
});

test.afterAll(async () => {
  await admin.$client.end();
});

function seededRows() {
  return admin
    .select()
    .from(notifications)
    .where(
      inArray(
        notifications.entityId,
        SEEDED_DUE.map((due) => due.entityId),
      ),
    );
}

test(
  "the frequent cron sends the seeded nudges through the dry-run transport, once",
  { tag: "@writes" },
  async ({ request }) => {
    const trigger = () =>
      request.get(`/cdn-cgi/local/scheduled?cron=${encodeURIComponent(NUDGE_CRONS.frequent)}`);

    expect((await trigger()).status()).toBe(200);
    const sent = await seededRows();
    expect(sent.map(({ kind, entityId }) => ({ kind, entityId }))).toEqual(
      expect.arrayContaining([...SEEDED_DUE]),
    );
    expect(sent).toHaveLength(SEEDED_DUE.length);
    for (const row of sent) {
      expect(row.providerMessageId).toBe(`dry-run:${row.id}`);
    }

    expect((await trigger()).status()).toBe(200);
    const again = await seededRows();
    expect(again.map((row) => row.id).toSorted()).toEqual(sent.map((row) => row.id).toSorted());
  },
);

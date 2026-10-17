import { expect, test } from "@playwright/test";
import { fixtureUuid } from "@singology/db";
import {
  connectionSettingsFromUrl,
  createAdminDb,
  type Db,
  notifications,
  requireEnv,
} from "@singology/db/admin";
import { NUDGE_CRONS } from "@singology/shared";

// Seeded within the last seven days and left untouched by the other specs.
const SEEDED_DUE = [
  { kind: "feedback_ready", entityId: fixtureUuid("fb-ada-siren-2") },
  { kind: "new_submission", entityId: fixtureUuid("sub-ben-hiss") },
  { kind: "new_submission", entityId: fixtureUuid("sub-dev-bridge") },
];

let admin: Db;

test.beforeAll(() => {
  admin = createAdminDb(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
});

test.afterAll(async () => {
  await admin.$client.end();
});

async function seededRows() {
  const rows = await admin.select().from(notifications);
  return rows.filter((row) =>
    SEEDED_DUE.some((due) => due.kind === row.kind && due.entityId === row.entityId),
  );
}

// Tagged `@writes`: it fills the sent-log, so it runs once, in the writes project.
test(
  "the frequent cron sends the seeded nudges through the dry-run transport, once",
  { tag: "@writes" },
  async ({ request }) => {
    const trigger = () =>
      request.get(`/cdn-cgi/local/scheduled?cron=${encodeURIComponent(NUDGE_CRONS.frequent)}`);

    expect((await trigger()).status()).toBe(200);
    const sent = await seededRows();
    expect(sent).toHaveLength(SEEDED_DUE.length);
    for (const row of sent) {
      expect(row.providerMessageId).toBe(`dry-run:${row.id}`);
    }

    expect((await trigger()).status()).toBe(200);
    const again = await seededRows();
    expect(again.map((row) => row.id).toSorted()).toEqual(sent.map((row) => row.id).toSorted());
  },
);

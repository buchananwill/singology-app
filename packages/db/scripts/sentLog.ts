// The notifications sent-log, newest first, with the recipient's address.
// `--release-dry-runs` deletes the rows the dry-run transport claimed, so the next tick sends them
// for real once a Resend key exists.
import { desc, eq, like } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import { createAdminDbFromEnv } from "../src/adminDbFromEnv";
import { notifications } from "../src/schema";

const DRY_RUN_PREFIX = "dry-run:";

const db = createAdminDbFromEnv();
try {
  if (process.argv.includes("--release-dry-runs")) {
    const released = await db
      .delete(notifications)
      .where(like(notifications.providerMessageId, `${DRY_RUN_PREFIX}%`))
      .returning({ id: notifications.id });
    console.log(`released ${released.length} dry-run notifications`);
  }
  const rows = await db
    .select({
      sentAt: notifications.sentAt,
      kind: notifications.kind,
      email: authUsers.email,
      entityId: notifications.entityId,
      periodStart: notifications.periodStart,
      providerMessageId: notifications.providerMessageId,
    })
    .from(notifications)
    .innerJoin(authUsers, eq(authUsers.id, notifications.userId))
    .orderBy(desc(notifications.sentAt))
    .limit(50);
  for (const row of rows) {
    console.log(
      `${row.sentAt.toISOString()} ${row.kind} to ${row.email} entity=${row.entityId ?? row.periodStart ?? "-"} provider=${row.providerMessageId ?? "claimed, not sent"}`,
    );
  }
  if (rows.length === 0) {
    console.log("no notifications");
  }
} finally {
  await db.$client.end();
}

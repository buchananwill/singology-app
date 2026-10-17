import { createAuthAdmin } from "../authAdmin";
import { connectionSettingsFromUrl, createAdminDb } from "../client";
import { requireEnv } from "../env";
import { seedAlpha } from "./seedAlpha";

const db = createAdminDb(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
try {
  const seeded = await seedAlpha(db, createAuthAdmin());
  console.log(
    `Seeded ${seeded.users} users, ${seeded.libraryItems} library items, ` +
      `${seeded.mediaAssets} media assets, ${seeded.collections} collections, ` +
      `${seeded.submissions} submissions, ${seeded.feedback} feedback.`,
  );
} finally {
  await db.$client.end();
}

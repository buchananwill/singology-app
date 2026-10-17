import { seedFromEnv } from "./seedFromEnv";

const seeded = await seedFromEnv();
console.log(
  `Seeded ${seeded.users} users, ${seeded.libraryItems} library items, ` +
    `${seeded.mediaAssets} media assets, ${seeded.collections} collections, ` +
    `${seeded.submissions} submissions, ${seeded.feedback} feedback.`,
);

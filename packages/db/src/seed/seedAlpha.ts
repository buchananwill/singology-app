import type { Profile, Tag } from "@singology/shared";
import { inArray } from "drizzle-orm";

import { createAuthAdmin } from "../authAdmin";
import { connectionSettingsFromUrl, createAdminDb } from "../client";
import { requireEnv } from "../env";
import { createFixtureData } from "../fixtures/data";
import { firstOrThrow, getOrThrow } from "../orThrow";
import {
  coaches,
  coachOffers,
  collectionItems,
  collections,
  libraryItems,
  libraryItemTags,
  mediaAssets,
  profiles,
  students,
  tags,
} from "../schema";
import { ALPHA_USERS, type CastMember, placeholderEmail } from "./alphaCast";
import { fixtureUuid } from "./fixtureUuid";
import { loadCoaching, type UserOfFixture } from "./loadCoaching";
import { userIdByEmail } from "./userIdByEmail";

const db = createAdminDb(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
const authAdmin = createAuthAdmin();
const fixtures = createFixtureData(new Date());

const tagKey = (tag: Tag) => `${tag.kind}:${tag.slug}`;

async function ensureUser(email: string, displayName: string): Promise<string> {
  const id = await userIdByEmail(db, email);
  if (id !== undefined) {
    return id;
  }
  const { data, error } = await authAdmin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) {
    throw error;
  }
  return data.user.id;
}

const cast: CastMember[] = [
  ...ALPHA_USERS,
  ...fixtures.students
    .filter((student) => !ALPHA_USERS.some((user) => user.studentFixtureId === student.id))
    .map((student) => ({
      email: placeholderEmail(student.id),
      displayName: student.displayName,
      studentFixtureId: student.id,
    })),
];

const profileRows: Profile[] = [];
const userIdFor = new Map<string, string>();
for (const member of cast) {
  const id = await ensureUser(member.email, member.displayName);
  profileRows.push({ id, displayName: member.displayName });
  for (const fixtureId of [member.coachFixtureId, member.studentFixtureId]) {
    if (fixtureId !== undefined) {
      userIdFor.set(fixtureId, id);
    }
  }
}
const userOf: UserOfFixture = (fixtureId) =>
  getOrThrow(userIdFor, fixtureId, `No seeded user plays ${fixtureId}`);

await db.transaction(async (tx) => {
  for (const row of profileRows) {
    await tx
      .insert(profiles)
      .values(row)
      .onConflictDoUpdate({ target: profiles.id, set: { displayName: row.displayName } });
  }

  for (const coach of fixtures.coaches) {
    const row = {
      userId: userOf(coach.id),
      tier: coach.tier,
      bio: coach.bio,
      avatarSrc: coach.avatarSrc,
      turnaroundHours: coach.turnaroundHours,
      active: true,
    };
    await tx.insert(coaches).values(row).onConflictDoUpdate({ target: coaches.userId, set: row });
  }

  for (const student of fixtures.students) {
    const row = { userId: userOf(student.id), voiceType: student.voiceType };
    await tx.insert(students).values(row).onConflictDoUpdate({ target: students.userId, set: row });
  }

  for (const offer of fixtures.coachOffers) {
    const row = {
      id: fixtureUuid(offer.id),
      coachId: userOf(offer.coachId),
      tier: offer.tier,
      name: offer.name,
      billing: offer.billing,
      pricePence: offer.pricePence,
      submissionsPerPeriod: offer.submissionsPerPeriod,
      active: true,
    };
    await tx
      .insert(coachOffers)
      .values(row)
      .onConflictDoUpdate({ target: coachOffers.id, set: row });
  }

  for (const asset of fixtures.mediaAssets) {
    const row = {
      id: fixtureUuid(asset.id),
      kind: asset.kind,
      ownerUserId: null,
      store: "local" as const,
      storeKey: asset.src,
      status: "ready" as const,
      src: asset.src,
      hlsSrc: asset.hlsSrc ?? null,
      peaksSrc: asset.peaksSrc,
      durationSec: asset.durationSec,
    };
    await tx
      .insert(mediaAssets)
      .values(row)
      .onConflictDoUpdate({ target: mediaAssets.id, set: row });
  }

  const tagIds = new Map<string, string>();
  const seededTags = [
    ...new Map(fixtures.libraryItems.flatMap((i) => i.tags).map((t) => [tagKey(t), t])).values(),
  ];
  for (const [position, tag] of seededTags.entries()) {
    const row = firstOrThrow(
      await tx
        .insert(tags)
        .values({ ...tag, position })
        .onConflictDoUpdate({ target: [tags.kind, tags.slug], set: { label: tag.label, position } })
        .returning({ id: tags.id }),
      `Tag ${tag.slug} was not upserted.`,
    );
    tagIds.set(tagKey(tag), row.id);
  }

  const itemIds = fixtures.libraryItems.map((item) => fixtureUuid(item.id));
  for (const item of fixtures.libraryItems) {
    const row = {
      id: fixtureUuid(item.id),
      title: item.title,
      category: item.category,
      difficulty: item.difficulty,
      voiceTypes: item.voiceTypes,
      instructions: item.instructions,
      demoMediaId: fixtureUuid(item.demoMediaId),
      backingTrackMediaId:
        item.backingTrackMediaId === undefined ? null : fixtureUuid(item.backingTrackMediaId),
      active: true,
    };
    await tx
      .insert(libraryItems)
      .values(row)
      .onConflictDoUpdate({ target: libraryItems.id, set: row });
  }
  await tx.delete(libraryItemTags).where(inArray(libraryItemTags.libraryItemId, itemIds));
  await tx.insert(libraryItemTags).values(
    fixtures.libraryItems.flatMap((item) =>
      item.tags.map((tag) => ({
        libraryItemId: fixtureUuid(item.id),
        tagId: getOrThrow(tagIds, tagKey(tag), `Tag ${tag.slug} was not seeded.`),
      })),
    ),
  );

  const collectionIds = fixtures.collections.map((c) => fixtureUuid(c.id));
  for (const collection of fixtures.collections) {
    const row = {
      id: fixtureUuid(collection.id),
      title: collection.title,
      description: collection.description,
      position: collection.position,
      active: true,
    };
    await tx
      .insert(collections)
      .values(row)
      .onConflictDoUpdate({ target: collections.id, set: row });
  }
  await tx.delete(collectionItems).where(inArray(collectionItems.collectionId, collectionIds));
  await tx.insert(collectionItems).values(
    fixtures.collections.flatMap((collection) =>
      collection.itemIds.map((itemId, position) => ({
        collectionId: fixtureUuid(collection.id),
        libraryItemId: fixtureUuid(itemId),
        position,
      })),
    ),
  );

  await loadCoaching(tx, fixtures, userOf);
});

console.log(
  `Seeded ${cast.length} users, ${fixtures.libraryItems.length} library items, ` +
    `${fixtures.mediaAssets.length} media assets, ${fixtures.collections.length} collections, ` +
    `${fixtures.submissions.length} submissions, ${fixtures.feedback.length} feedback.`,
);
await db.$client.end();

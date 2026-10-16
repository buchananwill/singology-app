// The alpha seed (spec decisions 73 and 74): idempotent, so it can be re-run after a squash.
import type { Tag } from "@singology/shared";
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
  enrolments,
  libraryItems,
  libraryItemTags,
  mediaAssets,
  profiles,
  students,
  tags,
} from "../schema";
import {
  ALPHA_ENROLMENT,
  ALPHA_USERS,
  CTO_EMAIL,
  CTO_VOICE_TYPE,
  FOUNDER_EMAIL,
} from "./alphaCast";
import { fixtureUuid } from "./fixtureUuid";
import { userIdByEmail } from "./userIdByEmail";

const db = createAdminDb(connectionSettingsFromUrl(requireEnv("DATABASE_URL")));
const authAdmin = createAuthAdmin();

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

const userIds = new Map<string, string>();
for (const user of ALPHA_USERS) {
  userIds.set(user.email, await ensureUser(user.email, user.displayName));
}
const idOf = (email: string) => getOrThrow(userIds, email, `No user for ${email}`);
const coachIdFor = new Map<string, string>(
  ALPHA_USERS.map((user) => [user.coachFixtureId, idOf(user.email)]),
);
const coachId = (fixtureCoachId: string) =>
  getOrThrow(coachIdFor, fixtureCoachId, `No alpha user coaches as ${fixtureCoachId}`);

const fixtures = createFixtureData(new Date());

await db.transaction(async (tx) => {
  for (const user of ALPHA_USERS) {
    const row = { id: idOf(user.email), displayName: user.displayName };
    await tx
      .insert(profiles)
      .values(row)
      .onConflictDoUpdate({ target: profiles.id, set: { displayName: row.displayName } });
  }

  for (const coach of fixtures.coaches) {
    const row = {
      userId: coachId(coach.id),
      tier: coach.tier,
      bio: coach.bio,
      avatarSrc: coach.avatarSrc,
      turnaroundHours: coach.turnaroundHours,
      active: true,
    };
    await tx.insert(coaches).values(row).onConflictDoUpdate({ target: coaches.userId, set: row });
  }

  const student = { userId: idOf(CTO_EMAIL), voiceType: CTO_VOICE_TYPE };
  await tx
    .insert(students)
    .values(student)
    .onConflictDoUpdate({ target: students.userId, set: student });

  for (const offer of fixtures.coachOffers) {
    const row = {
      id: fixtureUuid(offer.id),
      coachId: coachId(offer.coachId),
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

  await tx
    .insert(enrolments)
    .values({
      id: ALPHA_ENROLMENT.id,
      studentId: idOf(CTO_EMAIL),
      coachId: idOf(FOUNDER_EMAIL),
      offerId: fixtureUuid(ALPHA_ENROLMENT.offerFixtureId),
    })
    .onConflictDoNothing({ target: enrolments.id });
});

console.log(
  `Seeded ${ALPHA_USERS.length} users, ${fixtures.libraryItems.length} library items, ` +
    `${fixtures.mediaAssets.length} media assets, ${fixtures.collections.length} collections.`,
);
await db.$client.end();

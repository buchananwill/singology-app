import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

import { createdAt, id, updatedAt } from "./columns";
import { difficulty, libraryCategory, voiceType } from "./enums";
import { coaches } from "./identity";
import { mediaAssets } from "./media";

export const libraryItems = pgTable(
  "library_items",
  {
    id: id(),
    title: text("title").notNull(),
    category: libraryCategory("category").notNull(),
    difficulty: difficulty("difficulty").notNull(),
    voiceTypes: voiceType("voice_types").array().notNull(),
    instructions: text("instructions").notNull().default(""),
    demoMediaId: uuid("demo_media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
    backingTrackMediaId: uuid("backing_track_media_id").references(() => mediaAssets.id, {
      onDelete: "restrict",
    }),
    /** Null is platform-owned. */
    ownerCoachId: uuid("owner_coach_id").references(() => coaches.userId),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("library_items_voice_types_not_empty", sql`cardinality(${t.voiceTypes}) > 0`),
    index("library_items_demo_media_id_idx").on(t.demoMediaId),
    index("library_items_backing_track_media_id_idx").on(t.backingTrackMediaId),
    index("library_items_owner_coach_id_idx").on(t.ownerCoachId),
    index("library_items_active_idx").on(t.active),
    pgPolicy("library_items_select_active", {
      for: "select",
      to: authenticatedRole,
      using: sql`library_items.active`,
    }),
  ],
);

export const collections = pgTable(
  "collections",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    /** Null is platform-owned. */
    ownerCoachId: uuid("owner_coach_id").references(() => coaches.userId),
    position: integer("position").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("collections_owner_coach_id_idx").on(t.ownerCoachId),
    index("collections_active_idx").on(t.active),
    pgPolicy("collections_select_active", {
      for: "select",
      to: authenticatedRole,
      using: sql`collections.active`,
    }),
  ],
);

export const collectionItems = pgTable(
  "collection_items",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    libraryItemId: uuid("library_item_id")
      .notNull()
      .references(() => libraryItems.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.libraryItemId] }),
    unique("collection_items_collection_id_position_key").on(t.collectionId, t.position),
    index("collection_items_library_item_id_idx").on(t.libraryItemId),
    pgPolicy("collection_items_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

/** `kind` is text checked against the shared `TAG_KINDS`, so a new facet is never a migration. */
export const tags = pgTable(
  "tags",
  {
    id: id(),
    kind: text("kind").notNull(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("tags_kind_slug_key").on(t.kind, t.slug),
    pgPolicy("tags_select", { for: "select", to: authenticatedRole, using: sql`true` }),
  ],
);

export const libraryItemTags = pgTable(
  "library_item_tags",
  {
    libraryItemId: uuid("library_item_id")
      .notNull()
      .references(() => libraryItems.id, { onDelete: "cascade" }),
    // A tag in use is relabelled, never deleted.
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.libraryItemId, t.tagId] }),
    index("library_item_tags_tag_id_idx").on(t.tagId),
    pgPolicy("library_item_tags_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

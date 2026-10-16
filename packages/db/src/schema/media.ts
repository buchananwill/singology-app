import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  doublePrecision,
  index,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

import { createdAt, id, updatedAt } from "./columns";
import { mediaKind, mediaStatus, mediaStore } from "./enums";
import { profiles } from "./identity";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: id(),
    kind: mediaKind("kind").notNull(),
    ownerUserId: uuid("owner_user_id").references(() => profiles.id),
    store: mediaStore("store").notNull(),
    /** The Bunny video id, the Storage path, or the local public path. */
    storeKey: text("store_key").notNull(),
    status: mediaStatus("status").notNull().default("pending"),
    src: text("src"),
    hlsSrc: text("hls_src"),
    peaksSrc: text("peaks_src"),
    durationSec: doublePrecision("duration_sec"),
    originalFileName: text("original_file_name").notNull().default(""),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    mimeType: text("mime_type"),
    failureReason: text("failure_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("media_assets_duration_sec_positive", sql`${t.durationSec} > 0`),
    // What makes the ready projection (the domain MediaAsset) total.
    check(
      "media_assets_ready_is_playable",
      sql`${t.status} <> 'ready' or (${t.src} is not null and ${t.peaksSrc} is not null and ${t.durationSec} is not null)`,
    ),
    index("media_assets_owner_user_id_idx").on(t.ownerUserId),
    index("media_assets_status_idx").on(t.status),
    pgPolicy("media_assets_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`media_assets.owner_user_id = ${authUid}`,
    }),
    pgPolicy("media_assets_select_library", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from public.library_items li
        where li.active
          and (li.demo_media_id = media_assets.id or li.backing_track_media_id = media_assets.id)
      )`,
    }),
    pgPolicy("media_assets_select_submission", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from public.submissions s where s.media_id = media_assets.id)`,
    }),
    pgPolicy("media_assets_select_feedback_reply", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from public.feedback f where f.reply_media_id = media_assets.id)`,
    }),
    pgPolicy("media_assets_insert_own_pending", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`media_assets.owner_user_id = ${authUid} and media_assets.status = 'pending'`,
    }),
  ],
);

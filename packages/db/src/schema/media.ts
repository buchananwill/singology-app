import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  doublePrecision,
  index,
  pgPolicy,
  pgTable,
  type PgTableExtraConfigValue,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

import { feedback, submissions } from "./coaching";
import { createdAt, id, updatedAt } from "./columns";
import { mediaKind, mediaStatus, mediaStore } from "./enums";
import { profiles } from "./identity";
import { libraryItems } from "./library";

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
  (t): PgTableExtraConfigValue[] => [
    check("media_assets_duration_sec_positive", sql`${t.durationSec} > 0`),
    check(
      "media_assets_ready_is_playable",
      sql`${t.status} <> 'ready' or (${t.src} is not null and ${t.peaksSrc} is not null and ${t.durationSec} is not null)`,
    ),
    index("media_assets_owner_user_id_idx").on(t.ownerUserId),
    index("media_assets_status_idx").on(t.status),
    pgPolicy("media_assets_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.ownerUserId} = ${authUid}`,
    }),
    pgPolicy("media_assets_select_library", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from ${libraryItems}
        where ${libraryItems.active}
          and (${libraryItems.demoMediaId} = ${t.id} or ${libraryItems.backingTrackMediaId} = ${t.id})
      )`,
    }),
    pgPolicy("media_assets_select_submission", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${submissions} where ${submissions.mediaId} = ${t.id})`,
    }),
    pgPolicy("media_assets_select_feedback_reply", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${feedback} where ${feedback.replyMediaId} = ${t.id})`,
    }),
    pgPolicy("media_assets_insert_own_pending", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${t.ownerUserId} = ${authUid} and ${t.status} = 'pending'`,
    }),
  ],
);

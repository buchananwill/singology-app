import type { EventKind, RecordEvent } from "@singology/shared";
import { sql } from "drizzle-orm";
import {
  bigint,
  date,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  type PgTableExtraConfigValue,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

import { createdAt, id } from "./columns";
import { notificationKind } from "./enums";
import { profiles } from "./identity";

/** Append-only. `kind` is text, checked against the shared `EVENT_KINDS`. */
export const events = pgTable(
  "events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
    kind: text("kind").$type<EventKind>().notNull(),
    entityId: uuid("entity_id"),
    meta: jsonb("meta").$type<NonNullable<RecordEvent["meta"]>>().notNull().default({}),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t): PgTableExtraConfigValue[] => [
    index("events_kind_at_idx").on(t.kind, t.at),
    index("events_user_id_at_idx").on(t.userId, t.at),
    pgPolicy("events_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${t.userId} = ${authUid}`,
    }),
  ],
);

/** The sent-log for nudges: the sender inserts first and sends only when the insert succeeds. */
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: notificationKind("kind").notNull(),
    /** The feedback or submission the email is about. */
    entityId: uuid("entity_id"),
    /** The week a practice reminder covers. */
    periodStart: date("period_start"),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    providerMessageId: text("provider_message_id"),
    createdAt: createdAt(),
  },
  (t): PgTableExtraConfigValue[] => [
    index("notifications_user_id_idx").on(t.userId),
    uniqueIndex("notifications_once_per_entity")
      .on(t.kind, t.entityId)
      .where(sql`entity_id is not null`),
    uniqueIndex("notifications_once_per_period")
      .on(t.kind, t.userId, t.periodStart)
      .where(sql`period_start is not null`),
  ],
).enableRLS();

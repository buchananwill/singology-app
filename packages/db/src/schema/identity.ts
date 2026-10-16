import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgPolicy, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

import { createdAt, id, updatedAt } from "./columns";
import { coachTier, offerBilling, voiceType } from "./enums";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  () => [
    pgPolicy("profiles_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`profiles.id = ${authUid}`,
    }),
    pgPolicy("profiles_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`profiles.id = ${authUid}`,
      withCheck: sql`profiles.id = ${authUid}`,
    }),
    // The landing page's coach cards show an active coach's name to everyone.
    pgPolicy("profiles_select_active_coach", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`exists (
        select 1 from public.coaches c where c.user_id = profiles.id and c.active
      )`,
    }),
    pgPolicy("profiles_select_enrolment_counterpart", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from public.enrolments e
        where (e.student_id = ${authUid} and e.coach_id = profiles.id)
           or (e.coach_id = ${authUid} and e.student_id = profiles.id)
      )`,
    }),
  ],
);

export const coaches = pgTable(
  "coaches",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tier: coachTier("tier").notNull(),
    bio: text("bio").notNull().default(""),
    avatarSrc: text("avatar_src").notNull(),
    turnaroundHours: integer("turnaround_hours").notNull(),
    active: boolean("active").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("coaches_turnaround_hours_positive", sql`${t.turnaroundHours} > 0`),
    index("coaches_active_idx").on(t.active),
    pgPolicy("coaches_select_active_anon", {
      for: "select",
      to: anonRole,
      using: sql`coaches.active`,
    }),
    pgPolicy("coaches_select_active", {
      for: "select",
      to: authenticatedRole,
      using: sql`coaches.active`,
    }),
    pgPolicy("coaches_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`coaches.user_id = ${authUid}`,
    }),
    pgPolicy("coaches_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`coaches.user_id = ${authUid}`,
      withCheck: sql`coaches.user_id = ${authUid}`,
    }),
  ],
);

export const coachOffers = pgTable(
  "coach_offers",
  {
    id: id(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coaches.userId, { onDelete: "cascade" }),
    tier: coachTier("tier").notNull(),
    name: text("name").notNull(),
    billing: offerBilling("billing").notNull(),
    pricePence: integer("price_pence").notNull(),
    submissionsPerPeriod: integer("submissions_per_period").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("coach_offers_price_pence_nonnegative", sql`${t.pricePence} >= 0`),
    check("coach_offers_submissions_per_period_positive", sql`${t.submissionsPerPeriod} > 0`),
    index("coach_offers_coach_id_idx").on(t.coachId),
    index("coach_offers_active_idx").on(t.active),
    pgPolicy("coach_offers_select_active_anon", {
      for: "select",
      to: anonRole,
      using: sql`coach_offers.active`,
    }),
    pgPolicy("coach_offers_select_active", {
      for: "select",
      to: authenticatedRole,
      using: sql`coach_offers.active`,
    }),
    pgPolicy("coach_offers_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`coach_offers.coach_id = ${authUid}`,
    }),
    pgPolicy("coach_offers_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`coach_offers.coach_id = ${authUid}`,
      withCheck: sql`coach_offers.coach_id = ${authUid}`,
    }),
  ],
);

export const students = pgTable(
  "students",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    voiceType: voiceType("voice_type").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  () => [
    pgPolicy("students_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`students.user_id = ${authUid}`,
    }),
    pgPolicy("students_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`students.user_id = ${authUid}`,
      withCheck: sql`students.user_id = ${authUid}`,
    }),
    pgPolicy("students_select_by_coach", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from public.enrolments e
        where e.student_id = students.user_id and e.coach_id = ${authUid}
      )`,
    }),
  ],
);

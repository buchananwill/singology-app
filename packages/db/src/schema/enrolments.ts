import { sql } from "drizzle-orm";
import { index, pgPolicy, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

import { createdAt, id } from "./columns";
import { enrolmentStatus } from "./enums";
import { coaches, coachOffers, students } from "./identity";

export const enrolments = pgTable(
  "enrolments",
  {
    id: id(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.userId, { onDelete: "restrict" }),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coaches.userId, { onDelete: "restrict" }),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => coachOffers.id, { onDelete: "restrict" }),
    status: enrolmentStatus("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("enrolments_student_id_idx").on(t.studentId),
    index("enrolments_coach_id_idx").on(t.coachId),
    index("enrolments_offer_id_idx").on(t.offerId),
    index("enrolments_status_idx").on(t.status),
    // The student home shows "your coach" in the singular.
    uniqueIndex("enrolments_one_active_per_student")
      .on(t.studentId)
      .where(sql`status = 'active'`),
    pgPolicy("enrolments_select_as_student", {
      for: "select",
      to: authenticatedRole,
      using: sql`enrolments.student_id = ${authUid}`,
    }),
    pgPolicy("enrolments_select_as_coach", {
      for: "select",
      to: authenticatedRole,
      using: sql`enrolments.coach_id = ${authUid}`,
    }),
  ],
);

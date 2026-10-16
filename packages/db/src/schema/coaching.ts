import { and, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  doublePrecision,
  index,
  pgPolicy,
  pgTable,
  type PgTableExtraConfigValue,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

import { createdAt, id } from "./columns";
import { enrolments } from "./enrolments";
import { submissionStatus } from "./enums";
import { coaches } from "./identity";
import { libraryItems } from "./library";
import { mediaAssets } from "./media";
import { enrolmentIsCallers, submissionIsCallers } from "./policies";

export const assignments = pgTable(
  "assignments",
  {
    id: id(),
    enrolmentId: uuid("enrolment_id")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    libraryItemId: uuid("library_item_id")
      .notNull()
      .references(() => libraryItems.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    /** The feedback that assigned it; null when seeded or assigned directly. */
    feedbackId: uuid("feedback_id").references((): AnyPgColumn => feedback.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t): PgTableExtraConfigValue[] => [
    index("assignments_enrolment_id_idx").on(t.enrolmentId),
    index("assignments_library_item_id_idx").on(t.libraryItemId),
    index("assignments_feedback_id_idx").on(t.feedbackId),
    pgPolicy("assignments_insert_as_coach", {
      for: "insert",
      to: authenticatedRole,
      withCheck: enrolmentIsCallers("coachId", t.enrolmentId),
    }),
    pgPolicy("assignments_select_as_coach", {
      for: "select",
      to: authenticatedRole,
      using: enrolmentIsCallers("coachId", t.enrolmentId),
    }),
    pgPolicy("assignments_select_as_student", {
      for: "select",
      to: authenticatedRole,
      using: enrolmentIsCallers("studentId", t.enrolmentId),
    }),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: id(),
    enrolmentId: uuid("enrolment_id")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    /** Null for unassigned practice from the library. */
    assignmentId: uuid("assignment_id").references(() => assignments.id, {
      onDelete: "set null",
    }),
    libraryItemId: uuid("library_item_id")
      .notNull()
      .references(() => libraryItems.id, { onDelete: "restrict" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
    note: text("note").notNull().default(""),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    status: submissionStatus("status").notNull().default("processing"),
    createdAt: createdAt(),
  },
  (t): PgTableExtraConfigValue[] => [
    index("submissions_enrolment_id_idx").on(t.enrolmentId),
    index("submissions_assignment_id_idx").on(t.assignmentId),
    index("submissions_library_item_id_idx").on(t.libraryItemId),
    index("submissions_media_id_idx").on(t.mediaId),
    pgPolicy("submissions_select_as_student", {
      for: "select",
      to: authenticatedRole,
      using: enrolmentIsCallers("studentId", t.enrolmentId),
    }),
    pgPolicy("submissions_insert_as_student", {
      for: "insert",
      to: authenticatedRole,
      withCheck: enrolmentIsCallers("studentId", t.enrolmentId, { activeOnly: true }),
    }),
    pgPolicy("submissions_select_as_coach", {
      for: "select",
      to: authenticatedRole,
      using: enrolmentIsCallers("coachId", t.enrolmentId),
    }),
    pgPolicy("submissions_update_as_coach", {
      for: "update",
      to: authenticatedRole,
      using: enrolmentIsCallers("coachId", t.enrolmentId),
      withCheck: enrolmentIsCallers("coachId", t.enrolmentId),
    }),
  ],
);

export const feedback = pgTable(
  "feedback",
  {
    id: id(),
    submissionId: uuid("submission_id")
      .notNull()
      .unique("feedback_submission_id_key")
      .references(() => submissions.id, { onDelete: "cascade" }),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coaches.userId),
    body: text("body").notNull().default(""),
    replyMediaId: uuid("reply_media_id").references(() => mediaAssets.id, {
      onDelete: "restrict",
    }),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t): PgTableExtraConfigValue[] => [
    index("feedback_coach_id_idx").on(t.coachId),
    index("feedback_reply_media_id_idx").on(t.replyMediaId),
    pgPolicy("feedback_insert_as_coach", {
      for: "insert",
      to: authenticatedRole,
      withCheck: and(
        sql`${t.coachId} = ${authUid}`,
        submissionIsCallers("coachId", t.submissionId),
      ),
    }),
    pgPolicy("feedback_select_as_coach", {
      for: "select",
      to: authenticatedRole,
      using: submissionIsCallers("coachId", t.submissionId),
    }),
    pgPolicy("feedback_select_as_student", {
      for: "select",
      to: authenticatedRole,
      using: submissionIsCallers("studentId", t.submissionId),
    }),
  ],
);

export const feedbackComments = pgTable(
  "feedback_comments",
  {
    id: id(),
    feedbackId: uuid("feedback_id")
      .notNull()
      .references(() => feedback.id, { onDelete: "cascade" }),
    tSeconds: doublePrecision("t_seconds").notNull(),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t): PgTableExtraConfigValue[] => [
    check("feedback_comments_t_seconds_nonnegative", sql`${t.tSeconds} >= 0`),
    check("feedback_comments_body_not_empty", sql`${t.body} <> ''`),
    index("feedback_comments_feedback_id_idx").on(t.feedbackId),
    // Comments inherit visibility from their feedback row, whose own policies apply here.
    pgPolicy("feedback_comments_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${feedback} where ${feedback.id} = ${t.feedbackId})`,
    }),
    pgPolicy("feedback_comments_insert_as_coach", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists (
        select 1 from ${feedback}
        where ${feedback.id} = ${t.feedbackId} and ${feedback.coachId} = ${authUid}
      )`,
    }),
  ],
);

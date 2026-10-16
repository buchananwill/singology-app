import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  doublePrecision,
  index,
  pgPolicy,
  pgTable,
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

const enrolmentIsCallers = (role: "student_id" | "coach_id", enrolmentIdColumn: string) =>
  sql.raw(`exists (
    select 1 from public.enrolments e
    where e.id = ${enrolmentIdColumn} and e.${role} = (select auth.uid())
  )`);

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
  (t) => [
    index("assignments_enrolment_id_idx").on(t.enrolmentId),
    index("assignments_library_item_id_idx").on(t.libraryItemId),
    index("assignments_feedback_id_idx").on(t.feedbackId),
    pgPolicy("assignments_insert_as_coach", {
      for: "insert",
      to: authenticatedRole,
      withCheck: enrolmentIsCallers("coach_id", "assignments.enrolment_id"),
    }),
    pgPolicy("assignments_select_as_coach", {
      for: "select",
      to: authenticatedRole,
      using: enrolmentIsCallers("coach_id", "assignments.enrolment_id"),
    }),
    pgPolicy("assignments_select_as_student", {
      for: "select",
      to: authenticatedRole,
      using: enrolmentIsCallers("student_id", "assignments.enrolment_id"),
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
  (t) => [
    index("submissions_enrolment_id_idx").on(t.enrolmentId),
    index("submissions_assignment_id_idx").on(t.assignmentId),
    index("submissions_library_item_id_idx").on(t.libraryItemId),
    index("submissions_media_id_idx").on(t.mediaId),
    pgPolicy("submissions_select_as_student", {
      for: "select",
      to: authenticatedRole,
      using: enrolmentIsCallers("student_id", "submissions.enrolment_id"),
    }),
    pgPolicy("submissions_insert_as_student", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists (
        select 1 from public.enrolments e
        where e.id = submissions.enrolment_id and e.student_id = ${authUid} and e.status = 'active'
      )`,
    }),
    pgPolicy("submissions_select_as_coach", {
      for: "select",
      to: authenticatedRole,
      using: enrolmentIsCallers("coach_id", "submissions.enrolment_id"),
    }),
    pgPolicy("submissions_update_as_coach", {
      for: "update",
      to: authenticatedRole,
      using: enrolmentIsCallers("coach_id", "submissions.enrolment_id"),
      withCheck: enrolmentIsCallers("coach_id", "submissions.enrolment_id"),
    }),
  ],
);

const submissionIsCallers = (role: "student_id" | "coach_id", submissionIdColumn: string) =>
  sql.raw(`exists (
    select 1 from public.submissions s
    join public.enrolments e on e.id = s.enrolment_id
    where s.id = ${submissionIdColumn} and e.${role} = (select auth.uid())
  )`);

export const feedback = pgTable(
  "feedback",
  {
    id: id(),
    // Unique: one feedback per submission is a database fact.
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
  (t) => [
    index("feedback_coach_id_idx").on(t.coachId),
    index("feedback_reply_media_id_idx").on(t.replyMediaId),
    pgPolicy("feedback_insert_as_coach", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`feedback.coach_id = ${authUid} and ${submissionIsCallers("coach_id", "feedback.submission_id")}`,
    }),
    pgPolicy("feedback_select_as_coach", {
      for: "select",
      to: authenticatedRole,
      using: submissionIsCallers("coach_id", "feedback.submission_id"),
    }),
    pgPolicy("feedback_select_as_student", {
      for: "select",
      to: authenticatedRole,
      using: submissionIsCallers("student_id", "feedback.submission_id"),
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
  (t) => [
    check("feedback_comments_t_seconds_nonnegative", sql`${t.tSeconds} >= 0`),
    check("feedback_comments_body_not_empty", sql`${t.body} <> ''`),
    index("feedback_comments_feedback_id_idx").on(t.feedbackId),
    // Comments inherit visibility from their feedback row, whose own policies apply here.
    pgPolicy("feedback_comments_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from public.feedback f where f.id = feedback_comments.feedback_id)`,
    }),
    pgPolicy("feedback_comments_insert_as_coach", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists (
        select 1 from public.feedback f
        where f.id = feedback_comments.feedback_id and f.coach_id = ${authUid}
      )`,
    }),
  ],
);

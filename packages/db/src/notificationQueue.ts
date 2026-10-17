import type { NotificationKind } from "@singology/shared";
import { and, asc, eq, gte, isNotNull, isNull, notExists, sql } from "drizzle-orm";
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import type { Db } from "./client";
import {
  assignments,
  enrolments,
  feedback,
  libraryItems,
  notifications,
  profiles,
  submissions,
} from "./schema";

export interface DueNotification {
  kind: NotificationKind;
  userId: string;
  email: string;
  entityId?: string;
  periodStart?: string; // ISO date
  link: { submissionId: string } | { exerciseIds: string[] };
  displayName: string;
  /** The other person and the exercise that a feedback-ready or new-submission email names. */
  about?: { displayName: string; exerciseTitle: string };
}

export interface NotificationQueue {
  dueFeedbackReady(since: Date): Promise<DueNotification[]>;
  dueNewSubmission(since: Date): Promise<DueNotification[]>;
  duePracticeReminders(periodStart: string): Promise<DueNotification[]>;
  claim(due: DueNotification): Promise<{ id: string } | null>; // null when already sent
  markSent(id: string, providerMessageId: string): Promise<void>;
  release(id: string): Promise<void>; // the send failed; the row goes, the next tick retries
}

const counterparts = alias(profiles, "counterparts");
const takeEnrolments = alias(enrolments, "take_enrolments");

/** The queries select only users with an address; this narrows the column's type to match. */
function addressOf(email: string | null): string {
  if (email === null) {
    throw new Error("A due notification's recipient has no email address.");
  }
  return email;
}

function sentLogFor(kind: NotificationKind, entityId: AnyPgColumn) {
  return and(eq(notifications.kind, kind), eq(notifications.entityId, entityId));
}

export function createNotificationQueue(db: Db): NotificationQueue {
  return {
    async dueFeedbackReady(since) {
      const rows = await db
        .select({
          feedbackId: feedback.id,
          submissionId: submissions.id,
          userId: enrolments.studentId,
          email: authUsers.email,
          displayName: profiles.displayName,
          coachName: counterparts.displayName,
          exerciseTitle: libraryItems.title,
        })
        .from(feedback)
        .innerJoin(submissions, eq(submissions.id, feedback.submissionId))
        .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
        .innerJoin(profiles, eq(profiles.id, enrolments.studentId))
        .innerJoin(authUsers, eq(authUsers.id, enrolments.studentId))
        .innerJoin(counterparts, eq(counterparts.id, feedback.coachId))
        .innerJoin(libraryItems, eq(libraryItems.id, submissions.libraryItemId))
        .leftJoin(notifications, sentLogFor("feedback_ready", feedback.id))
        .where(
          and(gte(feedback.sentAt, since), isNotNull(authUsers.email), isNull(notifications.id)),
        )
        .orderBy(asc(feedback.sentAt));
      return rows.map((row) => ({
        kind: "feedback_ready",
        userId: row.userId,
        email: addressOf(row.email),
        entityId: row.feedbackId,
        link: { submissionId: row.submissionId },
        displayName: row.displayName,
        about: { displayName: row.coachName, exerciseTitle: row.exerciseTitle },
      }));
    },

    async dueNewSubmission(since) {
      const rows = await db
        .select({
          submissionId: submissions.id,
          userId: enrolments.coachId,
          email: authUsers.email,
          displayName: profiles.displayName,
          studentName: counterparts.displayName,
          exerciseTitle: libraryItems.title,
        })
        .from(submissions)
        .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
        .innerJoin(profiles, eq(profiles.id, enrolments.coachId))
        .innerJoin(authUsers, eq(authUsers.id, enrolments.coachId))
        .innerJoin(counterparts, eq(counterparts.id, enrolments.studentId))
        .innerJoin(libraryItems, eq(libraryItems.id, submissions.libraryItemId))
        .leftJoin(notifications, sentLogFor("new_submission", submissions.id))
        .where(
          and(
            eq(submissions.status, "awaiting_review"),
            gte(submissions.submittedAt, since),
            isNotNull(authUsers.email),
            isNull(notifications.id),
          ),
        )
        .orderBy(asc(submissions.submittedAt));
      return rows.map((row) => ({
        kind: "new_submission",
        userId: row.userId,
        email: addressOf(row.email),
        entityId: row.submissionId,
        link: { submissionId: row.submissionId },
        displayName: row.displayName,
        about: { displayName: row.studentName, exerciseTitle: row.exerciseTitle },
      }));
    },

    async duePracticeReminders(periodStart) {
      const weekBegan = new Date(`${periodStart}T00:00:00Z`);
      const takeThisWeek = db
        .select({ id: submissions.id })
        .from(submissions)
        .innerJoin(takeEnrolments, eq(takeEnrolments.id, submissions.enrolmentId))
        .where(
          and(
            eq(takeEnrolments.studentId, enrolments.studentId),
            gte(submissions.submittedAt, weekBegan),
          ),
        );
      const openExercises = db
        .select({ libraryItemId: assignments.libraryItemId })
        .from(assignments)
        .leftJoin(submissions, eq(submissions.assignmentId, assignments.id))
        .where(and(eq(assignments.enrolmentId, enrolments.id), isNull(submissions.id)))
        .orderBy(asc(assignments.assignedAt));
      const rows = await db
        .select({
          userId: enrolments.studentId,
          email: authUsers.email,
          displayName: profiles.displayName,
          // The builder has no ARRAY(subquery); one row per student needs the list in place.
          exerciseIds: sql<string[]>`array(${openExercises})`,
        })
        .from(enrolments)
        .innerJoin(profiles, eq(profiles.id, enrolments.studentId))
        .innerJoin(authUsers, eq(authUsers.id, enrolments.studentId))
        .leftJoin(
          notifications,
          and(
            eq(notifications.kind, "practice_reminder"),
            eq(notifications.userId, enrolments.studentId),
            eq(notifications.periodStart, periodStart),
          ),
        )
        .where(
          and(
            eq(enrolments.status, "active"),
            isNotNull(authUsers.email),
            isNull(notifications.id),
            notExists(takeThisWeek),
          ),
        )
        .orderBy(asc(enrolments.startedAt));
      return rows.map((row) => ({
        kind: "practice_reminder",
        userId: row.userId,
        email: addressOf(row.email),
        periodStart,
        link: { exerciseIds: row.exerciseIds },
        displayName: row.displayName,
      }));
    },

    async claim(due) {
      const [row] = await db
        .insert(notifications)
        .values({
          userId: due.userId,
          kind: due.kind,
          entityId: due.entityId ?? null,
          periodStart: due.periodStart ?? null,
        })
        .onConflictDoNothing()
        .returning({ id: notifications.id });
      return row ?? null;
    },

    async markSent(id, providerMessageId) {
      await db.update(notifications).set({ providerMessageId }).where(eq(notifications.id, id));
    },

    async release(id) {
      await db
        .delete(notifications)
        .where(and(eq(notifications.id, id), isNull(notifications.providerMessageId)));
    },
  };
}

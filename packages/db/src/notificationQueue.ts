import { firstName, type NotificationKind } from "@singology/shared";
import { and, asc, count, eq, gte, isNotNull, isNull, notExists, notLike, sql } from "drizzle-orm";
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
import { PLACEHOLDER_EMAIL_DOMAIN } from "./seed/alphaCast";

export interface Recipient {
  userId: string;
  email: string;
  displayName: string;
}

export interface FeedbackReadyDue {
  kind: "feedback_ready";
  recipient: Recipient;
  feedbackId: string;
  submissionId: string;
  coachFirstName: string;
  exerciseTitle: string;
}

export interface NewSubmissionDue {
  kind: "new_submission";
  recipient: Recipient;
  submissionId: string;
  studentFirstName: string;
  exerciseTitle: string;
}

export interface PracticeReminderDue {
  kind: "practice_reminder";
  recipient: Recipient;
  periodStart: string; // ISO date
  waitingCount: number;
}

export type DueNotification = FeedbackReadyDue | NewSubmissionDue | PracticeReminderDue;

// Fails to compile when a kind in NOTIFICATION_KINDS has no arm in the union above.
true satisfies NotificationKind extends DueNotification["kind"] ? true : never;

export interface NotificationQueue {
  dueFeedbackReady(since: Date): Promise<FeedbackReadyDue[]>;
  dueNewSubmission(since: Date): Promise<NewSubmissionDue[]>;
  duePracticeReminders(periodStart: string): Promise<PracticeReminderDue[]>;
  claim(due: DueNotification): Promise<{ id: string } | null>; // null when already sent
  markSent(id: string, providerMessageId: string): Promise<void>;
  release(id: string): Promise<void>; // the send failed; the row goes, the next tick retries
}

const counterparts = alias(profiles, "counterparts");
const takeEnrolments = alias(enrolments, "take_enrolments");

const hasDeliverableAddress = and(
  isNotNull(authUsers.email),
  notLike(authUsers.email, `%@${PLACEHOLDER_EMAIL_DOMAIN}`),
);

/** The queries select only deliverable addresses; this narrows the column's type to match. */
function toRecipient(row: {
  userId: string;
  email: string | null;
  displayName: string;
}): Recipient {
  if (row.email === null) {
    throw new Error("A due notification's recipient has no email address.");
  }
  return { userId: row.userId, email: row.email, displayName: row.displayName };
}

function sentLogFor(kind: NotificationKind, entityId: AnyPgColumn) {
  return and(eq(notifications.kind, kind), eq(notifications.entityId, entityId));
}

function sentLogKey(due: DueNotification): { entityId: string | null; periodStart: string | null } {
  switch (due.kind) {
    case "feedback_ready":
      return { entityId: due.feedbackId, periodStart: null };
    case "new_submission":
      return { entityId: due.submissionId, periodStart: null };
    case "practice_reminder":
      return { entityId: null, periodStart: due.periodStart };
  }
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
        .where(and(gte(feedback.sentAt, since), hasDeliverableAddress, isNull(notifications.id)))
        .orderBy(asc(feedback.sentAt));
      return rows.map((row) => ({
        kind: "feedback_ready",
        recipient: toRecipient(row),
        feedbackId: row.feedbackId,
        submissionId: row.submissionId,
        coachFirstName: firstName(row.coachName),
        exerciseTitle: row.exerciseTitle,
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
            hasDeliverableAddress,
            isNull(notifications.id),
          ),
        )
        .orderBy(asc(submissions.submittedAt));
      return rows.map((row) => ({
        kind: "new_submission",
        recipient: toRecipient(row),
        submissionId: row.submissionId,
        studentFirstName: firstName(row.studentName),
        exerciseTitle: row.exerciseTitle,
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
      const waitingExercises = db
        .select({ waiting: count() })
        .from(assignments)
        .leftJoin(submissions, eq(submissions.assignmentId, assignments.id))
        .where(and(eq(assignments.enrolmentId, enrolments.id), isNull(submissions.id)));
      const rows = await db
        .select({
          userId: enrolments.studentId,
          email: authUsers.email,
          displayName: profiles.displayName,
          // The builder selects no scalar subquery; one row per student needs the count in place.
          waitingCount: sql<number>`(${waitingExercises})`.mapWith(Number),
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
            hasDeliverableAddress,
            isNull(notifications.id),
            notExists(takeThisWeek),
          ),
        )
        .orderBy(asc(enrolments.startedAt));
      return rows.map((row) => ({
        kind: "practice_reminder",
        recipient: toRecipient(row),
        periodStart,
        waitingCount: row.waitingCount,
      }));
    },

    async claim(due) {
      const [row] = await db
        .insert(notifications)
        .values({ userId: due.recipient.userId, kind: due.kind, ...sentLogKey(due) })
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

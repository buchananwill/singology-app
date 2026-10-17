import { firstName, type IsoDate, type NotificationKind, startOfIsoDate } from "@singology/shared";
import { and, asc, eq, gte, isNotNull, isNull, notExists, notLike, type SQL } from "drizzle-orm";
import { alias, type AnyPgColumn, type PgSelect } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import type { Db } from "./client";
import { PLACEHOLDER_EMAIL_DOMAIN } from "./placeholderEmail";
import {
  assignments,
  enrolments,
  feedback,
  libraryItems,
  notifications,
  profiles,
  submissions,
} from "./schema";

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
  periodStart: IsoDate;
  waitingCount: number;
}

export type DueNotification = FeedbackReadyDue | NewSubmissionDue | PracticeReminderDue;

// Fails to compile when a kind in NOTIFICATION_KINDS has no arm in the union above.
true satisfies NotificationKind extends DueNotification["kind"] ? true : never;

export type NotificationRow = typeof notifications.$inferSelect;
export type ClaimedNotification = Pick<NotificationRow, "id">;
export type SentLogKey = Pick<NotificationRow, "entityId" | "periodStart">;

export interface NotificationQueue {
  dueFeedbackReady(since: Date): Promise<FeedbackReadyDue[]>;
  dueNewSubmission(since: Date): Promise<NewSubmissionDue[]>;
  duePracticeReminders(periodStart: IsoDate): Promise<PracticeReminderDue[]>;
  claim(due: DueNotification): Promise<ClaimedNotification | null>; // null when already sent
  markSent(id: string, providerMessageId: string): Promise<void>;
  release(id: string): Promise<void>; // the send failed; the row goes, the next tick retries
}

export type RecipientRow = Omit<Recipient, "email"> & { email: Recipient["email"] | null };

type RecipientUserIdColumn = AnyPgColumn<{ data: string; notNull: true }>;

export interface RecipientQuery<TUserId extends RecipientUserIdColumn> {
  fields: {
    userId: TUserId;
    email: typeof authUsers.email;
    displayName: typeof profiles.displayName;
  };
  join: <T extends PgSelect>(query: T) => T;
  deliverable: SQL | undefined;
}

/** Fails to compile when a query's selected recipient is not a `RecipientRow`, `never` included. */
type SelectsRecipientRow<T> = [T] extends [never] ? never : T extends RecipientRow ? true : never;

const counterparts = alias(profiles, "counterparts");
const takeEnrolments = alias(enrolments, "take_enrolments");

function recipientOf<TUserId extends RecipientUserIdColumn>(
  userId: TUserId,
): RecipientQuery<TUserId> {
  return {
    fields: { userId, email: authUsers.email, displayName: profiles.displayName },
    // A dynamic query joins in place, so the caller's selection type carries through unchanged.
    join: (query) => {
      query.innerJoin(profiles, eq(profiles.id, userId));
      query.innerJoin(authUsers, eq(authUsers.id, userId));
      return query;
    },
    deliverable: and(
      isNotNull(authUsers.email),
      notLike(authUsers.email, `%@${PLACEHOLDER_EMAIL_DOMAIN}`),
    ),
  };
}

/** The queries select only deliverable addresses; this narrows the column's type to match. */
function toRecipient(row: RecipientRow): Recipient {
  if (row.email === null) {
    throw new Error("A due notification's recipient has no email address.");
  }
  return { ...row, email: row.email };
}

function sentLogKey(due: DueNotification): SentLogKey {
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
  const notLogged = (kind: NotificationKind, ...keyPredicates: SQL[]) =>
    notExists(
      db
        .select({ id: notifications.id })
        .from(notifications)
        .where(and(eq(notifications.kind, kind), ...keyPredicates)),
    );

  return {
    async dueFeedbackReady(since) {
      const recipient = recipientOf(enrolments.studentId);
      const query = db
        .select({
          recipient: recipient.fields,
          feedbackId: feedback.id,
          submissionId: submissions.id,
          coachName: counterparts.displayName,
          exerciseTitle: libraryItems.title,
        })
        .from(feedback)
        .innerJoin(submissions, eq(submissions.id, feedback.submissionId))
        .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
        .innerJoin(counterparts, eq(counterparts.id, feedback.coachId))
        .innerJoin(libraryItems, eq(libraryItems.id, submissions.libraryItemId))
        .$dynamic();
      const rows = await recipient
        .join(query)
        .where(
          and(
            gte(feedback.sentAt, since),
            recipient.deliverable,
            notLogged("feedback_ready", eq(notifications.entityId, feedback.id)),
          ),
        )
        .orderBy(asc(feedback.sentAt));
      true satisfies SelectsRecipientRow<(typeof rows)[number]["recipient"]>;
      return rows.map((row) => ({
        kind: "feedback_ready",
        recipient: toRecipient(row.recipient),
        feedbackId: row.feedbackId,
        submissionId: row.submissionId,
        coachFirstName: firstName(row.coachName),
        exerciseTitle: row.exerciseTitle,
      }));
    },

    async dueNewSubmission(since) {
      const recipient = recipientOf(enrolments.coachId);
      const query = db
        .select({
          recipient: recipient.fields,
          submissionId: submissions.id,
          studentName: counterparts.displayName,
          exerciseTitle: libraryItems.title,
        })
        .from(submissions)
        .innerJoin(enrolments, eq(enrolments.id, submissions.enrolmentId))
        .innerJoin(counterparts, eq(counterparts.id, enrolments.studentId))
        .innerJoin(libraryItems, eq(libraryItems.id, submissions.libraryItemId))
        .$dynamic();
      const rows = await recipient
        .join(query)
        .where(
          and(
            eq(submissions.status, "awaiting_review"),
            gte(submissions.submittedAt, since),
            recipient.deliverable,
            notLogged("new_submission", eq(notifications.entityId, submissions.id)),
          ),
        )
        .orderBy(asc(submissions.submittedAt));
      true satisfies SelectsRecipientRow<(typeof rows)[number]["recipient"]>;
      return rows.map((row) => ({
        kind: "new_submission",
        recipient: toRecipient(row.recipient),
        submissionId: row.submissionId,
        studentFirstName: firstName(row.studentName),
        exerciseTitle: row.exerciseTitle,
      }));
    },

    async duePracticeReminders(periodStart) {
      const recipient = recipientOf(enrolments.studentId);
      const takeThisWeek = db
        .select({ id: submissions.id })
        .from(submissions)
        .innerJoin(takeEnrolments, eq(takeEnrolments.id, submissions.enrolmentId))
        .where(
          and(
            eq(takeEnrolments.studentId, enrolments.studentId),
            gte(submissions.submittedAt, startOfIsoDate(periodStart)),
          ),
        );
      const taken = db
        .select({ id: submissions.id })
        .from(submissions)
        .where(eq(submissions.assignmentId, assignments.id));
      const query = db
        .select({
          recipient: recipient.fields,
          waitingCount: db.$count(
            assignments,
            and(eq(assignments.enrolmentId, enrolments.id), notExists(taken)),
          ),
        })
        .from(enrolments)
        .$dynamic();
      const rows = await recipient
        .join(query)
        .where(
          and(
            eq(enrolments.status, "active"),
            recipient.deliverable,
            notLogged(
              "practice_reminder",
              eq(notifications.userId, enrolments.studentId),
              eq(notifications.periodStart, periodStart),
            ),
            notExists(takeThisWeek),
          ),
        )
        .orderBy(asc(enrolments.startedAt));
      true satisfies SelectsRecipientRow<(typeof rows)[number]["recipient"]>;
      return rows.map((row) => ({
        kind: "practice_reminder",
        recipient: toRecipient(row.recipient),
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

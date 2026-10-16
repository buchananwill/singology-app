import {
  type Assignment,
  type AssignmentStatus,
  type Feedback,
  type FeedbackComment,
  indexById,
  type LibraryFilter,
  type RecordEvent,
  type Submission,
} from "@singology/shared";

import type {
  CoachQueueItem,
  OwnedSubmission,
  Repositories,
  RepositoryOptions,
} from "../repositories";
import { createFixtureData, type FixtureData } from "./data";

type EnrolmentOwner = "studentId" | "coachId";

function pickByIds<T extends { id: string }>(rows: readonly T[], ids: readonly string[]): T[] {
  const byId = indexById(rows);
  return ids.flatMap((id) => byId.get(id) ?? []);
}

function matchesFilter(
  item: FixtureData["libraryItems"][number],
  filter: LibraryFilter | undefined,
): boolean {
  if (filter?.category !== undefined && item.category !== filter.category) {
    return false;
  }
  if (filter?.voiceType !== undefined && !item.voiceTypes.includes(filter.voiceType)) {
    return false;
  }
  if (filter?.difficulty !== undefined && item.difficulty !== filter.difficulty) {
    return false;
  }
  if (filter?.tag !== undefined && !item.tags.some((tag) => tag.slug === filter.tag)) {
    return false;
  }
  return true;
}

/** Nothing persists beyond the instance: writes change this request's own copy of the fixtures. */
export function createFixtureRepositories({ now }: RepositoryOptions): Repositories {
  const data = structuredClone(createFixtureData(now));
  const nowIso = now.toISOString();
  const pendingMediaIds = new Set<string>();
  const events: RecordEvent[] = [];
  const enrolmentIdsFor = (owner: EnrolmentOwner, ownerId: string): Set<string> =>
    new Set(data.enrolments.filter((e) => e[owner] === ownerId).map((e) => e.id));

  const ownedSubmission = (
    owner: EnrolmentOwner,
    ownerId: string,
    submissionId: string,
  ): OwnedSubmission | undefined => {
    const submission = data.submissions.find((s) => s.id === submissionId);
    const enrolment = data.enrolments.find((e) => e.id === submission?.enrolmentId);
    return submission && enrolment?.[owner] === ownerId
      ? structuredClone({ submission, enrolment })
      : undefined;
  };

  const queueFor = (coachId: string) => {
    const enrolmentIds = enrolmentIdsFor("coachId", coachId);
    return data.submissions
      .filter((s) => s.status === "awaiting_review" && enrolmentIds.has(s.enrolmentId))
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  };

  const setAssignmentStatus = (assignmentId: string, status: AssignmentStatus) => {
    const assignment = data.assignments.find((a) => a.id === assignmentId);
    if (assignment !== undefined) {
      assignment.status = status;
    }
  };

  const commentsFor = (feedbackId: string) =>
    data.feedbackComments
      .filter((c) => c.feedbackId === feedbackId)
      .sort((a, b) => a.tSeconds - b.tSeconds);

  return {
    coaches: {
      listWithOffers: async () =>
        structuredClone(
          data.coaches.map((coach) => ({
            coach,
            offers: data.coachOffers.filter((o) => o.coachId === coach.id),
          })),
        ),
      get: async (id) => structuredClone(data.coaches.find((c) => c.id === id)),
    },
    students: {
      get: async (id) => structuredClone(data.students.find((s) => s.id === id)),
    },
    enrolments: {
      forStudent: async (studentId) =>
        structuredClone(data.enrolments.filter((e) => e.studentId === studentId)),
    },
    library: {
      list: async (filter) =>
        structuredClone(data.libraryItems.filter((i) => matchesFilter(i, filter))),
      get: async (id) => structuredClone(data.libraryItems.find((i) => i.id === id)),
      getMany: async (ids) => structuredClone(pickByIds(data.libraryItems, ids)),
      listCollections: async () =>
        structuredClone(data.collections.toSorted((a, b) => a.position - b.position)),
    },
    media: {
      get: async (id) => structuredClone(data.mediaAssets.find((m) => m.id === id)),
      getMany: async (ids) => structuredClone(pickByIds(data.mediaAssets, ids)),
      register: async () => {
        const id = crypto.randomUUID();
        pendingMediaIds.add(id);
        return { id };
      },
    },
    events: {
      record: async (input) => {
        events.push(structuredClone(input));
      },
    },
    assignments: {
      forStudent: async (studentId) => {
        const enrolmentIds = enrolmentIdsFor("studentId", studentId);
        return structuredClone(data.assignments.filter((a) => enrolmentIds.has(a.enrolmentId)));
      },
    },
    submissions: {
      getForStudent: async (studentId, submissionId) =>
        ownedSubmission("studentId", studentId, submissionId),
      getForCoach: async (coachId, submissionId) =>
        ownedSubmission("coachId", coachId, submissionId),
      forStudent: async (studentId) => {
        const enrolmentIds = enrolmentIdsFor("studentId", studentId);
        return structuredClone(data.submissions.filter((s) => enrolmentIds.has(s.enrolmentId)));
      },
      queueViewForCoach: async (coachId) =>
        structuredClone(
          queueFor(coachId).flatMap((submission): CoachQueueItem[] => {
            const enrolment = data.enrolments.find((e) => e.id === submission.enrolmentId);
            const student = data.students.find((s) => s.id === enrolment?.studentId);
            const item = data.libraryItems.find((i) => i.id === submission.libraryItemId);
            const media = data.mediaAssets.find((m) => m.id === submission.mediaId);
            return student && item && media
              ? [{ submission, student, item, mediaKind: media.kind }]
              : [];
          }),
        ),
      previousFor: async (submissionId) => {
        const current = data.submissions.find((s) => s.id === submissionId);
        const studentId = data.enrolments.find((e) => e.id === current?.enrolmentId)?.studentId;
        if (current === undefined || studentId === undefined) {
          return undefined;
        }
        const enrolmentIds = enrolmentIdsFor("studentId", studentId);
        const [previous] = data.submissions
          .filter(
            (s) =>
              enrolmentIds.has(s.enrolmentId) &&
              s.libraryItemId === current.libraryItemId &&
              s.submittedAt < current.submittedAt,
          )
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
        return structuredClone(previous);
      },
      create: async (input) => {
        const enrolment = data.enrolments.find((e) => e.id === input.enrolmentId);
        if (enrolment?.status !== "active") {
          throw new Error("No active enrolment for this submission.");
        }
        const knownMedia =
          pendingMediaIds.has(input.mediaId) ||
          data.mediaAssets.some((m) => m.id === input.mediaId);
        if (!knownMedia) {
          throw new Error("The submission's media is not registered.");
        }
        if (input.assignmentId !== undefined) {
          const assignment = data.assignments.find((a) => a.id === input.assignmentId);
          if (
            assignment?.enrolmentId !== input.enrolmentId ||
            assignment.libraryItemId !== input.libraryItemId
          ) {
            throw new Error("The assignment is for a different enrolment or exercise.");
          }
        }
        const submission: Submission = {
          id: crypto.randomUUID(),
          enrolmentId: input.enrolmentId,
          assignmentId: input.assignmentId,
          libraryItemId: input.libraryItemId,
          mediaId: input.mediaId,
          note: input.note,
          submittedAt: nowIso,
          status: "processing",
        };
        data.submissions.push(submission);
        if (input.assignmentId !== undefined) {
          setAssignmentStatus(input.assignmentId, "submitted");
        }
        return structuredClone(submission);
      },
    },
    feedback: {
      forSubmissionWithComments: async (submissionId) => {
        const feedback = data.feedback.find((f) => f.submissionId === submissionId);
        return feedback === undefined
          ? undefined
          : structuredClone({ feedback, comments: commentsFor(feedback.id) });
      },
      forStudent: async (studentId) => {
        const enrolmentIds = enrolmentIdsFor("studentId", studentId);
        const submissionIds = new Set(
          data.submissions.filter((s) => enrolmentIds.has(s.enrolmentId)).map((s) => s.id),
        );
        return structuredClone(
          data.feedback
            .filter((f) => submissionIds.has(f.submissionId))
            .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
        );
      },
      comments: async (feedbackId) => structuredClone(commentsFor(feedbackId)),
      send: async (input) => {
        const submission = data.submissions.find((s) => s.id === input.submissionId);
        const enrolment = data.enrolments.find((e) => e.id === submission?.enrolmentId);
        if (submission === undefined || enrolment === undefined) {
          throw new Error("No such submission.");
        }
        if (data.feedback.some((f) => f.submissionId === submission.id)) {
          throw new Error("This submission already has feedback.");
        }
        const feedback: Feedback = {
          id: crypto.randomUUID(),
          submissionId: submission.id,
          coachId: enrolment.coachId,
          body: input.summary,
          replyMediaId: input.replyMediaId,
          sentAt: nowIso,
        };
        const comments = input.comments.map((comment): FeedbackComment => ({
          id: crypto.randomUUID(),
          feedbackId: feedback.id,
          ...comment,
        }));
        data.feedback.push(feedback);
        data.feedbackComments.push(...comments);
        submission.status = "reviewed";
        if (submission.assignmentId !== undefined) {
          setAssignmentStatus(submission.assignmentId, "feedback_ready");
        }
        data.assignments.push(
          ...input.assignLibraryItemIds.map((libraryItemId): Assignment => ({
            id: crypto.randomUUID(),
            enrolmentId: enrolment.id,
            libraryItemId,
            assignedAt: nowIso,
            status: "todo",
          })),
        );
        return structuredClone({ feedback, comments: commentsFor(feedback.id) });
      },
    },
  };
}

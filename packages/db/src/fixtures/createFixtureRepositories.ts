import type { LibraryFilter } from "@singology/shared";

import type {
  CoachQueueItem,
  OwnedSubmission,
  Repositories,
  RepositoryOptions,
} from "../repositories";
import { createFixtureData, type FixtureData } from "./data";

/** The enrolment field that names its owner: the student or the coach. */
type EnrolmentOwner = "studentId" | "coachId";

/**
 * Returns a deep copy so callers can never mutate the fixtures.
 * Fixture values are plain JSON data, so a JSON round trip is lossless.
 */
function copy<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

/** The rows with these ids, in the order given; unknown ids are omitted. */
function pickByIds<T extends { id: string }>(rows: readonly T[], ids: readonly string[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
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
  return true;
}

/**
 * Implements the repository interface over in-module fixture data, with the
 * fixtures' time offsets resolved against `now` (the request time). Nothing persists.
 */
export function createFixtureRepositories({ now }: RepositoryOptions): Repositories {
  const data = createFixtureData(now);
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
      ? copy({ submission, enrolment })
      : undefined;
  };

  const queueFor = (coachId: string) => {
    const enrolmentIds = enrolmentIdsFor("coachId", coachId);
    return data.submissions
      .filter((s) => s.status === "awaiting_review" && enrolmentIds.has(s.enrolmentId))
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  };

  const commentsFor = (feedbackId: string) =>
    data.feedbackComments
      .filter((c) => c.feedbackId === feedbackId)
      .sort((a, b) => a.tSeconds - b.tSeconds);

  return {
    coaches: {
      list: async () => copy(data.coaches),
      listWithOffers: async () =>
        copy(
          data.coaches.map((coach) => ({
            coach,
            offers: data.coachOffers.filter((o) => o.coachId === coach.id),
          })),
        ),
      get: async (id) => copy(data.coaches.find((c) => c.id === id)),
      offers: async (coachId) => copy(data.coachOffers.filter((o) => o.coachId === coachId)),
    },
    students: {
      get: async (id) => copy(data.students.find((s) => s.id === id)),
    },
    enrolments: {
      get: async (id) => copy(data.enrolments.find((e) => e.id === id)),
      forStudent: async (studentId) =>
        copy(data.enrolments.filter((e) => e.studentId === studentId)),
    },
    library: {
      list: async (filter) => copy(data.libraryItems.filter((i) => matchesFilter(i, filter))),
      get: async (id) => copy(data.libraryItems.find((i) => i.id === id)),
      getMany: async (ids) => copy(pickByIds(data.libraryItems, ids)),
    },
    media: {
      get: async (id) => copy(data.mediaAssets.find((m) => m.id === id)),
      getMany: async (ids) => copy(pickByIds(data.mediaAssets, ids)),
    },
    assignments: {
      forStudent: async (studentId) => {
        const enrolmentIds = enrolmentIdsFor("studentId", studentId);
        return copy(data.assignments.filter((a) => enrolmentIds.has(a.enrolmentId)));
      },
    },
    submissions: {
      get: async (id) => copy(data.submissions.find((s) => s.id === id)),
      getForStudent: async (studentId, submissionId) =>
        ownedSubmission("studentId", studentId, submissionId),
      getForCoach: async (coachId, submissionId) =>
        ownedSubmission("coachId", coachId, submissionId),
      forStudent: async (studentId) => {
        const enrolmentIds = enrolmentIdsFor("studentId", studentId);
        return copy(data.submissions.filter((s) => enrolmentIds.has(s.enrolmentId)));
      },
      queueForCoach: async (coachId) => copy(queueFor(coachId)),
      queueViewForCoach: async (coachId) =>
        copy(
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
        return copy(previous);
      },
    },
    feedback: {
      forSubmission: async (submissionId) =>
        copy(data.feedback.find((f) => f.submissionId === submissionId)),
      forSubmissionWithComments: async (submissionId) => {
        const feedback = data.feedback.find((f) => f.submissionId === submissionId);
        return feedback === undefined
          ? undefined
          : copy({ feedback, comments: commentsFor(feedback.id) });
      },
      forStudent: async (studentId) => {
        const enrolmentIds = enrolmentIdsFor("studentId", studentId);
        const submissionIds = new Set(
          data.submissions.filter((s) => enrolmentIds.has(s.enrolmentId)).map((s) => s.id),
        );
        return copy(
          data.feedback
            .filter((f) => submissionIds.has(f.submissionId))
            .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
        );
      },
      comments: async (feedbackId) => copy(commentsFor(feedbackId)),
    },
  };
}

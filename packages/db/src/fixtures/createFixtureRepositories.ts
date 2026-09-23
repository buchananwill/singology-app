import type { LibraryFilter } from "@singology/shared";

import type { Repositories, RepositoryOptions } from "../repositories";
import { createFixtureData, type FixtureData } from "./data";

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
  const enrolmentIdsForStudent = (studentId: string): Set<string> =>
    new Set(data.enrolments.filter((e) => e.studentId === studentId).map((e) => e.id));

  const enrolmentIdsForCoach = (coachId: string): Set<string> =>
    new Set(data.enrolments.filter((e) => e.coachId === coachId).map((e) => e.id));

  return {
    coaches: {
      list: async () => copy(data.coaches),
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
    },
    media: {
      get: async (id) => copy(data.mediaAssets.find((m) => m.id === id)),
    },
    assignments: {
      forStudent: async (studentId) => {
        const enrolmentIds = enrolmentIdsForStudent(studentId);
        return copy(data.assignments.filter((a) => enrolmentIds.has(a.enrolmentId)));
      },
    },
    submissions: {
      get: async (id) => copy(data.submissions.find((s) => s.id === id)),
      forStudent: async (studentId) => {
        const enrolmentIds = enrolmentIdsForStudent(studentId);
        return copy(data.submissions.filter((s) => enrolmentIds.has(s.enrolmentId)));
      },
      queueForCoach: async (coachId) => {
        const enrolmentIds = enrolmentIdsForCoach(coachId);
        const queue = data.submissions
          .filter((s) => s.status === "awaiting_review" && enrolmentIds.has(s.enrolmentId))
          .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
        return copy(queue);
      },
    },
    feedback: {
      forSubmission: async (submissionId) =>
        copy(data.feedback.find((f) => f.submissionId === submissionId)),
      forStudent: async (studentId) => {
        const enrolmentIds = enrolmentIdsForStudent(studentId);
        const submissionIds = new Set(
          data.submissions.filter((s) => enrolmentIds.has(s.enrolmentId)).map((s) => s.id),
        );
        return copy(
          data.feedback
            .filter((f) => submissionIds.has(f.submissionId))
            .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
        );
      },
      comments: async (feedbackId) =>
        copy(
          data.feedbackComments
            .filter((c) => c.feedbackId === feedbackId)
            .sort((a, b) => a.tSeconds - b.tSeconds),
        ),
    },
  };
}

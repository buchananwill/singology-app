import type { Repositories, RepositoryOptions } from "../repositories";
import { createFixtureData } from "./data";
import { fixtureAssignments } from "./repositories/assignments";
import { fixtureCoaches } from "./repositories/coaches";
import { fixtureEnrolments } from "./repositories/enrolments";
import { fixtureEvents } from "./repositories/events";
import { fixtureFeedback } from "./repositories/feedback";
import { fixtureLibrary } from "./repositories/library";
import { fixtureMe } from "./repositories/me";
import { fixtureMedia } from "./repositories/media";
import { fixtureStudents } from "./repositories/students";
import { fixtureSubmissions } from "./repositories/submissions";
import type { FixtureState } from "./state";

/** Nothing persists beyond the instance: writes change this request's own copy of the fixtures. */
export function createFixtureRepositories({ now }: RepositoryOptions): Repositories {
  const state: FixtureState = {
    data: structuredClone(createFixtureData(now)),
    nowIso: now.toISOString(),
    pendingMediaIds: new Set(),
    events: [],
  };
  return {
    me: fixtureMe(),
    coaches: fixtureCoaches(state),
    students: fixtureStudents(state),
    enrolments: fixtureEnrolments(state),
    library: fixtureLibrary(state),
    media: fixtureMedia(state),
    assignments: fixtureAssignments(state),
    submissions: fixtureSubmissions(state),
    feedback: fixtureFeedback(state),
    events: fixtureEvents(state),
  };
}

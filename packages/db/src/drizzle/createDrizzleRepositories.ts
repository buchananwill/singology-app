import type { UserDb } from "../client";
import type { Repositories, RepositoryOptions } from "../repositories";
import { drizzleAssignments } from "./assignments";
import { drizzleCoaches } from "./coaches";
import { drizzleEnrolments } from "./enrolments";
import { drizzleEvents } from "./events";
import { drizzleFeedback } from "./feedback";
import { drizzleLibrary } from "./library";
import { drizzleMe } from "./me";
import { drizzleMedia } from "./media";
import { drizzleStudents } from "./students";
import { drizzleSubmissions } from "./submissions";

/** `options` is accepted for parity with the fixtures and ignored: the database holds real times. */
export function createDrizzleRepositories(db: UserDb, _options: RepositoryOptions): Repositories {
  return {
    me: drizzleMe(db),
    coaches: drizzleCoaches(db),
    students: drizzleStudents(db),
    enrolments: drizzleEnrolments(db),
    library: drizzleLibrary(db),
    media: drizzleMedia(db),
    assignments: drizzleAssignments(db),
    submissions: drizzleSubmissions(db),
    feedback: drizzleFeedback(db),
    events: drizzleEvents(db),
  };
}

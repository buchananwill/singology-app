import type { Enrolment } from "@singology/shared";

/** A side of an enrolment: the same key names the domain field and the `enrolments` column. */
export type EnrolmentParty = keyof Pick<Enrolment, "studentId" | "coachId">;

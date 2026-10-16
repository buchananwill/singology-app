import type { EnrolmentRepository } from "../../repositories";
import type { FixtureState } from "../state";

export function fixtureEnrolments({ data }: FixtureState): EnrolmentRepository {
  return {
    forStudent: async (studentId) =>
      structuredClone(data.enrolments.filter((e) => e.studentId === studentId)),
  };
}

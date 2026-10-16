import type { StudentRepository } from "../../repositories";
import type { FixtureState } from "../state";

export function fixtureStudents({ data }: FixtureState): StudentRepository {
  return {
    get: async (id) => structuredClone(data.students.find((s) => s.id === id)),
  };
}

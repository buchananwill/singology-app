import type { EventRepository } from "../../repositories";
import type { FixtureState } from "../state";

export function fixtureEvents({ events }: FixtureState): EventRepository {
  return {
    record: async (input) => {
      events.push(structuredClone(input));
    },
  };
}

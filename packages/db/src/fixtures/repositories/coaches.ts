import { groupBy } from "@singology/shared";

import type { CoachRepository } from "../../repositories";
import type { FixtureState } from "../state";

export function fixtureCoaches({ data }: FixtureState): CoachRepository {
  return {
    listWithOffers: async () => {
      const offersByCoach = groupBy(data.coachOffers, (offer) => offer.coachId);
      return structuredClone(
        data.coaches.map((coach) => ({ coach, offers: offersByCoach.get(coach.id) ?? [] })),
      );
    },
    get: async (id) => structuredClone(data.coaches.find((c) => c.id === id)),
  };
}

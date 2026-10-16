import { groupBy } from "@singology/shared";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import type { UserDb } from "../client";
import type { CoachRepository } from "../repositories";
import { coaches, coachOffers, profiles } from "../schema";
import { toCoach, toCoachOffer } from "./mappers";

export function drizzleCoaches(db: UserDb): CoachRepository {
  return {
    listWithOffers: () =>
      db(async (tx) => {
        const coachRows = await tx
          .select({ coach: coaches, displayName: profiles.displayName })
          .from(coaches)
          .innerJoin(profiles, eq(profiles.id, coaches.userId))
          .where(eq(coaches.active, true))
          .orderBy(asc(coaches.createdAt), asc(coaches.userId));
        const offerRows = await tx
          .select()
          .from(coachOffers)
          .where(
            and(
              eq(coachOffers.active, true),
              inArray(
                coachOffers.coachId,
                coachRows.map((row) => row.coach.userId),
              ),
            ),
          )
          .orderBy(asc(coachOffers.billing), desc(coachOffers.pricePence));
        const offersByCoach = groupBy(offerRows, (offer) => offer.coachId);
        return coachRows.map(({ coach, displayName }) => ({
          coach: toCoach(coach, displayName),
          offers: (offersByCoach.get(coach.userId) ?? []).map(toCoachOffer),
        }));
      }),
    get: (id) =>
      db(async (tx) => {
        const [row] = await tx
          .select({ coach: coaches, displayName: profiles.displayName })
          .from(coaches)
          .innerJoin(profiles, eq(profiles.id, coaches.userId))
          .where(eq(coaches.userId, id));
        return row && toCoach(row.coach, row.displayName);
      }),
  };
}

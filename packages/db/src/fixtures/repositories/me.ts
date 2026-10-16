import type { MeRepository } from "../../repositories";

// The fixtures have no session, so their caller is always anonymous.
export function fixtureMe(): MeRepository {
  return {
    get: async () => null,
  };
}

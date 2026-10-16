import type { VoiceType } from "@singology/shared";

import { fixtureUuid } from "./fixtureUuid";

// Placeholders until the lead supplies the real addresses (S3). The seed upserts on email.
export const FOUNDER_EMAIL = "founder@singology.test";
export const CTO_EMAIL = "cto@singology.test";

/**
 * The founder coaches as `coach-founder`; the CTO is a student enrolled with the founder and also
 * coaches as `coach-standard`, so both sides of the loop can be tested with two accounts.
 */
export const ALPHA_USERS = [
  { email: FOUNDER_EMAIL, displayName: "Singology founder", coachFixtureId: "coach-founder" },
  { email: CTO_EMAIL, displayName: "Singology CTO", coachFixtureId: "coach-standard" },
] as const;

export const CTO_VOICE_TYPE: VoiceType = "baritone";

export const ALPHA_ENROLMENT = {
  id: fixtureUuid("enrol-cto-founder"),
  offerFixtureId: "offer-founder-monthly",
} as const;

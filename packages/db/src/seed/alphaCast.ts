export const FOUNDER_EMAIL = "liveandletfunk@gmail.com";
export const CTO_EMAIL = "willwritescode@gmail.com";
export const CTO_DISPLAY_NAME = "Singology CTO";

/** The seeded users the e2e suite signs in as; `ben` is the cast's student-only user. */
export const E2E_TESTERS = ["founder", "cto", "ben"] as const;
export type E2eTester = (typeof E2E_TESTERS)[number];

export const E2E_EMAILS: Record<E2eTester, string> = {
  founder: FOUNDER_EMAIL,
  cto: CTO_EMAIL,
  ben: placeholderEmail("student-ben"),
};

export interface CastMember {
  email: string;
  displayName: string;
  coachFixtureId?: string;
  studentFixtureId?: string;
}

// The CTO tests both sides of the loop with one account.
export const ALPHA_USERS: readonly CastMember[] = [
  { email: FOUNDER_EMAIL, displayName: "Singology founder", coachFixtureId: "coach-founder" },
  {
    email: CTO_EMAIL,
    displayName: CTO_DISPLAY_NAME,
    coachFixtureId: "coach-standard",
    studentFixtureId: "student-ada",
  },
];

/** The other fixture students are users with addresses that never receive mail. */
export function placeholderEmail(fixtureId: string): string {
  return `${fixtureId}@singology.test`;
}

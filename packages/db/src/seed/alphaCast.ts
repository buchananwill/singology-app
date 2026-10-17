/** The seeded users the e2e suite signs in as; `ben` is the cast's student-only user. */
export const ALPHA_TESTERS = ["founder", "cto", "ben"] as const;
export type AlphaTester = (typeof ALPHA_TESTERS)[number];

export const ALPHA_EMAILS: Record<AlphaTester, string> = {
  founder: "liveandletfunk@gmail.com",
  cto: "willwritescode@gmail.com",
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
  {
    email: ALPHA_EMAILS.founder,
    displayName: "Singology founder",
    coachFixtureId: "coach-founder",
  },
  {
    email: ALPHA_EMAILS.cto,
    displayName: "Singology CTO",
    coachFixtureId: "coach-standard",
    studentFixtureId: "student-ada",
  },
];

/** The other fixture students are users with addresses that never receive mail. */
export function placeholderEmail(fixtureId: string): string {
  return `${fixtureId}@singology.test`;
}

export const ALPHA_EMAILS = {
  founder: "liveandletfunk@gmail.com",
  cto: "willwritescode@gmail.com",
} as const;

export type AlphaTester = keyof typeof ALPHA_EMAILS;

export interface CastMember {
  email: string;
  displayName: string;
  coachFixtureId?: string;
  studentFixtureId?: string;
}

/**
 * The two people who sign in. The founder coaches as `coach-founder`; the CTO coaches as
 * `coach-standard` and is also `student-ada`, enrolled with the founder, so one account tests both
 * sides of the loop.
 */
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

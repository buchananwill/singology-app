/** Reserved by RFC 2606, so it never resolves. */
export const PLACEHOLDER_EMAIL_DOMAIN = "singology.test";

/** The seed's users with addresses that never receive mail. */
export function placeholderEmail(fixtureId: string): string {
  return `${fixtureId}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

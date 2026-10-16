import { href } from "react-router";

const PARAM = "error";
const LINK_FAILED = "link";

/** Where `/auth/confirm` sends a missing, used or expired link. */
export const SIGN_IN_LINK_FAILED_HREF = `${href("/sign-in")}?${PARAM}=${LINK_FAILED}`;

export function isSignInLinkFailed(url: URL): boolean {
  return url.searchParams.get(PARAM) === LINK_FAILED;
}

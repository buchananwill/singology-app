import type { ConfirmLink } from "@singology/shared";
import { href } from "react-router";

/** The path a magic link lands on; e2e and the sign-in-link script build it the same way. */
export function confirmHref(tokenHash: string): string {
  const link: ConfirmLink = { token_hash: tokenHash, type: "magiclink" };
  return `${href("/auth/confirm")}?${new URLSearchParams(link).toString()}`;
}

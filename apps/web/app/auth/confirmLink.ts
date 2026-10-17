import type { ConfirmLink } from "@singology/shared";
import { href } from "react-router";

export function confirmHref(tokenHash: string): string {
  const link: ConfirmLink = { token_hash: tokenHash, type: "magiclink" };
  return `${href("/auth/confirm")}?${new URLSearchParams(link).toString()}`;
}

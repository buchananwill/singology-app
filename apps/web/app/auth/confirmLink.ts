import { type ConfirmLink, MAGIC_LINK_TYPE } from "@singology/shared";
import { href } from "react-router";

export function confirmHref(tokenHash: string): string {
  const link: ConfirmLink = { token_hash: tokenHash, type: MAGIC_LINK_TYPE };
  return `${href("/auth/confirm")}?${new URLSearchParams(link).toString()}`;
}

export function confirmUrl(tokenHash: string, origin: string): URL {
  return new URL(confirmHref(tokenHash), origin);
}

// A link minted while testing locally opens on that dev server; any other foreign origin is refused.
const LOCAL_ORIGIN_PREFIX = "http://localhost:";

export function confirmLinkOrigin(siteUrl: string | undefined, appOrigin: string): string {
  const fallback = new URL(appOrigin).origin;
  if (siteUrl === undefined || !URL.canParse(siteUrl)) {
    return fallback;
  }
  const { origin } = new URL(siteUrl);
  return origin === fallback || origin.startsWith(LOCAL_ORIGIN_PREFIX) ? origin : fallback;
}

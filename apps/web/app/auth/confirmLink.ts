import type { ConfirmLink } from "@singology/shared";
import { href } from "react-router";

export function confirmHref(tokenHash: string): string {
  const link: ConfirmLink = { token_hash: tokenHash, type: "magiclink" };
  return `${href("/auth/confirm")}?${new URLSearchParams(link).toString()}`;
}

const LOCAL_ORIGIN_PREFIX = "http://localhost:";

/** The origin a sign-in link opens on: the one Supabase names when it is the app's own or local, else the app's. */
export function confirmLinkOrigin(siteUrl: string | undefined, appOrigin: string): string {
  const fallback = new URL(appOrigin).origin;
  if (siteUrl === undefined || !URL.canParse(siteUrl)) {
    return fallback;
  }
  const { origin } = new URL(siteUrl);
  return origin === fallback || origin.startsWith(LOCAL_ORIGIN_PREFIX) ? origin : fallback;
}

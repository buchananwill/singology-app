import { type ConfirmLink, MAGIC_LINK_TYPE } from "@singology/shared";
import { href } from "react-router";

import { PREVIEW_PORT } from "../../previewPort";

export function confirmHref(tokenHash: string): string {
  const link: ConfirmLink = { token_hash: tokenHash, type: MAGIC_LINK_TYPE };
  return `${href("/auth/confirm")}?${new URLSearchParams(link).toString()}`;
}

export function confirmUrl(tokenHash: string, origin: string): URL {
  return new URL(confirmHref(tokenHash), origin);
}

// Only our own dev servers are trusted, so a Supabase default or a foreign localhost cannot capture the link.
const LOCAL_DEV_ORIGINS: readonly string[] = [
  "http://localhost:5173",
  `http://localhost:${PREVIEW_PORT}`,
];

export function confirmLinkOrigin(siteUrl: string | undefined, appOrigin: string): string {
  const fallback = new URL(appOrigin).origin;
  if (siteUrl === undefined || !URL.canParse(siteUrl)) {
    return fallback;
  }
  const { origin } = new URL(siteUrl);
  return origin === fallback || LOCAL_DEV_ORIGINS.includes(origin) ? origin : fallback;
}

import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, type Page } from "@playwright/test";
import { ALPHA_EMAILS, type AlphaTester, magicLinkTokenFor } from "@singology/db/admin";

import { settle } from "./helpers";

const HOME: Record<AlphaTester, RegExp> = { founder: /\/coach$/, cto: /\/student$/ };

/** Where the setup project saves each tester's signed-in browser state. */
export function storageStateFor(who: AlphaTester): string {
  const e2eDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(e2eDir, "..", "test-results", "auth", `${who}.json`);
}

/**
 * Signs the browser in through the real `/auth/confirm` route, with a token from the admin API
 * instead of an email. A new token replaces the user's previous one, so specs that only need a
 * signed-in user reuse the setup project's saved state rather than calling this.
 */
export async function signInAs(page: Page, who: AlphaTester): Promise<void> {
  if (process.env.SINGOLOGY_ENV !== "test") {
    throw new Error("signInAs runs only against the test project (SINGOLOGY_ENV=test).");
  }
  const token = await magicLinkTokenFor(ALPHA_EMAILS[who]);
  const query = new URLSearchParams({ token_hash: token, type: "magiclink" });
  await page.goto(`/auth/confirm?${query.toString()}`);
  await expect(page).toHaveURL(HOME[who]);
  await settle(page);
}

import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, type Page } from "@playwright/test";
import { E2E_EMAILS, type E2eTester, magicLinkTokenFor } from "@singology/db/admin";

import { confirmHref } from "../app/auth/confirmLink";
import { settle } from "./helpers";

const HOME: Record<E2eTester, RegExp> = {
  founder: /\/coach$/,
  cto: /\/student$/,
  ben: /\/student$/,
};

export function storageStateFor(who: E2eTester): string {
  const e2eDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(e2eDir, "..", "test-results", "auth", `${who}.json`);
}

/**
 * A new token replaces the user's previous one, so specs that only need a signed-in user reuse
 * the setup project's saved state instead of calling this.
 */
export async function signInAs(page: Page, who: E2eTester): Promise<void> {
  await page.goto(confirmHref(await magicLinkTokenFor(E2E_EMAILS[who])));
  await expect(page).toHaveURL(HOME[who]);
  await settle(page);
}

import { expect, test } from "@playwright/test";

import { signInAs } from "./auth";
import { settle, trackErrors } from "./helpers";

test("a magic link signs the CTO in at the student home, and sign out ends the session", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await signInAs(page, "cto");
  await expect(page.getByTestId("signed-in-name")).toHaveText("Singology CTO");
  await expect(page.getByRole("heading", { level: 1, name: "This week" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
  await settle(page);
  await page.goto("/student");
  await expect(page).toHaveURL(/\/sign-in$/);
  expect(errors).toEqual([]);
});

test("a signed-in visitor to /sign-in goes home", async ({ page }) => {
  await signInAs(page, "founder");
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/coach$/);
});

test("a missing or used link returns to /sign-in with an error", async ({ page }) => {
  for (const path of ["/auth/confirm", "/auth/confirm?token_hash=not-a-token&type=magiclink"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in\?error=link$/);
    await expect(page.getByTestId("sign-in-link-failed")).toBeVisible();
  }
});

test("the sign-in form gives the same answer for any address", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/sign-in");
  await settle(page);
  // An unregistered address: with sign-up off, Supabase sends nothing.
  await page.getByLabel("Email").fill("nobody@singology.test");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByTestId("sign-in-sent")).toHaveText(
    "If that address is registered, a sign-in link is on its way.",
  );
  expect(errors).toEqual([]);
});

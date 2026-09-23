import { expect, type Page } from "@playwright/test";

/** Collects console errors and uncaught page errors for the whole test. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  return errors;
}

/** Picks a view on `/demo` the way a visitor does, which sets the role cookie. */
export async function chooseRole(page: Page, role: "student" | "coach"): Promise<void> {
  await page.goto("/demo");
  const label = role === "student" ? "View as a student" : "View as a coach (founder)";
  await page.getByRole("button", { name: label }).click();
  await expect(page).toHaveURL(role === "student" ? /\/student$/ : /\/coach$/);
}

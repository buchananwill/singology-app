import { expect, test } from "@playwright/test";

test("home renders the coach name from the fixture repositories with no console errors", async ({
  page,
}, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto("/");

  await expect(page.getByTestId("coach-name")).toHaveText(["Singology founder", "Standard coach"]);
  await expect(page.getByRole("banner")).toContainText("Singology");

  await page.screenshot({
    path: `test-results/screenshots/home-${testInfo.project.name}.png`,
    fullPage: true,
  });

  expect(consoleErrors).toEqual([]);
});

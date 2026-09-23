import { expect, type Locator, test } from "@playwright/test";

import { chooseRole, settle, trackErrors } from "./helpers";

/** Seeks the take's media element (what `handle.seek` does) and waits for the seek to land. */
async function seekTo(media: Locator, timeSec: number): Promise<void> {
  await media.evaluate(
    (el: HTMLMediaElement, t) =>
      new Promise<void>((resolve) => {
        el.addEventListener("seeked", () => resolve(), { once: true });
        el.currentTime = t;
      }),
    timeSec,
  );
  await expect.poll(() => media.evaluate((el: HTMLMediaElement) => el.currentTime)).toBeCloseTo(
    timeSec,
    1,
  );
}

test("the previous take of the same exercise opens with its own player", async ({ page }) => {
  const errors = trackErrors(page);
  await chooseRole(page, "coach");
  await page.goto("/coach/reviews/sub-ben-hiss");
  const previous = page.getByTestId("previous-take");
  // Collapsed: no second player until it is opened.
  await expect(page.getByTestId("waveform-player")).toHaveCount(1);
  await previous.getByRole("button", { name: /^Previous take: / }).click();
  await expect(previous.getByTestId("waveform")).toHaveAttribute("data-ready", "true", {
    timeout: 15_000,
  });
  await expect(previous.getByTestId("comment-marker")).toHaveCount(3);
  await expect(previous).toContainText("I'm gasping by the end.");

  await settle(page);
  await page.goto("/coach/reviews/sub-ada-onset");
  await expect(page.getByTestId("no-previous-take")).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("the coach review workspace", () => {
  // The whole flow in Chromium; WebKit gets the smoke test (pitfall 8 blocks its reply upload).
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");

  test("adds a comment at the player's current time", async ({ page }) => {
    const errors = trackErrors(page);
    await chooseRole(page, "coach");
    await page.goto("/coach/reviews/sub-ben-hiss");
    const take = page.getByTestId("review-take");
    await expect(take.getByTestId("waveform")).toHaveAttribute("data-ready", "true");
    const media = take.getByTestId("player-media");

    await seekTo(media, 30);
    await take.getByRole("button", { name: "Add comment at current time" }).click();
    const draft = take.getByTestId("comment-draft");
    await expect(take.getByText("Comment at 0:30")).toBeVisible();
    await draft.fill("The hiss wobbles here: keep the ribs wide.");
    await draft.press("Enter");

    const items = take.getByTestId("comment-item");
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText("0:30");
    await expect(items.first()).toContainText("The hiss wobbles here: keep the ribs wide.");
    await expect(take.getByTestId("comment-marker")).toHaveCount(1);

    // Clicking the comment seeks the player back to it.
    await seekTo(media, 5);
    await items.first().click();
    await expect.poll(() => media.evaluate((el: HTMLMediaElement) => el.currentTime)).toBeCloseTo(
      30,
      0,
    );
    expect(errors).toEqual([]);
  });
});

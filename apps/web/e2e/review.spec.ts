import { expect, type Locator, test } from "@playwright/test";

import { chooseRole, currentTime, mediaFixture, settle, trackErrors } from "./helpers";

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
  await expect.poll(() => currentTime(media)).toBeCloseTo(timeSec, 1);
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
  // The whole flow in Chromium; WebKit gets the smoke test (it cannot play the reply's blob URL).
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");

  test("adds a comment at the current time, attaches a reply, assigns and sends", async ({
    page,
  }) => {
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
    await expect.poll(() => currentTime(media)).toBeCloseTo(30, 0);

    // A reply through the shared upload panel.
    const upload = page.getByTestId("upload-panel");
    const input = upload.getByTestId("upload-input");
    await expect(input).toBeEnabled();
    await input.setInputFiles(mediaFixture("coach-reply.m4a"));
    await expect(upload.getByTestId("upload-file-duration")).toContainText("0:28");
    await upload.getByRole("button", { name: "Attach reply" }).click();
    await expect(upload.getByTestId("upload-success")).toContainText("coach-reply.m4a");

    // Assign one exercise, then send.
    await page.getByTestId("assign-checklist").getByLabel("Five-note runs").check();
    const send = page.getByTestId("send-feedback");
    await expect(send.getByTestId("send-summary")).toHaveText(
      "1 comment · reply attached · 1 exercise to assign",
    );
    await send.getByRole("button", { name: "Send feedback" }).click();
    await expect(send.getByTestId("send-success")).toContainText(
      "Ben Sample gets 1 comment, your reply, 1 new exercise.",
    );
    await expect(page.locator(".mantine-Notification-root").last()).toContainText("Feedback sent");
    expect(errors).toEqual([]);
  });

  test("won't send empty feedback", async ({ page }) => {
    const errors = trackErrors(page);
    await chooseRole(page, "coach");
    await page.goto("/coach/reviews/sub-ada-onset");
    const send = page.getByTestId("send-feedback");
    const button = send.getByRole("button", { name: "Send feedback" });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(send.getByRole("alert")).toHaveText(
      "Add a comment, a summary or a reply before sending.",
    );
    await expect(send.getByTestId("send-success")).toHaveCount(0);
    // The 400 response is expected; nothing else may log an error.
    expect(errors.filter((e) => !e.includes("400"))).toEqual([]);
  });
});

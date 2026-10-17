import { expect, type Locator, test } from "@playwright/test";
import { fixtureUuid } from "@singology/db";

import { storageStateFor } from "./auth";
import { currentTime, mediaFixture, readyWaveforms, settle, trackErrors } from "./helpers";

test.use({ storageState: storageStateFor("founder") });

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

  await page.goto(`/coach/reviews/${fixtureUuid("sub-ben-hiss")}`);
  const previous = page.getByTestId("previous-take");
  // Collapsed: no second player until it is opened.
  await expect(page.getByTestId("waveform-player")).toHaveCount(1);
  await previous.getByRole("button", { name: /^Previous take: / }).click();
  await expect(readyWaveforms(previous)).toHaveCount(1, { timeout: 15_000 });
  await expect(previous.getByTestId("comment-marker")).toHaveCount(3);
  await expect(previous).toContainText("I'm gasping by the end.");

  await settle(page);
  await page.goto(`/coach/reviews/${fixtureUuid("sub-ada-onset")}`);
  await expect(page.getByTestId("no-previous-take")).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("the coach review workspace", () => {
  // The whole flow in Chromium; WebKit gets the smoke test (it cannot play the reply's blob URL).
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");

  test("adds a comment at the current time, attaches a reply and assigns", async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto(`/coach/reviews/${fixtureUuid("sub-ben-hiss")}`);
    const take = page.getByTestId("review-take");
    await expect(readyWaveforms(take)).toHaveCount(1);
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
    await expect(upload.getByTestId("upload-success")).toContainText(
      "Reply attached for this review only. Replies start saving in the next alpha release.",
    );

    // Sending is the persisted loop below; this take stays in the queue for the other specs.
    await page.getByTestId("assign-checklist").getByLabel("Five-note runs").check();
    await expect(page.getByTestId("send-feedback").getByTestId("send-summary")).toHaveText(
      "1 comment · reply attached · 1 exercise to assign",
    );
    expect(errors).toEqual([]);
  });

  test("won't send empty feedback", async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto(`/coach/reviews/${fixtureUuid("sub-ada-onset")}`);
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

  test(
    "a sent review persists, opens read-only and reaches the student",
    { tag: "@writes" },
    async ({ page, browser }) => {
      const errors = trackErrors(page);
      const submissionId = fixtureUuid("sub-ada-onset");
      const reviewPath = `/coach/reviews/${submissionId}`;
      const summary = "Cleaner onsets already. Keep the jaw loose on the 'ah'.";

      await page.goto("/coach");
      await expect(page.getByTestId("queue-item")).toHaveCount(2);
      await settle(page);

      await page.goto(reviewPath);
      await expect(page.getByTestId("no-previous-take")).toBeVisible();
      const take = page.getByTestId("review-take");
      await expect(readyWaveforms(take)).toHaveCount(1);
      const media = take.getByTestId("player-media");
      for (const [tSeconds, body] of [
        [5, "The jaw drops before the note: let it hang."],
        [12, "That one was clean. Same again."],
      ] as const) {
        await seekTo(media, tSeconds);
        await take.getByRole("button", { name: "Add comment at current time" }).click();
        const draft = take.getByTestId("comment-draft");
        await draft.fill(body);
        await draft.press("Enter");
      }
      await expect(take.getByTestId("comment-item")).toHaveCount(2);
      await page.getByTestId("assign-checklist").getByLabel("Hum into a vowel").check();
      const send = page.getByTestId("send-feedback");
      await send.getByLabel(/^Summary for /).fill(summary);
      await send.getByRole("button", { name: "Send feedback" }).click();
      await expect(send.getByTestId("send-success")).toContainText(
        "Feedback sent to Singology: 2 comments, 1 new exercise.",
      );
      // The sent review is immutable, so nothing on the page stays editable.
      await expect(take.getByRole("button", { name: "Add comment at current time" })).toHaveCount(
        0,
      );
      await expect(
        page.getByTestId("assign-checklist").getByRole("checkbox").first(),
      ).toBeDisabled();

      await settle(page);
      await send.getByRole("link", { name: "Back to the queue" }).click();
      await expect(page.getByTestId("queue-item")).toHaveCount(1);
      await expect(page.getByTestId("queue-student")).toHaveText(["Ben Sample"]);

      await settle(page);
      await page.goto(reviewPath);
      const reviewed = page.getByTestId("reviewed-view");
      await expect(readyWaveforms(reviewed)).toHaveCount(1);
      await expect(reviewed.getByTestId("comment-marker")).toHaveCount(2);
      await expect(reviewed.getByTestId("comment-item")).toHaveCount(2);
      await expect(reviewed.getByTestId("sent-summary")).toHaveText(summary);
      await expect(page.getByTestId("send-feedback")).toHaveCount(0);
      await expect(page.getByTestId("assign-checklist")).toHaveCount(0);

      const again = await page.request.post(reviewPath, {
        data: {
          intent: "send",
          summary: "Once more.",
          comments: [],
          reply: null,
          assignLibraryItemIds: [],
        },
      });
      expect(again.status()).toBe(409);
      expect(errors).toEqual([]);

      const ctoContext = await browser.newContext({ storageState: storageStateFor("cto") });
      const cto = await ctoContext.newPage();
      const ctoErrors = trackErrors(cto);
      await cto.goto(`/student/submissions/${submissionId}`);
      await expect(cto.getByRole("heading", { level: 1, name: "Your feedback" })).toBeVisible();
      await expect(cto.getByText(summary)).toBeVisible();
      const feedbackTake = cto.getByTestId("feedback-take");
      await expect(readyWaveforms(feedbackTake)).toHaveCount(1);
      await expect(feedbackTake.getByTestId("comment-marker")).toHaveCount(2);
      await expect(cto.getByRole("region", { name: "Next exercises" })).toContainText(
        "Hum into a vowel",
      );

      await settle(cto);
      await cto.goto("/student");
      await expect(cto.getByTestId("assignment").first()).toContainText("Hum into a vowel");
      const latest = cto.getByTestId("latest-feedback");
      await expect(latest).toContainText("Balanced onsets on 'ah'");
      await expect(latest).toContainText("2 timestamped comments");
      expect(ctoErrors).toEqual([]);
      await ctoContext.close();
    },
  );
});

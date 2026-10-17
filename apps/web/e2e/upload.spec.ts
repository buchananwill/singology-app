import { expect, test } from "@playwright/test";
import { fixtureUuid } from "@singology/db";

import { storageStateFor } from "./auth";
import { mediaFixture, trackErrors } from "./helpers";

test.use({ storageState: storageStateFor("cto") });

test("uploading a take shows its details, then the success state", async ({
  page,
  browserName,
}) => {
  const errors = trackErrors(page);

  await page.goto(`/student/exercises/${fixtureUuid("lib-agility-five-note")}`);

  const panel = page.getByTestId("upload-panel");
  const input = panel.getByTestId("upload-input");
  // The input is enabled once React has hydrated.
  await expect(input).toBeEnabled();
  await expect(input).not.toHaveAttribute("capture");
  await expect(input).toHaveAttribute("accept", "audio/*,video/*");
  await input.setInputFiles(mediaFixture("student-take-a.m4a"));

  await expect(panel.getByTestId("upload-file-name")).toContainText("student-take-a.m4a");
  await expect(panel.getByTestId("upload-file-size")).toContainText("596.9 KB");

  if (browserName === "webkit") {
    // Playwright's WebKit on Windows cannot play any media from a `blob:` URL
    // (MEDIA_ERR_SRC_NOT_SUPPORTED), so `loadedmetadata` never fires and the duration is
    // unknown. The panel says so and keeps Submit disabled. Real Safari needs a device check.
    await expect(panel.getByTestId("upload-file-duration")).toContainText("unknown");
    await expect(panel.getByRole("alert")).toContainText("can't be played in the browser");
    await expect(panel.getByRole("button", { name: "Send to your coach" })).toBeDisabled();
    expect(errors).toEqual([]);
    return;
  }

  // 76.6 s, from the preview element's loadedmetadata.
  await expect(panel.getByTestId("upload-file-duration")).toContainText("1:17");

  await panel.getByLabel("Note for your coach (optional)").fill("Faster this time.");
  await panel.getByRole("button", { name: "Send to your coach" }).click();
  await expect(panel.getByTestId("upload-progress")).toBeVisible();

  await expect(panel.getByTestId("upload-success")).toContainText(
    "Your recording passed the checks. Uploads start saving in the next alpha release.",
  );
  await expect(page.locator(".mantine-Notification-root")).toContainText("Recording checked");

  expect(errors).toEqual([]);
});

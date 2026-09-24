import { expect, test } from "@playwright/test";
import { HLS_MIME_TYPE } from "@singology/shared";

import { currentTime, readyWaveforms, trackErrors } from "./helpers";

test.describe("/lab/player", () => {
  test("waveform, rate buttons and HLS video work with no console errors", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/lab/player");

    const audio = page.getByTestId("lab-audio");
    const audioWaveform = audio.getByTestId("waveform");
    await expect(readyWaveforms(audio)).toHaveCount(1);
    // wavesurfer draws into canvases inside its (open) shadow root; Playwright's CSS engine pierces it.
    await expect(audioWaveform.locator("canvas").first()).toBeVisible();
    await expect(audio.getByTestId("comment-marker")).toHaveCount(3);

    // Rate 0.75x sets the playback rate and keeps the pitch.
    await audio.getByText("0.75x", { exact: true }).click();
    const audioMedia = audio.getByTestId("player-media");
    await expect
      .poll(() =>
        audioMedia.evaluate((el: HTMLMediaElement) => ({
          playbackRate: el.playbackRate,
          preservesPitch: el.preservesPitch,
        })),
      )
      .toEqual({ playbackRate: 0.75, preservesPitch: true });

    // The HLS video takes an HLS path whenever the browser offers one (native HLS or Media Source
    // Extensions for hls.js), else the progressive MP4, and loads its metadata either way.
    const canUseHls = await page.evaluate(
      (hlsMimeType) =>
        document.createElement("video").canPlayType(hlsMimeType) !== "" ||
        "MediaSource" in window ||
        "ManagedMediaSource" in window,
      HLS_MIME_TYPE,
    );
    const video = page.getByTestId("lab-hls").getByTestId("player-media");
    await expect(video).toHaveAttribute(
      "data-source-mode",
      canUseHls ? /^(native-hls|hls\.js)$/ : "progressive",
    );
    await expect
      .poll(() => video.evaluate((el: HTMLMediaElement) => el.readyState), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1);

    // Both side-by-side players draw their waveforms.
    await expect(readyWaveforms(page.getByTestId("lab-side-by-side"))).toHaveCount(2);

    expect(errors).toEqual([]);
  });

  test("clicking a comment marker seeks to the comment", async ({ page, browserName, baseURL }) => {
    const errors = trackErrors(page);
    if (browserName === "chromium") {
      // On localhost Chromium can buffer a whole fixture before the click, and then the seek
      // succeeds with or without Range support. Throttling only the audio files (not the app's
      // scripts) keeps the comment's time unbuffered, so the seek has to fetch a byte range.
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditionsByRule", {
        matchedNetworkConditions: [
          {
            urlPattern: `${baseURL ?? ""}/media/*.m4a`,
            latency: 0,
            downloadThroughput: 64 * 1024,
            uploadThroughput: -1,
          },
        ],
      });
    }
    // Record every seek the page asks for, so a failure shows whether the click asked for the
    // right time or the browser failed to reach it.
    await page.addInitScript(() => {
      const native = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "currentTime");
      if (!native?.get || !native.set) {
        return;
      }
      const { get, set } = native;
      Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
        configurable: true,
        get(this: HTMLMediaElement) {
          return get.call(this) as number;
        },
        set(this: HTMLMediaElement, value: number) {
          this.dataset.requestedTime = String(value);
          set.call(this, value);
        },
      });
    });
    await page.goto("/lab/player");

    const audio = page.getByTestId("lab-audio");
    await expect(readyWaveforms(audio)).toHaveCount(1);
    const markers = audio.getByTestId("comment-marker");
    await expect(markers).toHaveCount(3);
    const audioMedia = audio.getByTestId("player-media");
    await expect
      .poll(() => audioMedia.evaluate((el: HTMLMediaElement) => el.readyState))
      .toBeGreaterThanOrEqual(1);

    // The seek must land in media that is not yet buffered, which only
    // works when `/media/*` answers HTTP Range with 206. With the throttle above, Chromium has only
    // the start of the file, so the comment's time must still be outside every buffered range.
    if (browserName === "chromium") {
      const commentTimeBuffered = await audioMedia.evaluate((el: HTMLMediaElement) => {
        for (let i = 0; i < el.buffered.length; i += 1) {
          if (el.buffered.start(i) <= 24 && el.buffered.end(i) >= 24) {
            return true;
          }
        }
        return false;
      });
      expect(commentTimeBuffered, "the comment's time is already buffered").toBe(false);
    }

    // Wait for the first `seeked` after the click (NaN if none within 10 s), then read where the
    // media actually is.
    const seekedAt = audioMedia.evaluate(
      (el: HTMLMediaElement) =>
        new Promise<number>((resolve) => {
          el.addEventListener("seeked", () => resolve(el.currentTime), { once: true });
          setTimeout(() => resolve(Number.NaN), 10_000);
        }),
    );
    await markers.nth(1).click();
    await expect(audioMedia).toHaveAttribute("data-requested-time", "24");
    expect(await seekedAt).toBeCloseTo(24, 0);
    // The position holds after the seek instead of snapping back to 0.
    expect(await currentTime(audioMedia)).toBeCloseTo(24, 0);
    expect(errors).toEqual([]);
  });

  test("the hls.js fallback plays the HLS video when native HLS is unavailable", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Media Source Extensions path is checked in Chromium");
    const errors = trackErrors(page);
    // Pretend the browser has no native HLS so the player must take the hls.js path.
    await page.addInitScript(() => {
      const original = HTMLMediaElement.prototype.canPlayType;
      HTMLMediaElement.prototype.canPlayType = function canPlayType(type: string) {
        return type.includes("mpegurl") ? "" : original.call(this, type);
      };
    });
    await page.goto("/lab/player");

    const video = page.getByTestId("lab-hls").getByTestId("player-media");
    await expect(video).toHaveAttribute("data-source-mode", "hls.js");
    await expect
      .poll(() => video.evaluate((el: HTMLMediaElement) => el.readyState), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1);

    expect(errors).toEqual([]);
  });
});

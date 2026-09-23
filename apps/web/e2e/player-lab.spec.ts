import { expect, type Page, test } from "@playwright/test";

/** Collects console errors and uncaught page errors for the whole test. */
function trackErrors(page: Page): string[] {
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

test.describe("/lab/player", () => {
  test("waveform, rate buttons and HLS video work with no console errors", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/lab/player");

    const audio = page.getByTestId("lab-audio");
    const audioWaveform = audio.getByTestId("waveform");
    await expect(audioWaveform).toHaveAttribute("data-ready", "true");
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
      () =>
        document.createElement("video").canPlayType("application/vnd.apple.mpegurl") !== "" ||
        "MediaSource" in window ||
        "ManagedMediaSource" in window,
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
    await expect(
      page.getByTestId("lab-side-by-side").locator('[data-testid="waveform"][data-ready="true"]'),
    ).toHaveCount(2);

    expect(errors).toEqual([]);
  });

  test("clicking a comment marker seeks to the comment", async ({ page, browserName }) => {
    const errors = trackErrors(page);
    // Record every seek the page asks for, so the click-to-seek wiring is checked even where the
    // browser cannot complete the seek (see the Chromium note below).
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
    await expect(audio.getByTestId("waveform")).toHaveAttribute("data-ready", "true");
    const markers = audio.getByTestId("comment-marker");
    await expect(markers).toHaveCount(3);
    await markers.nth(1).click();

    const audioMedia = audio.getByTestId("player-media");
    await expect(audioMedia).toHaveAttribute("data-requested-time", "24");

    // Pitfall 6: Workers static assets (and so `pnpm preview`) ignore HTTP Range requests. Chromium
    // then cannot seek into media it has not fully buffered, and the position falls back to 0
    // depending on download timing. The completed seek is asserted only in WebKit until the
    // media is served with Range support.
    if (browserName !== "chromium") {
      await expect
        .poll(() => audioMedia.evaluate((el: HTMLMediaElement) => el.currentTime))
        .toBeCloseTo(24, 0);
    }
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

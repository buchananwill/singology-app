import { expect, type Page, test } from "@playwright/test";

import { chooseRole, settle, trackErrors } from "./helpers";

/** Screenshot widths (spec decision 25): desktop and a small phone. */
const WIDTHS = [1280, 375] as const;

interface RouteCase {
  name: string;
  path: string;
  role: "student" | "coach" | null;
  heading: string | RegExp;
  /** Number of waveform players that must finish drawing before the screenshot. */
  waveforms: number;
}

const ROUTES: readonly RouteCase[] = [
  { name: "landing", path: "/", role: null, heading: /singing feedback/i, waveforms: 0 },
  { name: "demo", path: "/demo", role: null, heading: "Try the demo", waveforms: 0 },
  { name: "student", path: "/student", role: "student", heading: "This week", waveforms: 0 },
  {
    name: "student-exercise",
    path: "/student/exercises/lib-range-siren",
    role: "student",
    heading: "Siren slides",
    waveforms: 2,
  },
  {
    name: "student-submission",
    path: "/student/submissions/sub-ada-siren-2",
    role: "student",
    heading: "Your feedback",
    waveforms: 2,
  },
  {
    name: "student-progress",
    path: "/student/progress",
    role: "student",
    heading: "Progress",
    waveforms: 2,
  },
  { name: "library", path: "/library", role: "student", heading: "Exercise library", waveforms: 0 },
  { name: "coach", path: "/coach", role: "coach", heading: "Review queue", waveforms: 0 },
  {
    name: "coach-review-audio",
    path: "/coach/reviews/sub-ben-hiss",
    role: "coach",
    heading: "Review: Ben Sample",
    waveforms: 1,
  },
  {
    name: "coach-review-video",
    path: "/coach/reviews/sub-ada-onset",
    role: "coach",
    heading: "Review: Ada Example",
    waveforms: 1,
  },
  {
    name: "coach-library",
    path: "/library",
    role: "coach",
    heading: "Exercise library",
    waveforms: 0,
  },
];

async function expectWaveformsReady(page: Page, count: number): Promise<void> {
  if (count > 0) {
    await expect(page.locator('[data-testid="waveform"][data-ready="true"]')).toHaveCount(count, {
      timeout: 15_000,
    });
  }
}

for (const route of ROUTES) {
  test(`${route.name} renders at ${WIDTHS.join(" and ")}px with no console errors`, async ({
    page,
  }, testInfo) => {
    const errors = trackErrors(page);
    if (route.role !== null) {
      await chooseRole(page, route.role);
    }
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(page.getByRole("banner")).toContainText("Singology");
      if (route.path === "/") {
        await expect(page.getByTestId("demo-banner")).toHaveCount(0);
      } else {
        await expect(page.getByTestId("demo-banner")).toHaveText(
          "Demo with sample data. Nothing you do here is saved.",
        );
      }
      await expectWaveformsReady(page, route.waveforms);
      // Nothing may overflow the viewport sideways at phone width (decision 18).
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await page.screenshot({
        path: `test-results/screenshots/${route.name}-${testInfo.project.name}-${width}.png`,
        fullPage: true,
      });
      await settle(page);
    }
    expect(errors).toEqual([]);
  });
}

test("the landing page shows both coaches and the illustrative pricing", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await expect(page.getByTestId("coach-name")).toHaveText(["Singology founder", "Standard coach"]);
  await expect(page.getByText("Feedback within 3 days of your upload.")).toHaveCount(2);
  const pricing = page.getByTestId("pricing-table");
  await expect(pricing).toContainText("Illustrative pricing");
  await expect(pricing.getByRole("row", { name: /Singology founder/ })).toContainText(
    "£80 a month for 4 reviews",
  );
  await expect(pricing.getByRole("row", { name: /Singology founder/ })).toContainText("£25");
  await expect(pricing.getByRole("row", { name: /Standard coach/ })).toContainText(
    "£45 a month for 4 reviews",
  );
  await expect(pricing.getByRole("row", { name: /Standard coach/ })).toContainText("£12");
  await page.getByRole("link", { name: "Try the demo" }).first().click();
  await expect(page).toHaveURL(/\/demo$/);
  expect(errors).toEqual([]);
});

test("role-scoped routes redirect to /demo until a role is picked", async ({ page }) => {
  for (const path of ["/student", "/student/progress", "/library", "/coach"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/demo$/);
  }
  await chooseRole(page, "student");
  await expect(page.getByTestId("current-role")).toHaveText("Student view");
  await expect(
    page.getByText("Singology founder replies within 3 days of your upload."),
  ).toBeVisible();
  await page.goto("/coach");
  await expect(page).toHaveURL(/\/demo$/);
  await chooseRole(page, "coach");
  await expect(page.getByTestId("current-role")).toHaveText("Coach view");
  await expect(page.getByRole("heading", { level: 1, name: "Review queue" })).toBeVisible();
});

test("the coach nav has Queue and Library, and Queue stays current in a review", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await chooseRole(page, "coach");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link")).toHaveText(["Queue", "Library"]);
  await expect(nav.getByRole("link", { name: "Queue" })).toHaveAttribute("aria-current", "page");
  await page.getByTestId("queue-item").first().getByRole("link", { name: "Review" }).click();
  await expect(page).toHaveURL(/\/coach\/reviews\/sub-ben-hiss$/);
  await expect(nav.getByRole("link", { name: "Queue" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Library" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Exercise library" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Library" })).toHaveAttribute("aria-current", "page");
  await settle(page);
  expect(errors).toEqual([]);
});

test("the review queue is oldest first, with no item overdue", async ({ page }) => {
  const errors = trackErrors(page);
  await chooseRole(page, "coach");
  await expect(page.getByText("You promise feedback within 3 days of each upload.")).toBeVisible();
  const items = page.getByTestId("queue-item");
  await expect(items).toHaveCount(2);
  await expect(items.getByTestId("queue-student")).toHaveText(["Ben Sample", "Ada Example"]);
  // Fixture times are offsets from the request time (journal decision 32): never overdue.
  for (const item of await items.all()) {
    await expect(item).not.toHaveAttribute("data-sla", "overdue");
    await expect(item).not.toContainText(/overdue/i);
  }
  await expect(items.first()).toHaveAttribute("data-sla", "due_soon");
  await expect(items.first().getByTestId("queue-submitted")).toHaveText("Submitted 62 hours ago");
  await expect(items.first().getByTestId("queue-sla")).toHaveText(
    /^Due soon: (9h 5\dm|10h 00m) left$/,
  );
  await expect(items.nth(1)).toHaveAttribute("data-sla", "on_track");
  expect(errors).toEqual([]);
});

test("library filters live in the URL", async ({ page }) => {
  const errors = trackErrors(page);
  await chooseRole(page, "student");
  await page.goto("/library");
  await expect(page.getByTestId("library-item")).toHaveCount(8);

  await page.getByRole("group", { name: "Category" }).getByRole("link", { name: "Range" }).click();
  await expect(page).toHaveURL(/\/library\?category=range$/);
  await expect(page.getByTestId("library-item")).toHaveCount(2);

  await page
    .getByRole("group", { name: "Voice type" })
    .getByRole("link", { name: "Soprano" })
    .click();
  await expect(page).toHaveURL(/\/library\?category=range&voice=soprano$/);
  await expect(page.getByTestId("library-item")).toHaveCount(1);

  // The filter survives a reload because it is only in the URL.
  await page.reload();
  await expect(page.getByTestId("library-item")).toHaveCount(1);
  await expect(page.getByTestId("library-item")).toContainText("Siren slides");
  expect(errors).toEqual([]);
});

test("feedback comments are pinned on the take and a comment seeks there", async ({ page }) => {
  const errors = trackErrors(page);
  await chooseRole(page, "student");
  await page.goto("/student/submissions/sub-ada-siren-2");
  const take = page.getByTestId("feedback-take");
  await expect(take.getByTestId("waveform")).toHaveAttribute("data-ready", "true");
  await expect(take.getByTestId("comment-marker")).toHaveCount(5);
  await expect(take.getByTestId("comment-item")).toHaveCount(5);

  const media = take.getByTestId("player-media");
  await take.getByTestId("comment-item").nth(2).click();
  await expect
    .poll(() => media.evaluate((el: HTMLMediaElement) => el.currentTime))
    .toBeCloseTo(45.5, 0);
  expect(errors).toEqual([]);
});

test("the A/B compare plays one take and switches at the same position", async ({ page }) => {
  const errors = trackErrors(page);
  await chooseRole(page, "student");
  await page.goto("/student/progress");
  const compare = page.getByTestId("ab-compare");
  await expect(compare.locator('[data-testid="waveform"][data-ready="true"]')).toHaveCount(2);
  const mediaA = compare.getByTestId("ab-take-a").getByTestId("player-media");
  const mediaB = compare.getByTestId("ab-take-b").getByTestId("player-media");
  const paused = (el: HTMLMediaElement) => el.paused;

  await compare.getByTestId("ab-play").click();
  await expect.poll(() => mediaA.evaluate(paused)).toBe(false);
  await expect(compare.getByTestId("ab-play")).toHaveText("Pause");
  await expect
    .poll(() => mediaA.evaluate((el: HTMLMediaElement) => el.currentTime))
    .toBeGreaterThan(1);

  await compare.getByText(/^B: /).click();
  await expect.poll(() => mediaB.evaluate(paused)).toBe(false);
  expect(await mediaA.evaluate(paused)).toBe(true);
  const positionA = await mediaA.evaluate((el: HTMLMediaElement) => el.currentTime);
  const positionB = await mediaB.evaluate((el: HTMLMediaElement) => el.currentTime);
  expect(Math.abs(positionB - positionA)).toBeLessThan(1.5);
  await expect(compare.getByTestId("ab-take-b")).toHaveAttribute("data-active", "true");

  await compare.getByTestId("ab-play").click();
  await expect.poll(() => mediaB.evaluate(paused)).toBe(true);
  await expect(compare.getByTestId("ab-play")).toHaveText("Play");
  expect(errors).toEqual([]);
});

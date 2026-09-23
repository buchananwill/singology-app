import { expect, type Page, type Request } from "@playwright/test";

/** In-flight `/__manifest` requests per page (see `settle`). */
const manifestRequests = new WeakMap<Page, Set<Request>>();

function watchManifestRequests(page: Page): Set<Request> {
  const existing = manifestRequests.get(page);
  if (existing) {
    return existing;
  }
  const pending = new Set<Request>();
  const isManifest = (request: Request) => new URL(request.url()).pathname === "/__manifest";
  page.on("request", (request) => {
    if (isManifest(request)) {
      pending.add(request);
    }
  });
  page.on("requestfinished", (request) => pending.delete(request));
  page.on("requestfailed", (request) => pending.delete(request));
  // A document navigation cancels the old document's fetches, which do not always report
  // `requestfailed`.
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      pending.clear();
    }
  });
  manifestRequests.set(page, pending);
  return pending;
}

/** Collects console errors and uncaught page errors for the whole test. */
export function trackErrors(page: Page): string[] {
  watchManifestRequests(page);
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

/**
 * Lets React Router's lazy route discovery finish before the test leaves a page with
 * `page.goto`. Discovery fetches `/__manifest` 100 ms (debounced) after links render, and
 * WebKit logs a console error when a document navigation aborts that fetch (pitfall 10).
 */
export async function settle(page: Page): Promise<void> {
  const pending = watchManifestRequests(page);
  // Longer than discovery's 100 ms debounce, so a pending fetch has started.
  await page.waitForTimeout(250);
  await expect.poll(() => pending.size).toBe(0);
}

/** Picks a view on `/demo` the way a visitor does, which sets the role cookie. */
export async function chooseRole(page: Page, role: "student" | "coach"): Promise<void> {
  watchManifestRequests(page);
  await page.goto("/demo");
  // Let hydration finish first: a submit clicked mid-hydration was occasionally lost in WebKit.
  await settle(page);
  const label = role === "student" ? "View as a student" : "View as a coach (founder)";
  await page.getByRole("button", { name: label }).click();
  await expect(page).toHaveURL(role === "student" ? /\/student$/ : /\/coach$/);
  await settle(page);
}

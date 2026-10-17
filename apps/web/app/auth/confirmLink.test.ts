import { describe, expect, it } from "vitest";

import { confirmLinkOrigin, confirmUrl } from "./confirmLink";

const APP_ORIGIN = "https://singology.example";

describe("confirmUrl", () => {
  it("puts the confirm path and a magic-link token on the given origin", () => {
    expect(confirmUrl("hash-1", APP_ORIGIN).href).toBe(
      `${APP_ORIGIN}/auth/confirm?token_hash=hash-1&type=magiclink`,
    );
  });
});

describe("confirmLinkOrigin", () => {
  it("keeps the app's own origin and any local one, dropping a path", () => {
    expect(confirmLinkOrigin("https://singology.example/welcome", APP_ORIGIN)).toBe(APP_ORIGIN);
    expect(confirmLinkOrigin("http://localhost:5173", APP_ORIGIN)).toBe("http://localhost:5173");
    expect(confirmLinkOrigin("http://localhost:4173/", APP_ORIGIN)).toBe("http://localhost:4173");
  });

  it("falls back to the app's origin for anything else", () => {
    for (const siteUrl of [
      undefined,
      "",
      "not a url",
      "https://elsewhere.example",
      "https://localhost:5173",
      "http://localhost.elsewhere.example:5173",
      "http://localhost:5173@elsewhere.example",
      "http://127.0.0.1:5173",
    ]) {
      expect(confirmLinkOrigin(siteUrl, APP_ORIGIN)).toBe(APP_ORIGIN);
    }
  });
});

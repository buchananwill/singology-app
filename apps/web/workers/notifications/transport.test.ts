import { afterEach, describe, expect, it, vi } from "vitest";

import { transportFor } from "./transport";

const message = {
  to: "ada@example.com",
  subject: "A quick take this week?",
  text: "Hi Ada",
  html: "<p>Hi Ada</p>",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("transportFor", () => {
  it("chooses the dry-run transport when the key is absent or empty", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const env of [{ EMAIL_FROM: "x" }, { EMAIL_FROM: "x", RESEND_API_KEY: "" }]) {
      expect(await transportFor(env).send(message, "n-1")).toEqual({ id: "dry-run:n-1" });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to Resend with the key, the sender and the notification id as idempotency key", async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(Response.json({ id: "re_123" })));
    vi.stubGlobal("fetch", fetchSpy);
    const transport = transportFor({ EMAIL_FROM: "Singology <hi@x.example>", RESEND_API_KEY: "k" });
    expect(await transport.send(message, "n-1")).toEqual({ id: "re_123" });
    expect(fetchSpy).toHaveBeenCalledWith("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer k",
        "Content-Type": "application/json",
        "Idempotency-Key": "n-1",
      },
      body: JSON.stringify({ from: "Singology <hi@x.example>", ...message }),
    });
  });

  it("fails the send on a non-2xx response", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("nope", { status: 422 })));
    const transport = transportFor({ EMAIL_FROM: "x", RESEND_API_KEY: "k" });
    await expect(transport.send(message, "n-1")).rejects.toThrow(/422/);
  });

  it("fails the send on a 200 whose body has no id", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(Response.json({ ok: true })));
    const transport = transportFor({ EMAIL_FROM: "x", RESEND_API_KEY: "k" });
    await expect(transport.send(message, "n-1")).rejects.toThrow();
  });
});

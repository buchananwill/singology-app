import type { EmailMessage, SendEmailHook } from "@singology/shared";
import { RouterContextProvider } from "react-router";
import { Webhook } from "standardwebhooks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { routeArgs } from "../../test/routeArgs";
import type * as Transport from "../../workers/notifications/transport";
import type { Route } from "./+types/api.auth.send-email";
import { action, loader, type SendEmailHookEnv } from "./api.auth.send-email";

const BASE64_KEY = btoa("a test secret of thirty-two bytes");
const APP_ORIGIN = "https://singology.example";
const URL_PATH = "http://localhost:5173/api/auth/send-email";

const hookEnv = vi.hoisted((): SendEmailHookEnv => ({ APP_ORIGIN: "", EMAIL_FROM: "" }));
const sent = vi.hoisted((): Array<{ message: EmailMessage; idempotencyKey: string }> => []);

vi.mock("cloudflare:workers", () => ({ env: hookEnv }));

vi.mock("../../workers/notifications/transport", async (importOriginal) => {
  const real = await importOriginal<typeof Transport>();
  return {
    ...real,
    transportFor: (config: Transport.TransportConfig) => {
      const transport = real.transportFor(config);
      return {
        send(message: EmailMessage, idempotencyKey: string) {
          sent.push({ message, idempotencyKey });
          return transport.send(message, idempotencyKey);
        },
      };
    },
  };
});

function hookBody(overrides: Partial<SendEmailHook["email_data"]> = {}): string {
  return JSON.stringify({
    user: { id: "user-1", email: "ada@example.com" },
    email_data: {
      token: "123456",
      token_hash: "hash-1",
      redirect_to: "http://localhost:5173/auth/confirm",
      email_action_type: "magiclink",
      site_url: "http://localhost:5173",
      token_new: "",
      token_hash_new: "",
      ...overrides,
    },
  });
}

function signedRequest(body: string, key = BASE64_KEY): Request {
  const messageId = "msg_1";
  const timestamp = new Date();
  const signature = new Webhook(key).sign(messageId, timestamp, body);
  return new Request(URL_PATH, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": messageId,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": signature,
    },
    body,
  });
}

function actionArgs(request: Request): Route.ActionArgs {
  return routeArgs(new RouterContextProvider(), request, "/api/auth/send-email", {});
}

beforeEach(() => {
  Object.assign(hookEnv, {
    APP_ORIGIN,
    EMAIL_FROM: "Singology <hello@singology.example>",
    RESEND_API_KEY: undefined,
    SEND_EMAIL_HOOK_SECRET: `v1,whsec_${BASE64_KEY}`,
  });
  sent.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("the send-email hook", () => {
  it("emails a verified magic link once, keyed by the webhook id, on the site's origin", async () => {
    const response = await action(actionArgs(signedRequest(hookBody())));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
    expect(sent).toHaveLength(1);
    const [{ message, idempotencyKey }] = sent as [(typeof sent)[number]];
    expect(idempotencyKey).toBe("msg_1");
    expect(message.to).toBe("ada@example.com");
    expect(message.subject).toBe("Your Singology sign-in link");
    expect(message.text).toContain(
      "http://localhost:5173/auth/confirm?token_hash=hash-1&type=magiclink",
    );
    expect(console.log).toHaveBeenCalledWith(
      "dry-run email to ada@example.com: Your Singology sign-in link",
    );
  });

  it("links the app's origin when Supabase names a foreign site", async () => {
    await action(actionArgs(signedRequest(hookBody({ site_url: "https://elsewhere.example" }))));
    expect(sent[0]?.message.text).toContain(`${APP_ORIGIN}/auth/confirm?token_hash=hash-1`);
  });

  it("refuses a request signed with another secret, sending nothing", async () => {
    const otherKey = btoa("another secret of thirty-two byte");
    const response = await action(actionArgs(signedRequest(hookBody(), otherKey)));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { http_code: 401, message: expect.any(String) },
    });
    expect(sent).toHaveLength(0);
  });

  it("answers other email types with an empty success and sends nothing", async () => {
    const response = await action(
      actionArgs(signedRequest(hookBody({ email_action_type: "recovery" }))),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
    expect(sent).toHaveLength(0);
    expect(console.log).toHaveBeenCalledWith("send-email hook: ignored recovery");
  });

  it("answers 503 and sends nothing while the secret is unset", async () => {
    hookEnv.SEND_EMAIL_HOOK_SECRET = undefined;
    const response = await action(actionArgs(signedRequest(hookBody())));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: { http_code: 503, message: "send-email hook is not configured" },
    });
    expect(sent).toHaveLength(0);
  });

  it("answers 405 to any method but POST", async () => {
    const get = loader();
    expect(get.status).toBe(405);
    expect(get.headers.get("Allow")).toBe("POST");
    const put = await action(actionArgs(new Request(URL_PATH, { method: "PUT", body: "{}" })));
    expect(put.status).toBe(405);
    expect(sent).toHaveLength(0);
  });

  it("answers 500 with the provider's refusal when the send fails", async () => {
    hookEnv.RESEND_API_KEY = "re_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("domain not verified", { status: 403 }))),
    );
    const response = await action(actionArgs(signedRequest(hookBody())));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: {
        http_code: 500,
        message: "Resend refused the email: 403 domain not verified",
      },
    });
  });
});

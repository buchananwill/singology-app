import type { SendEmailHook } from "@singology/shared";
import { RouterContextProvider } from "react-router";
import { Webhook } from "standardwebhooks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { routeArgs } from "../../test/routeArgs";
import { magicLinkEmail } from "../../workers/email/templates";
import type * as Transport from "../../workers/email/transport";
import type { Route } from "./+types/api.auth.send-email";
import { action, loader, type SendEmailHookEnv } from "./api.auth.send-email";

type SentCall = Parameters<Transport.EmailTransport["send"]>;

const BASE64_KEY = btoa("a test secret of thirty-two bytes");
const APP_ORIGIN = "https://singology.example";
const HOOK_URL = "http://localhost:5173/api/auth/send-email";

const hookEnv = vi.hoisted((): SendEmailHookEnv => ({ APP_ORIGIN: "", EMAIL_FROM: "" }));
const sent = vi.hoisted((): SentCall[] => []);

vi.mock("cloudflare:workers", () => ({ env: hookEnv }));

vi.mock("../../workers/email/transport", async (importOriginal) => {
  const real = await importOriginal<typeof Transport>();
  return {
    ...real,
    transportFor: (config: Transport.TransportConfig): Transport.EmailTransport => {
      const transport = real.transportFor(config);
      return {
        send(...call) {
          sent.push(call);
          return transport.send(...call);
        },
      };
    },
  };
});

const base: SendEmailHook = {
  user: { email: "ada@example.com" },
  email_data: {
    token_hash: "hash-1",
    email_action_type: "magiclink",
    site_url: "http://localhost:5173",
  },
};

// Fields Supabase sends that the route ignores.
const supabaseExtras = {
  user: { id: "user-1" },
  email_data: {
    token: "123456",
    redirect_to: "http://localhost:5173/auth/confirm",
    token_new: "",
    token_hash_new: "",
  },
};

function hookBody(emailData: Partial<SendEmailHook["email_data"]> = {}): string {
  return JSON.stringify({
    user: { ...supabaseExtras.user, ...base.user },
    email_data: { ...supabaseExtras.email_data, ...base.email_data, ...emailData },
  });
}

function signedRequest(body: string, key = BASE64_KEY): Request {
  const messageId = "msg_1";
  const timestamp = new Date();
  return new Request(HOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": messageId,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": new Webhook(key).sign(messageId, timestamp, body),
    },
    body,
  });
}

// A thrown Response is what React Router would send, so the test receives it the same way.
function respond(request: Request): Promise<Response> {
  const args: Route.ActionArgs = routeArgs(
    new RouterContextProvider(),
    request,
    "/api/auth/send-email",
    {},
  );
  return action(args).catch((thrown: unknown) => {
    if (thrown instanceof Response) {
      return thrown;
    }
    throw thrown;
  });
}

beforeEach(() => {
  Object.assign(hookEnv, {
    APP_ORIGIN,
    EMAIL_FROM: "Singology <hello@singology.example>",
    RESEND_API_KEY: undefined,
    SEND_EMAIL_HOOK_SECRET: `v1,whsec_${BASE64_KEY}`,
  } satisfies SendEmailHookEnv);
  sent.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("the send-email hook", () => {
  it("emails a verified magic link once, keyed by the webhook id, on the site's origin", async () => {
    const response = await respond(signedRequest(hookBody()));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
    const expected = magicLinkEmail({
      to: "ada@example.com",
      url: new URL("http://localhost:5173/auth/confirm?token_hash=hash-1&type=magiclink"),
    });
    expect(sent).toEqual([[expected, "msg_1"]]);
  });

  it("links the app's origin when Supabase names a foreign site", async () => {
    await respond(signedRequest(hookBody({ site_url: "https://elsewhere.example" })));
    const expected = magicLinkEmail({
      to: "ada@example.com",
      url: new URL(`${APP_ORIGIN}/auth/confirm?token_hash=hash-1&type=magiclink`),
    });
    expect(sent).toEqual([[expected, "msg_1"]]);
  });

  it("refuses a request signed with another secret, sending nothing", async () => {
    const otherKey = btoa("another secret of thirty-two byte");
    const response = await respond(signedRequest(hookBody(), otherKey));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { http_code: 401, message: expect.any(String) },
    });
    expect(sent).toEqual([]);
  });

  it("answers other email types with an empty success and sends nothing", async () => {
    const response = await respond(signedRequest(hookBody({ email_action_type: "recovery" })));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
    expect(sent).toEqual([]);
  });

  it("answers 503 and sends nothing while the secret is unset", async () => {
    hookEnv.SEND_EMAIL_HOOK_SECRET = undefined;
    const response = await respond(signedRequest(hookBody()));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: { http_code: 503, message: "send-email hook is not configured" },
    });
    expect(sent).toEqual([]);
  });

  it("answers 405 to any method but POST", async () => {
    const get = loader();
    expect(get.status).toBe(405);
    expect(get.headers.get("Allow")).toBe("POST");
    const put = await respond(new Request(HOOK_URL, { method: "PUT", body: "{}" }));
    expect(put.status).toBe(405);
    expect(sent).toEqual([]);
  });

  it("answers 500 with the provider's refusal when the send fails", async () => {
    hookEnv.RESEND_API_KEY = "re_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("domain not verified", { status: 403 }))),
    );
    const response = await respond(signedRequest(hookBody()));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { http_code: 500, message: "Resend refused the email: 403 domain not verified" },
    });
  });
});

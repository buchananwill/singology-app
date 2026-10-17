import { SendEmailHookSchema } from "@singology/shared";
import { env } from "cloudflare:workers";
import { Webhook, WebhookVerificationError } from "standardwebhooks";

import { magicLinkEmail } from "../../workers/email/templates";
import { transportFor } from "../../workers/email/transport";
import type { EmailEnv } from "../../workers/email/types";
import { confirmHref, confirmLinkOrigin } from "../auth/confirmLink";
import { parseInput } from "../lib/actionResult";
import type { Route } from "./+types/api.auth.send-email";

/** `SEND_EMAIL_HOOK_SECRET` is a secret, absent until the hook is enabled in Supabase. */
export type SendEmailHookEnv = EmailEnv & { SEND_EMAIL_HOOK_SECRET?: string };

// Supabase shows the secret in this form; standardwebhooks wants only the base64 key.
const SUPABASE_SECRET_PREFIX = "v1,whsec_";

// The shape Supabase reads a hook failure in; success is an empty object.
function hookError(httpCode: number, message: string): Response {
  return Response.json({ error: { http_code: httpCode, message } }, { status: httpCode });
}

function methodNotAllowed(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

// Without a loader React Router answers a GET with 400; the hook's contract is 405.
export function loader() {
  return methodNotAllowed();
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }
  const config: SendEmailHookEnv = env;
  if (!config.SEND_EMAIL_HOOK_SECRET) {
    return hookError(503, "send-email hook is not configured");
  }
  // The standardwebhooks message id, unchanged on redelivery, so a retried hook sends once.
  const messageId = request.headers.get("webhook-id");
  if (messageId === null) {
    return hookError(401, "Missing the webhook-id header");
  }
  const webhook = new Webhook(config.SEND_EMAIL_HOOK_SECRET.replace(SUPABASE_SECRET_PREFIX, ""));
  let payload: unknown;
  try {
    payload = webhook.verify(await request.text(), Object.fromEntries(request.headers));
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return hookError(401, error.message);
    }
    throw error;
  }
  const parsed = parseInput(SendEmailHookSchema, payload, "The hook payload was not valid.");
  if (!parsed.ok) {
    return hookError(400, parsed.error);
  }
  const { user, email_data } = parsed.data;
  if (email_data.email_action_type !== "magiclink") {
    console.log(`send-email hook: ignored ${email_data.email_action_type}`);
    return Response.json({});
  }
  const link = new URL(
    confirmHref(email_data.token_hash),
    confirmLinkOrigin(email_data.site_url, config.APP_ORIGIN),
  );
  try {
    await transportFor(config).send(magicLinkEmail({ to: user.email, link }), messageId);
  } catch (error) {
    return hookError(500, error instanceof Error ? error.message : "The email could not be sent.");
  }
  return Response.json({});
}

import { errorMessage, MAGIC_LINK_TYPE, SendEmailHookSchema } from "@singology/shared";
import { env } from "cloudflare:workers";

import { magicLinkEmail } from "../../workers/email/templates";
import { transportFor } from "../../workers/email/transport";
import type { EmailEnv } from "../../workers/email/types";
import { confirmLinkOrigin, confirmUrl } from "../auth/confirmLink";
import { hookError, verifiedHook } from "../auth/sendEmailHook";
import { parseInput } from "../lib/actionResult";
import type { Route } from "./+types/api.auth.send-email";

/** `SEND_EMAIL_HOOK_SECRET` is a secret, absent until the hook is enabled in Supabase. */
export type SendEmailHookEnv = EmailEnv & { SEND_EMAIL_HOOK_SECRET?: string };

function methodNotAllowed(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

// Without a loader React Router answers a GET with 400; the hook's contract is 405.
export function loader(): Response {
  return methodNotAllowed();
}

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }
  const config: SendEmailHookEnv = env;
  if (!config.SEND_EMAIL_HOOK_SECRET) {
    return hookError(503, "send-email hook is not configured");
  }
  const verified = await verifiedHook(request, config.SEND_EMAIL_HOOK_SECRET);
  if (verified instanceof Response) {
    return verified;
  }
  const { messageId, payload } = verified;
  const parsed = parseInput(SendEmailHookSchema, payload, "The hook payload was not valid.");
  if (!parsed.ok) {
    return hookError(400, parsed.error);
  }
  const { user, email_data } = parsed.data;
  if (email_data.email_action_type !== MAGIC_LINK_TYPE) {
    console.log(`send-email hook: ignored ${email_data.email_action_type}`);
    return Response.json({});
  }
  const url = confirmUrl(
    email_data.token_hash,
    confirmLinkOrigin(email_data.site_url, config.APP_ORIGIN),
  );
  try {
    await transportFor(config).send(magicLinkEmail({ to: user.email, url }), messageId);
  } catch (error) {
    return hookError(500, errorMessage(error));
  }
  return Response.json({});
}

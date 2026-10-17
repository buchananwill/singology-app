import { Webhook, WebhookVerificationError } from "standardwebhooks";

/** The body Supabase reads a hook failure from; success is an empty object. */
interface SendEmailHookError {
  error: { http_code: number; message: string };
}

export interface VerifiedHook {
  /** The standardwebhooks message id, unchanged when Supabase redelivers the same hook. */
  messageId: string;
  payload: unknown;
}

// Supabase shows the secret in this form; standardwebhooks wants only the base64 key.
export const SUPABASE_SECRET_PREFIX = "v1,whsec_";

export function hookError(httpCode: number, message: string): Response {
  const body: SendEmailHookError = { error: { http_code: httpCode, message } };
  return Response.json(body, { status: httpCode });
}

export function webhookKey(secret: string): string {
  return secret.startsWith(SUPABASE_SECRET_PREFIX)
    ? secret.slice(SUPABASE_SECRET_PREFIX.length)
    : secret;
}

/** The 401 `hookError` response when the request was not signed with `secret`. */
export async function verifiedHook(
  request: Request,
  secret: string,
): Promise<VerifiedHook | Response> {
  const messageId = request.headers.get("webhook-id");
  if (messageId === null) {
    return hookError(401, "Missing the webhook-id header");
  }
  const body = await request.text();
  try {
    const payload = new Webhook(webhookKey(secret)).verify(
      body,
      Object.fromEntries(request.headers),
    );
    return { messageId, payload };
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return hookError(401, error.message);
    }
    throw error;
  }
}

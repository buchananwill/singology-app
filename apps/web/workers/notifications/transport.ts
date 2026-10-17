import type { EmailMessage } from "@singology/shared";

export interface EmailTransport {
  /** `idempotencyKey` is the claimed notification's id, so a provider retry never sends twice. */
  send(message: EmailMessage, idempotencyKey: string): Promise<{ id: string }>;
}

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

export function createResendTransport(apiKey: string, from: string): EmailTransport {
  return {
    async send(message, idempotencyKey) {
      const response = await fetch(RESEND_EMAILS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ from, ...message }),
      });
      if (!response.ok) {
        throw new Error(`Resend refused the email: ${response.status} ${await response.text()}`);
      }
      const { id } = await response.json<{ id: string }>();
      return { id };
    },
  };
}

export function createDryRunTransport(): EmailTransport {
  return {
    send(message, idempotencyKey) {
      console.log(`dry-run email to ${message.to}: ${message.subject}`);
      return Promise.resolve({ id: `dry-run:${idempotencyKey}` });
    },
  };
}

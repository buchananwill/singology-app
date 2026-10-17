import type { EmailMessage } from "@singology/shared";
import { z } from "zod";

/** `RESEND_API_KEY` is a secret, absent until the sending domain exists. */
export type TransportConfig = Record<keyof Pick<Env, "EMAIL_FROM">, string> & {
  RESEND_API_KEY?: string;
};

export interface SentEmail {
  id: string;
}

export interface EmailTransport {
  /** `idempotencyKey` is the claimed notification's id, so a provider retry never sends twice. */
  send(message: EmailMessage, idempotencyKey: string): Promise<SentEmail>;
}

/** The body of Resend's `POST /emails` on success. */
export const ResendSendResultSchema = z.object({ id: z.string().min(1) });
export type ResendSendResult = z.infer<typeof ResendSendResultSchema>;

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
      const result: ResendSendResult = ResendSendResultSchema.parse(await response.json());
      return { id: result.id };
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

export function transportFor(config: TransportConfig): EmailTransport {
  return config.RESEND_API_KEY
    ? createResendTransport(config.RESEND_API_KEY, config.EMAIL_FROM)
    : createDryRunTransport();
}

import { type SendFeedback, SendFeedbackSchema } from "@singology/shared";

/** What the review route's action returns to "Send feedback". */
export type SendFeedbackResult = { ok: true; message: string } | { ok: false; error: string };

export type ParsedSendFeedback = { ok: true; feedback: SendFeedback } | { ok: false; error: string };

/** What the payload is checked against beyond its shape. */
export interface SendFeedbackLimits {
  /** The take's length: every comment must sit inside it. */
  durationSec: number;
  /** Every exercise the coach may assign (the library). */
  libraryItemIds: ReadonlySet<string>;
}

/** Validates the whole "Send feedback" payload in the route action. */
export function parseSendFeedback(body: unknown, limits: SendFeedbackLimits): ParsedSendFeedback {
  const parsed = SendFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    return { ok: false, error: issue?.message ?? "The feedback was not valid." };
  }
  const feedback = parsed.data;
  if (feedback.comments.some((comment) => comment.tSeconds > limits.durationSec)) {
    return { ok: false, error: "A comment is past the end of the take." };
  }
  if (feedback.assignLibraryItemIds.some((id) => !limits.libraryItemIds.has(id))) {
    return { ok: false, error: "An assigned exercise is not in the library." };
  }
  return { ok: true, feedback };
}

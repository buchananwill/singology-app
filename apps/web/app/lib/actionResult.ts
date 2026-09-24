// A native <Form> posts form data, read with Object.fromEntries; fetcher submissions post JSON, read with readJson.
import type { z } from "zod";

export type ActionResult<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: string };

export type MessageResult = ActionResult<{ message: string }>;

/** Reports the schema's first issue. */
export function parseInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  fallbackMessage: string,
): ActionResult<{ data: z.output<Schema> }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? fallbackMessage };
  }
  return { ok: true, data: parsed.data };
}

export function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

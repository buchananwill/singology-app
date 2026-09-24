import type { z } from "zod";

/** What a route action returns: success with its payload, or an error to show. */
export type ActionResult<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: string };

export type MessageResult = ActionResult<{ message: string }>;

/** Validates an action's input, reporting the schema's first problem, or `fallbackMessage`. */
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

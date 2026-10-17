import { describe, expect, it } from "vitest";

import { SUPABASE_SECRET_PREFIX, webhookKey } from "./sendEmailHook";

describe("webhookKey", () => {
  it("strips Supabase's prefix from the start of the secret", () => {
    expect(webhookKey(`${SUPABASE_SECRET_PREFIX}c2VjcmV0`)).toBe("c2VjcmV0");
  });

  it("returns an unprefixed secret as it is", () => {
    expect(webhookKey("c2VjcmV0")).toBe("c2VjcmV0");
  });

  it("leaves the prefix alone when it is not at the start", () => {
    expect(webhookKey(`c2Vj${SUPABASE_SECRET_PREFIX}cmV0`)).toBe(
      `c2Vj${SUPABASE_SECRET_PREFIX}cmV0`,
    );
  });
});

import type { AuthError } from "@supabase/supabase-js";

export type AuthOperation = "getClaims" | "signInWithOtp" | "verifyOtp" | "signOut";

/** Logs what failed by code and status only: never the address or a token. */
export function logAuthError(operation: AuthOperation, error: AuthError): void {
  console.error(
    `auth ${operation} failed: ${error.name} code=${error.code ?? "none"} status=${error.status ?? "none"}`,
  );
}

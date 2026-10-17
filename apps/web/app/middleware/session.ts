import type { MiddlewareFunction } from "react-router";

import { logAuthError } from "../auth/logAuthError";
import { mergeSessionHeaders } from "../auth/mergeSessionHeaders";
import { createSupabaseServerClient } from "../auth/supabase.server";
import { claimsContext } from "../context";

// getClaims verifies the access token locally (refreshing it when it has expired), which is
// enough to scope the database transaction; getUser's round trip to Auth is not needed.
export const sessionMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const { client, headers } = createSupabaseServerClient(request);
  const { data, error } = await client.auth.getClaims();
  if (error !== null) {
    // An invalid or expired session reads as anon; the log says why.
    logAuthError("getClaims", error);
  }
  context.set(
    claimsContext,
    data === null
      ? { role: "anon" }
      : { role: "authenticated", sub: data.claims.sub, email: data.claims.email },
  );
  const response = await next();
  mergeSessionHeaders(response, headers);
  return response;
};

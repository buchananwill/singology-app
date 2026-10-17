import { authenticatedClaims } from "@singology/db";
import type { MiddlewareFunction } from "react-router";

import { logAuthError } from "../auth/logAuthError";
import { mergeSessionHeaders } from "../auth/mergeSessionHeaders";
import { createSupabaseServerClient } from "../auth/supabase.server";
import { claimsContext, supabaseContext } from "../context";

export const sessionMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const supabase = createSupabaseServerClient(request);
  context.set(supabaseContext, supabase);
  const { data, error } = await supabase.client.auth.getClaims();
  if (error !== null) {
    // An invalid or expired session reads as anon.
    logAuthError("getClaims", error);
  }
  context.set(
    claimsContext,
    data === null ? { role: "anon" } : authenticatedClaims(data.claims.sub, data.claims.email),
  );
  const response = await next();
  mergeSessionHeaders(response, supabase.headers);
  return response;
};

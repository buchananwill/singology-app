import type { MiddlewareFunction } from "react-router";

import { appendHeaders } from "../auth/appendHeaders";
import { createSupabaseServerClient } from "../auth/supabase.server";
import { claimsContext } from "../context";

// getClaims verifies the access token locally (refreshing it when it has expired), which is
// enough to scope the database transaction; getUser's round trip to Auth is not needed.
export const sessionMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const headers = new Headers();
  const { data } = await createSupabaseServerClient(request, headers).auth.getClaims();
  context.set(
    claimsContext,
    data === null
      ? { role: "anon" }
      : { role: "authenticated", sub: data.claims.sub, email: data.claims.email },
  );
  const response = await next();
  appendHeaders(response, headers);
  return response;
};

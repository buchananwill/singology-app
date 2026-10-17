import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "cloudflare:workers";

export interface SupabaseForRequest {
  client: SupabaseClient;
  /** Session cookies and no-store headers the client wrote; the caller puts them on its response. */
  headers: Headers;
}

export function createSupabaseServerClient(request: Request): SupabaseForRequest {
  const headers = new Headers();
  const client = createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get("Cookie") ?? ""),
      setAll: (cookies, cacheHeaders) => {
        for (const { name, value, options } of cookies) {
          headers.append("Set-Cookie", serializeCookieHeader(name, value, options));
        }
        for (const [name, value] of Object.entries(cacheHeaders)) {
          headers.set(name, value);
        }
      },
    },
  });
  return { client, headers };
}

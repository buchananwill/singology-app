import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { env } from "cloudflare:workers";

/**
 * A client for this request only: it reads the session from the request's cookies and writes any
 * new session cookies (and Supabase's no-store headers) into `responseHeaders`, which the caller
 * must put on its response.
 */
export function createSupabaseServerClient(request: Request, responseHeaders: Headers) {
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get("Cookie") ?? ""),
      setAll: (cookies, headers) => {
        for (const { name, value, options } of cookies) {
          responseHeaders.append("Set-Cookie", serializeCookieHeader(name, value, options));
        }
        for (const [name, value] of Object.entries(headers)) {
          responseHeaders.set(name, value);
        }
      },
    },
  });
}

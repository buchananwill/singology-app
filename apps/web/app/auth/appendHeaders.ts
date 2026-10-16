const cookieName = (setCookie: string) => setCookie.slice(0, setCookie.indexOf("="));

/**
 * Copies a headers bag onto a response. A cookie the response already sets is kept, so a route
 * that signed in or out is not overridden by a token refresh earlier in the same request.
 */
export function appendHeaders(response: Response, headers: Headers): void {
  const alreadySet = new Set(response.headers.getSetCookie().map(cookieName));
  for (const cookie of headers.getSetCookie()) {
    if (!alreadySet.has(cookieName(cookie))) {
      response.headers.append("Set-Cookie", cookie);
    }
  }
  headers.forEach((value, name) => {
    if (name.toLowerCase() !== "set-cookie") {
      response.headers.set(name, value);
    }
  });
}

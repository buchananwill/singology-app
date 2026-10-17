function cookieName(setCookie: string): string {
  const end = setCookie.indexOf("=");
  return (end === -1 ? setCookie : setCookie.slice(0, end)).trim();
}

/**
 * Copies the session middleware's headers onto a response. A cookie the response already sets
 * keeps the response's value, so a route that signed in or out is not overridden by a token
 * refresh earlier in the same request.
 */
export function mergeSessionHeaders(response: Response, headers: Headers): void {
  const setByRoute = new Set(response.headers.getSetCookie().map(cookieName));
  for (const cookie of headers.getSetCookie()) {
    if (!setByRoute.has(cookieName(cookie))) {
      response.headers.append("Set-Cookie", cookie);
    }
  }
  headers.forEach((value, name) => {
    if (name.toLowerCase() !== "set-cookie") {
      response.headers.set(name, value);
    }
  });
}

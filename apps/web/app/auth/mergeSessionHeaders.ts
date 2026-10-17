function cookieName(setCookie: string): string {
  const end = setCookie.indexOf("=");
  return (end === -1 ? setCookie : setCookie.slice(0, end)).trim();
}

/**
 * Puts the request's Supabase headers on the response. A route that already returned them (a
 * redirect carrying the bag) has every cookie once: names the response sets are skipped.
 */
export function mergeSessionHeaders(response: Response, headers: Headers): void {
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

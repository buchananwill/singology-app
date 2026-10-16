import { describe, expect, it } from "vitest";

import { appendHeaders } from "./appendHeaders";

describe("appendHeaders", () => {
  it("adds every Set-Cookie line and the other headers", () => {
    const response = new Response(null);
    const bag = new Headers();
    bag.append("Set-Cookie", "sb-auth.0=a; Path=/");
    bag.append("Set-Cookie", "sb-auth.1=b; Path=/");
    bag.set("Cache-Control", "private, no-store");
    appendHeaders(response, bag);
    expect(response.headers.getSetCookie()).toEqual(["sb-auth.0=a; Path=/", "sb-auth.1=b; Path=/"]);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("keeps a cookie the response already sets", () => {
    const response = new Response(null, { headers: { "Set-Cookie": "sb-auth.0=; Max-Age=0" } });
    const bag = new Headers();
    bag.append("Set-Cookie", "sb-auth.0=refreshed; Path=/");
    bag.append("Set-Cookie", "other=x; Path=/");
    appendHeaders(response, bag);
    expect(response.headers.getSetCookie()).toEqual(["sb-auth.0=; Max-Age=0", "other=x; Path=/"]);
  });
});

import { describe, expect, it } from "vitest";

import { mergeSessionHeaders } from "./mergeSessionHeaders";

const CHUNK_0 = "sb-abc-auth-token.0";
const CHUNK_1 = "sb-abc-auth-token.1";

function sessionBag(): Headers {
  const bag = new Headers();
  bag.append("Set-Cookie", `${CHUNK_0}=a; Path=/`);
  bag.append("Set-Cookie", `${CHUNK_1}=b; Path=/`);
  bag.set("Cache-Control", "private, no-store");
  return bag;
}

describe("mergeSessionHeaders", () => {
  it("adds every Set-Cookie line and the other headers to a response without them", () => {
    const response = new Response(null);
    mergeSessionHeaders(response, sessionBag());
    expect(response.headers.getSetCookie()).toEqual([
      `${CHUNK_0}=a; Path=/`,
      `${CHUNK_1}=b; Path=/`,
    ]);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("leaves each cookie once on a route's redirect that already carries the bag", () => {
    const bag = sessionBag();
    const redirect = new Response(null, { status: 302, headers: bag });
    mergeSessionHeaders(redirect, bag);
    expect(redirect.headers.getSetCookie()).toEqual([
      `${CHUNK_0}=a; Path=/`,
      `${CHUNK_1}=b; Path=/`,
    ]);
  });

  it("names a Set-Cookie line with no '=' by the whole line", () => {
    const bag = new Headers();
    bag.append("Set-Cookie", "flag");
    const response = new Response(null, { headers: bag });
    mergeSessionHeaders(response, bag);
    expect(response.headers.getSetCookie()).toEqual(["flag"]);
  });
});

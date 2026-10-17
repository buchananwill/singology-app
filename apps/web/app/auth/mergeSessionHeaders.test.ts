import { describe, expect, it } from "vitest";

import { mergeSessionHeaders } from "./mergeSessionHeaders";

const CHUNK_0 = "sb-abc-auth-token.0";
const CHUNK_1 = "sb-abc-auth-token.1";

describe("mergeSessionHeaders", () => {
  it("adds every Set-Cookie line and the other headers", () => {
    const response = new Response(null);
    const bag = new Headers();
    bag.append("Set-Cookie", `${CHUNK_0}=a; Path=/`);
    bag.append("Set-Cookie", `${CHUNK_1}=b; Path=/`);
    bag.set("Cache-Control", "private, no-store");
    mergeSessionHeaders(response, bag);
    expect(response.headers.getSetCookie()).toEqual([
      `${CHUNK_0}=a; Path=/`,
      `${CHUNK_1}=b; Path=/`,
    ]);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("keeps the route's value for each chunk it sets, and adds the chunks it does not", () => {
    const response = new Response(null);
    response.headers.append("Set-Cookie", `${CHUNK_0}=; Max-Age=0`);
    const bag = new Headers();
    bag.append("Set-Cookie", `${CHUNK_0}=refreshed; Path=/`);
    bag.append("Set-Cookie", `${CHUNK_1}=refreshed; Path=/`);
    mergeSessionHeaders(response, bag);
    expect(response.headers.getSetCookie()).toEqual([
      `${CHUNK_0}=; Max-Age=0`,
      `${CHUNK_1}=refreshed; Path=/`,
    ]);
  });

  it("names a Set-Cookie line with no '=' by the whole line", () => {
    const response = new Response(null);
    response.headers.append("Set-Cookie", "flag");
    const bag = new Headers();
    bag.append("Set-Cookie", "flag");
    bag.append("Set-Cookie", "other=x");
    mergeSessionHeaders(response, bag);
    expect(response.headers.getSetCookie()).toEqual(["flag", "other=x"]);
  });
});

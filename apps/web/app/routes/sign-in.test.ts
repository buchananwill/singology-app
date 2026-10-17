import { RouterContextProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { claimsContext, meContext } from "../context";
import { loader } from "./sign-in";

function loaderArgs(context: RouterContextProvider, url = "http://localhost/sign-in") {
  return { context, request: new Request(url), url: new URL(url), params: {}, pattern: "/sign-in" };
}

describe("the sign-in loader", () => {
  it("says the account is not set up when the session has no profile", () => {
    const context = new RouterContextProvider();
    context.set(claimsContext, { role: "authenticated", sub: "u1" });
    context.set(meContext, null);
    expect(loader(loaderArgs(context))).toEqual({ linkFailed: false, notSetUp: true });
  });

  it("offers the form to an anonymous visitor, flagging a failed link", () => {
    const context = new RouterContextProvider();
    expect(loader(loaderArgs(context, "http://localhost/sign-in?error=link"))).toEqual({
      linkFailed: true,
      notSetUp: false,
    });
  });
});

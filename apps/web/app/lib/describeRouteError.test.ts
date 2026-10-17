import { describe, expect, it } from "vitest";

import { describeRouteError } from "./describeRouteError";

// The shape React Router hands the boundary for a loader's `throw data(..., { status })`.
const errorResponse = (status: number) => ({
  status,
  statusText: "",
  internal: false,
  data: "Not a student",
});

describe("describeRouteError", () => {
  it("maps known statuses to their copy and others to their status text", () => {
    expect(describeRouteError(errorResponse(403), false).title).toBe(
      "Not available to your account",
    );
    expect(describeRouteError(errorResponse(404), false).title).toBe("Page not found");
    expect(describeRouteError({ ...errorResponse(500), statusText: "Down" }, false)).toEqual({
      title: "Error",
      details: "Down",
    });
  });

  it("shows an exception's message and stack only in development", () => {
    const error = new Error("boom");
    expect(describeRouteError(error, true)).toMatchObject({ details: "boom" });
    expect(describeRouteError(error, true).stack).toBeDefined();
    expect(describeRouteError(error, false)).toEqual({
      title: "Something went wrong",
      details: "An unexpected error occurred.",
    });
  });
});

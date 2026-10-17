import { describe, expect, it } from "vitest";

import { errorMessage, firstName, formatCount } from "./text";

describe("firstName", () => {
  it("takes the first word of a display name", () => {
    expect(firstName("Ada Lovelace")).toBe("Ada");
    expect(firstName("Ada")).toBe("Ada");
  });
});

describe("formatCount", () => {
  it("formats a count with its singular or plural noun", () => {
    expect(formatCount(0, "comment", "comments")).toBe("0 comments");
    expect(formatCount(1, "comment", "comments")).toBe("1 comment");
    expect(formatCount(3, "exercise", "exercises")).toBe("3 exercises");
  });
});

describe("errorMessage", () => {
  it("reads an Error's message and stringifies anything else", () => {
    expect(errorMessage(new Error("pool closed"))).toBe("pool closed");
    expect(errorMessage("timeout")).toBe("timeout");
  });
});

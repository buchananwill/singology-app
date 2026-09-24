import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseInput, readJson } from "./actionResult";

const FALLBACK = "The request was not valid.";

const Schema = z.object({
  count: z.coerce.number().int("Count must be whole."),
  label: z.string().default("none"),
});

describe("parseInput", () => {
  it("returns the parsed data with the schema's coercions and defaults", () => {
    expect(parseInput(Schema, { count: "2" }, FALLBACK)).toEqual({
      ok: true,
      data: { count: 2, label: "none" },
    });
  });

  it("parses form data turned into an object", () => {
    const formData = new FormData();
    formData.set("count", "3");
    formData.set("label", "three");
    expect(parseInput(Schema, Object.fromEntries(formData), FALLBACK)).toEqual({
      ok: true,
      data: { count: 3, label: "three" },
    });
  });

  it("reports the schema's first issue", () => {
    expect(parseInput(Schema, { count: "2.5" }, FALLBACK)).toEqual({
      ok: false,
      error: "Count must be whole.",
    });
  });

  it("fails on input that is not an object", () => {
    expect(parseInput(Schema, null, FALLBACK).ok).toBe(false);
  });
});

describe("readJson", () => {
  const post = (body: string) => new Request("http://localhost/", { method: "POST", body });

  it("returns the parsed body", async () => {
    expect(await readJson(post('{"count":2}'))).toEqual({ count: 2 });
  });

  it("returns null for a body that is not JSON", async () => {
    expect(await readJson(post("count=2"))).toBeNull();
  });
});

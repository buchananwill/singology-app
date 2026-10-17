import { describe, expect, it } from "vitest";

import { theme } from "./theme";

describe("theme", () => {
  it("expresses the brand through Mantine", () => {
    expect(theme.primaryColor).toBe("brand");
    expect(theme.black).toBe("#373b4d");
    expect(theme.autoContrast).toBe(true);
    expect(theme.colors?.brand?.[theme.primaryShade as number]).toBe("#4fdb6d");
  });
});

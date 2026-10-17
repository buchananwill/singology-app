import { describe, expect, it } from "vitest";

import { BRAND_SHADE, theme } from "./theme";

describe("theme", () => {
  it("expresses the brand through Mantine", () => {
    expect(theme.primaryColor).toBe("brand");
    expect(theme.black).toBe("#373b4d");
    expect(theme.autoContrast).toBe(true);
    expect(theme.primaryShade).toBe(BRAND_SHADE);
    expect(theme.colors?.brand?.[BRAND_SHADE]).toBe("#4fdb6d");
  });
});

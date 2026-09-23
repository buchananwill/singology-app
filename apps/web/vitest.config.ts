import { defineConfig } from "vitest/config";

// Unit tests run without the React Router and Cloudflare Vite plugins in vite.config.ts.
export default defineConfig({
  test: {
    include: ["app/**/*.test.ts"],
  },
});

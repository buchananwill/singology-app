import { defineConfig } from "vitest/config";

// Unit tests only: the database tests run through `test:db` and `test:rls`.
export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
});

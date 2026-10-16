import { defineConfig } from "vitest/config";

// Integration tests against the seeded alpha database; never part of the root `pnpm test`.
export default defineConfig({
  test: {
    include: ["test/db/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});

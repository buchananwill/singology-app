import { defineConfig } from "vitest/config";

// Integration tests against the test project, reseeded before the run; never part of `pnpm test`.
export default defineConfig({
  test: {
    include: ["test/db/**/*.test.ts"],
    globalSetup: ["test/db/globalSetup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});

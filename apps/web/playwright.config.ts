import { defineConfig, devices } from "@playwright/test";

import { PREVIEW_PORT } from "./previewPort";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/artifacts",
  fullyParallel: true,
  // Local Hyperdrive emulation opens a Postgres connection per repository call, and the Supabase
  // session pooler allows 15 clients; more workers exhaust it with parallel loaders.
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    trace: "retain-on-failure",
  },
  // Tests tagged `@writes` change the seeded data, so they run once, after every reader has run.
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts$/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      grepInvert: /@writes/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
      grepInvert: /@writes/,
    },
    {
      name: "writes",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["chromium", "webkit"],
      grep: /@writes/,
    },
  ],
  webServer: {
    // `wrangler dev`, not `vite preview`: its proxy exhausts Windows ephemeral ports.
    command: `pnpm run build && pnpm run serve:built:test --port ${PREVIEW_PORT}`,
    url: `http://localhost:${PREVIEW_PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

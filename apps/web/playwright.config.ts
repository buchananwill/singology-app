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
  // Reseeds the test project (never the alpha), so every run starts from the fixture state.
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    // Signs each tester in once; the specs reuse the saved browser state.
    { name: "setup", testMatch: /auth\.setup\.ts$/ },
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, dependencies: ["setup"] },
  ],
  webServer: {
    // `wrangler dev`, not `vite preview`: its proxy exhausts Windows ephemeral ports.
    // `serve:built:test` points the Worker at the test project from packages/db/.env.test.
    command: `pnpm run build && pnpm run serve:built:test --port ${PREVIEW_PORT}`,
    url: `http://localhost:${PREVIEW_PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

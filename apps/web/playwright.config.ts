import { defineConfig, devices } from "@playwright/test";

import { PREVIEW_PORT } from "./previewPort";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/artifacts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    // `wrangler dev`, not `vite preview`: its proxy exhausts Windows ephemeral ports. `serve:built`
    // and `dev` load .dev.vars with --env-file because Wrangler reads the local Hyperdrive string
    // only from the process environment.
    command: `pnpm run build && pnpm run serve:built --port ${PREVIEW_PORT}`,
    url: `http://localhost:${PREVIEW_PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

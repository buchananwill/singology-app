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
    // `wrangler dev`, not `vite preview`: its proxy exhausts Windows ephemeral ports. Wrangler reads
    // the local Hyperdrive string only from the process environment, so .dev.vars is loaded into it.
    command: `pnpm run build && node --env-file-if-exists=.dev.vars node_modules/wrangler/bin/wrangler.js dev --config build/server/wrangler.json --port ${PREVIEW_PORT} --ip 127.0.0.1`,
    url: `http://localhost:${PREVIEW_PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

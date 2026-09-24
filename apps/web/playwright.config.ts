import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/artifacts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    // Builds, then serves the built Worker straight from workerd with `wrangler dev` (local only).
    // Not `pnpm preview`: its Node proxy (Cloudflare Vite plugin, miniflare) opens a new loopback
    // TCP connection to workerd per request, and on Windows the TIME_WAIT sockets from a stressed
    // run exhaust ephemeral ports, so requests fail with `connect EADDRINUSE` (pitfall 11).
    command: `pnpm run build && pnpm exec wrangler dev --config build/server/wrangler.json --port ${PORT} --ip 127.0.0.1`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

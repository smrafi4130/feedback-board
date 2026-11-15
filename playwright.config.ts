import { defineConfig, devices } from "@playwright/test";

// E2E runs against the production server with a seeded, on-disk PGlite database
// (PGLITE_DATA), so the seed process and the server share the same data.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:3100", trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "PGLITE_DATA=.pglite-e2e pnpm exec next start -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

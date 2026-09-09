// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    // Explicit IPv4: the dev server binds 0.0.0.0, and "localhost" can
    // resolve to ::1 first (especially on Windows), which breaks both the
    // reuse check and page loads.
    baseURL: "http://127.0.0.1:8081",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // Invoke the local CLI directly and pass NODE_OPTIONS via `env` — the
    // previous `npx cross-env ...` chain hangs when spawned by Playwright on
    // Windows.
    command: "node node_modules/@quasar/cli/bin/quasar.js dev -m spa",
    env: {
      ...process.env,
      NODE_OPTIONS: "--openssl-legacy-provider",
    },
    url: "http://127.0.0.1:8081",
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
    cwd: "..",
  },
});

import { defineConfig } from "@playwright/test";

// End-to-end checks of the production build. Locally they run in the installed Google Chrome, on
// CI in Playwright's own Chromium.
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [["list"], ["json", { outputFile: "e2e/.last-run.json" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3300",
    channel: process.env.CI ? undefined : "chrome",
    trace: "off",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npx next start -p 3300",
        url: "http://localhost:3300/en",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});

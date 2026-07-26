import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/labs/shaders",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

import { defineConfig, devices } from "@playwright/test";

const hardwareProof = process.env.SHADER_HARDWARE_PROOF === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  reporter: [["line"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    screenshot: "only-on-failure",
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    ...(hardwareProof
      ? [
          {
            name: "chrome-hardware",
            use: {
              ...devices["Desktop Chrome"],
              channel: "chrome",
              headless: false,
            },
          },
        ]
      : []),
  ],
  webServer: {
    command: hardwareProof
      ? "pnpm build && pnpm start --hostname 127.0.0.1 --port 3100"
      : "pnpm dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/labs/shaders",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

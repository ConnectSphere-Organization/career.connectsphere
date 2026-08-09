import { defineConfig } from "@playwright/test";

const targetBaseURL =
  process.env.PLAYWRIGHT_TARGET_URL ?? "http://localhost:3001";
const shouldStartTarget = !process.env.PLAYWRIGHT_TARGET_URL;

const viewports = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
] as const;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 2 } : {}),
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  expect: { timeout: 10_000 },
  use: {
    baseURL: targetBaseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  },
  projects: viewports.map(({ name, width, height }) => ({
    name: `chromium-${name}`,
    use: { browserName: "chromium", viewport: { width, height } },
  })),
  ...(shouldStartTarget
    ? {
        webServer: {
          command:
            "MONGODB_URI='mongodb://127.0.0.1:27017/connectsphere?replicaSet=rs0&serverSelectionTimeoutMS=500' corepack pnpm build && corepack pnpm start",
          url: targetBaseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
});

import { defineConfig } from "@playwright/test";

// Minimal e2e setup. One browser (chromium) for speed.
// Future OpenScreen video captures: run headed, e.g.
//   pnpm test:e2e:headed
// which opens a real window the recorder can see.
// webServer boots `pnpm dev` automatically; reuseExistingServer
// keeps local iteration fast, CI always starts fresh.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "dot" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});

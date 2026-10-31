import { test, expect } from "@playwright/test";

// Smoke: homepage boots, hero renders, country grid is present.
// Future feature videos (OpenScreen) will drive from this baseline.
test("homepage shows B2R hero and country grid", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/B2R ASEAN Intelligence/);
  await expect(
    page.getByRole("heading", { name: /One ASEAN/i }),
  ).toBeVisible();
  await expect(page.locator("#countries")).toBeVisible();
});

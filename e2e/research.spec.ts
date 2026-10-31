import { test, expect } from "@playwright/test";

test("Match submits five answers to the real backend and opens the same report in Compare", async ({ page }) => {
  await page.goto("/match?markets=MY,TH");
  await page.getByLabel("Industry (required)").selectOption("software_saas");
  await page.getByLabel("What do you offer, and what problem does it solve? (required)").fill("Inventory and purchasing software for independent restaurant groups");
  await page.getByLabel("Revenue status (required)").selectOption("pre_revenue");
  await page.getByLabel("What do you want to achieve, and by when? (required)").fill("Validate one new market in the next twelve months");
  const response = page.waitForResponse(response => response.url().endsWith("/api/recommendations") && response.request().method() === "POST");
  await page.getByRole("button", {name:"Research selected countries",exact:true}).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByRole("heading",{name:"Your market research",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Open in Compare",exact:true}).click();
  await expect(page).toHaveURL(/\/compare/);
  await expect(page.getByText("Evidence-only mode",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:/View source/}).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("link").first()).toHaveAttribute("href",/^https:\/\//);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("Compare loads sourced country content without a Match profile", async ({ page }) => {
  await page.goto("/compare?codes=MY,TL");
  await expect(page.getByTestId("library-country-MY")).toBeVisible();
  await expect(page.getByTestId("library-country-TL")).toBeVisible();
  await page.getByRole("button",{name:"Market demand",exact:true}).click();
  await expect(page.getByTestId("library-country-MY").getByRole("heading",{level:3}).first()).toBeVisible();
  await page.setViewportSize({width:375,height:812});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/compare-mobile.png"});
});

test("Match keeps answers available after a server failure", async ({ page }) => {
  await page.route("**/api/recommendations",route=>route.fulfill({status:503,contentType:"application/json",body:'{"error":"unavailable"}'}));
  await page.goto("/match?markets=SG");
  await page.getByLabel("Industry (required)").selectOption("software_saas");
  await page.getByLabel("What do you offer, and what problem does it solve? (required)").fill("Software to simplify restaurant inventory purchases");
  await page.getByLabel("Revenue status (required)").selectOption("not_disclosed");
  await page.getByLabel("What do you want to achieve, and by when? (required)").fill("Research expansion next year");
  await page.getByRole("button",{name:"Research selected countries",exact:true}).click();
  await expect(page.getByText("Research could not be completed.", {exact:false})).toBeVisible();
  await expect(page.getByLabel("What do you offer, and what problem does it solve? (required)")).toHaveValue("Software to simplify restaurant inventory purchases");
});

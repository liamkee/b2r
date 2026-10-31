import { test, expect } from "@playwright/test";

const intro = (page: import("@playwright/test").Page) => page.getByRole("dialog", { name: "ASEAN ONE intro", exact: true });
const video = (page: import("@playwright/test").Page) => page.getByLabel("Southeast Asia introduction", { exact: true });

test("homepage intro loads the real video, autoplays muted inline, and floats in the centre", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await expect(video(page)).toBeVisible();
  await expect.poll(() => video(page).evaluate(element => {
    const media = element as HTMLVideoElement;
    return media.readyState >= 1 && Number.isFinite(media.duration) && media.duration > 0;
  })).toBe(true);
  const duration = await video(page).evaluate(element => (element as HTMLVideoElement).duration);
  test.info().annotations.push({ type: "actual_video_duration_seconds", description: String(duration) });
  await expect.poll(() => video(page).evaluate(element => {
    const media = element as HTMLVideoElement;
    return media.muted && media.playsInline && !media.paused && media.currentTime > 0;
  })).toBe(true);
  const bounds = await video(page).boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeLessThan(viewport.width);
  expect(bounds!.height).toBeLessThan(viewport.height);
  expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThan(4);
  await page.screenshot({path:"test-results/intro-desktop.png"});
});

test("Skip intro closes the video and a homepage reload shows it again", async ({ page }) => {
  await page.setViewportSize({width:375,height:812});
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await page.getByRole("button", { name: "Skip intro", exact: true }).click();
  await expect(intro(page)).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await page.reload();
  await expect(intro(page)).toBeVisible();
});

test("the video ending dismisses the overlay", async ({ page }) => {
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await expect.poll(() => video(page).evaluate(element => Number.isFinite((element as HTMLVideoElement).duration))).toBe(true);
  await video(page).evaluate(element => { const media = element as HTMLVideoElement; media.currentTime = Math.max(0, media.duration - 0.3); });
  await expect(intro(page)).not.toBeVisible();
  await expect(page.getByRole("heading", { name: /One ASEAN/i })).toBeVisible();
});

test("Escape dismisses the intro and returns access to the homepage", async ({ page }) => {
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(intro(page)).not.toBeVisible();
  await expect(page.getByRole("heading", { name: /One ASEAN/i })).toBeVisible();
});

for (const path of ["/match", "/compare"]) {
  test(`opening ${path} directly does not show an intro`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(intro(page)).toHaveCount(0);
    await expect(video(page)).toHaveCount(0);
  });
}

test("an unavailable video fails open to the usable homepage", async ({ page }) => {
  await page.route("**/intro.mp4", route => route.abort("failed"));
  const failed = page.waitForEvent("requestfailed", request => request.url().endsWith("/intro.mp4"));
  await page.goto("/");
  await failed;
  await expect(intro(page)).not.toBeVisible();
  await expect(page.getByRole("heading", { name: /One ASEAN/i })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("reduced motion keeps the introduction manually controllable and skippable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await expect(video(page)).toHaveJSProperty("controls", true);
  await expect(video(page)).toHaveJSProperty("paused", true);
  await page.getByRole("button", { name: "Skip intro", exact: true }).click();
  await expect(intro(page)).not.toBeVisible();
});

test("blocked autoplay exposes controls instead of trapping the visitor", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Autoplay blocked for test", "NotAllowedError"));
  });
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await expect(video(page)).toHaveJSProperty("controls", true);
  await expect(page.getByRole("button", { name: "Skip intro", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(intro(page)).not.toBeVisible();
});

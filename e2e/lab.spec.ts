import { expect, test } from "@playwright/test";

const IDS = [
  "kinetic", "magnetic", "scramble", "liquid", "trail", "elastic", "liquidimage", "sphere",
  "mesh", "gradient", "repulse", "gravity", "scroll", "compare", "micro", "playground",
];

test.describe("motion lab", () => {
  test("catalog lists every experiment and filters by tag", async ({ page }) => {
    await page.goto("/en/lab");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Motion Lab/i);
    await expect(page.locator("ol button")).toHaveCount(IDS.length);
    await page.goto("/en/lab?tag=webgl");
    await expect(page.locator("ol button")).toHaveCount(4);
    await expect(page.getByRole("button", { name: "WebGL", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("opening an experiment brings the stage into view and params are live", async ({ page }) => {
    await page.goto("/en/lab");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator("ol button").nth(5).click();
    const stage = page.locator("section[aria-labelledby=exp-title]");
    await expect(stage).toBeVisible();
    await expect.poll(async () => (await stage.boundingBox())?.y ?? 9999).toBeLessThan(200);
    const slider = page.locator('input[type="range"]').first();
    const before = await slider.inputValue();
    await slider.fill(String(Number(before) === 20 ? 21 : 20));
    await expect(page.locator("output").first()).toHaveText(/\d/);
    await page.getByRole("button", { name: /back to index/i }).click();
    await expect(page.locator("ol button").first()).toBeVisible();
  });

  for (const id of IDS) {
    test(`experiment ${id} opens without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`/en/lab?exp=${id}`);
      await expect(page.locator("section[aria-labelledby=exp-title] h2")).toBeVisible();
      await page.waitForTimeout(900);
      await expect(page.locator('[class*="notice"]')).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }

  test("arabic lab is right to left and has no overflow on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/ar/lab");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("مختبر");
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over).toBeLessThanOrEqual(0);
    await page.goto("/ar/lab?exp=gravity");
    const over2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over2).toBeLessThanOrEqual(0);
  });
});

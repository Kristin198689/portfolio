import { expect, test } from "@playwright/test";

// The Skills Universe: the canvas is decorative, so the tests use the real HTML controls.
test.describe("skills universe", () => {
  test("legend opens a cluster, a skill shows proof and a lab link", async ({ page }) => {
    await page.goto("/en");
    const section = page.locator("#universe");
    await section.scrollIntoViewIfNeeded();
    const legend = section.getByRole("navigation", { name: "Skill clusters" });
    await expect(legend.getByRole("button")).toHaveCount(7);
    await legend.getByRole("button", { name: /Creative development/ }).click();
    const panel = section.getByLabel("Skill details");
    await expect(panel.getByRole("heading", { name: "Creative development" })).toBeVisible();
    await panel.getByRole("button", { name: "GSAP" }).click();
    await expect(panel.getByRole("link", { name: /Explore GSAP experiments/ })).toHaveAttribute("href", /\/lab\?tag=gsap/);
    await expect(panel.getByRole("link", { name: /Beauty Studio/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel.getByRole("heading", { name: "Creative development" })).toBeVisible();
  });

  test("works in Arabic and does not overflow on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/ar");
    await expect(page.locator("#universe").getByRole("navigation").getByRole("button")).toHaveCount(7);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over).toBeLessThanOrEqual(0);
  });
});

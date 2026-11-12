import { expect, test, type Page } from "@playwright/test";

const LOCALES = ["de", "en", "uk", "ar"] as const;

// Finds elements that stick out sideways and are not clipped by an ancestor
async function overflowing(page: Page) {
  return page.evaluate(() => {
    const W = window.innerWidth;
    const clipped = (el: Element) => {
      let p = el.parentElement;
      while (p && p !== document.body && p !== document.documentElement) {
        const cs = getComputedStyle(p);
        if (/(hidden|clip|auto|scroll)/.test(cs.overflowX)) {
          const r = p.getBoundingClientRect();
          if (r.right <= W + 1 && r.left >= -1) return true;
        }
        p = p.parentElement;
      }
      return false;
    };
    const bad: string[] = [];
    document.querySelectorAll("body *").forEach((e) => {
      const cs = getComputedStyle(e);
      if (cs.position === "fixed" || cs.display === "none" || e.closest("[class*=Companion]")) return;
      const r = e.getBoundingClientRect();
      if (r.width && (r.right > W + 1 || r.left < -1) && !clipped(e)) bad.push(e.tagName + "." + String(e.className).slice(0, 30));
    });
    return bad.slice(0, 5);
  });
}

for (const locale of LOCALES) {
  test(`home renders in ${locale} with correct lang and direction`, async ({ page }) => {
    const res = await page.goto(`/${locale}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.locator("h1").first()).toBeVisible();
  });
}

test("SEO head: canonical, hreflang with x-default and parsable JSON-LD", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  const langs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
  expect(langs).toEqual(expect.arrayContaining(["de", "en", "uk", "ar", "x-default"]));
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  const graph = JSON.parse(ld ?? "{}")["@graph"];
  expect(graph.map((n: { "@type": string }) => n["@type"])).toEqual(expect.arrayContaining(["WebSite", "Person", "ProfilePage"]));
});

test("sitemap, robots and llms.txt are served", async ({ request }) => {
  for (const path of ["/sitemap.xml", "/robots.txt", "/llms.txt"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});

for (const width of [320, 375, 768, 1024]) {
  test(`no sideways overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/en", "/ar", "/en/hire", "/en/work"]) {
      await page.goto(path);
      await page.waitForTimeout(1200);
      expect(await overflowing(page), `${path} @${width}`).toEqual([]);
    }
  });
}

test("language switcher changes the locale", async ({ page }) => {
  await page.goto("/en");
  await page.locator('header a[hreflang="uk"]').first().click();
  await expect(page).toHaveURL(/\/uk$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
});

test("command palette opens with Ctrl+K and navigates", async ({ page }) => {
  await page.goto("/en");
  await page.waitForTimeout(1500);
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox").fill("recruit");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/hire$/);
});

test("theme toggle switches to dark and remembers it", async ({ page }) => {
  await page.goto("/en");
  await page.locator("header button[aria-pressed]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("contact form validates before opening WhatsApp", async ({ page }) => {
  await page.goto("/en");
  const form = page.locator("#contact form");
  await form.scrollIntoViewIfNeeded();
  await form.getByRole("button", { name: /WhatsApp/ }).click();
  await expect(form.locator("[aria-invalid='true']").first()).toBeVisible();
});

test("all projects page filters and searches", async ({ page }) => {
  await page.goto("/en/work");
  const rows = page.locator("main li").filter({ has: page.locator("h3") });
  const all = await rows.count();
  expect(all).toBeGreaterThan(10);
  await page.getByRole("tab", { name: "In progress" }).click();
  expect(await rows.count()).toBeLessThan(all);
  await page.getByRole("tab", { name: "All" }).click();
  await page.getByRole("searchbox").fill("three.js");
  expect(await rows.count()).toBeGreaterThan(0);
  expect(await rows.count()).toBeLessThan(all);
});

test("unknown URL shows the custom 404 with HTTP 404", async ({ page }) => {
  const res = await page.goto("/en/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /lost in space/i })).toBeVisible();
});

test("Impressum shows a complete address", async ({ page }) => {
  await page.goto("/de/impressum");
  await expect(page.locator("main")).toContainText("75175 Pforzheim");
  await expect(page.locator("main [role=note]")).toHaveCount(0);
});

test("recruiter page offers the PDF and contact options", async ({ page }) => {
  await page.goto("/en/hire");
  await expect(page.getByRole("link", { name: /Download profile/ })).toHaveAttribute("href", "/cv/profile-en.pdf");
  await expect(page.getByRole("link", { name: /Email me/ })).toBeVisible();
});

test("Konami code shows the easter egg", async ({ page }) => {
  await page.goto("/en");
  await page.waitForTimeout(1500);
  for (const k of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]) {
    await page.keyboard.press(k);
  }
  await expect(page.getByRole("status")).toContainText(/found it/i);
});

test("pull request demo can be approved", async ({ page }) => {
  await page.goto("/en");
  const demo = page.locator("#skills section", { hasText: "Team workflow" });
  await demo.scrollIntoViewIfNeeded();
  await demo.getByRole("button", { name: "Approve and merge" }).click();
  await expect(demo.getByText("Approved and merged").first()).toBeVisible();
});

test("contact shows phone and email from the studio data", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator('#contact a[href^="tel:"]')).toHaveAttribute("href", "tel:+4915236385095");
  await expect(page.locator('#contact a[href^="mailto:"]')).toHaveAttribute("href", "mailto:volodina.webstudio@gmail.com");
});

test("all projects page links to live deployments", async ({ page }) => {
  await page.goto("/en/work");
  const live = await page.locator('main a[href^="https://"][href*="vercel.app"]').count();
  expect(live).toBeGreaterThan(8);
});

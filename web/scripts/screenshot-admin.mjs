import { chromium } from "playwright";

const url = process.argv[2] ?? "https://lr-status.vercel.app";
const outPrefix = process.argv[3] ?? `${process.env.TMPDIR ?? "/tmp"}/lr-admin`;

const browser = await chromium.launch();

async function shot(width, height, name) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(() => {
    localStorage.setItem(
      "deped-lr-tracker.auth.v2",
      JSON.stringify({ user: { name: "QA Admin", email: "", role: "admin" } }),
    );
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${outPrefix}-${name}.png` });
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${outPrefix}-${name}-scrolled.png` });
  await page.close();
  console.log(`${name} saved`);
}

await shot(1280, 800, "desktop");
await shot(768, 1024, "tablet");
await shot(390, 844, "mobile");
await browser.close();

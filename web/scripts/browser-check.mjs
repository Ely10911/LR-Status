import { chromium } from "playwright";

const browser = await chromium.launch();
for (const url of [
  "https://lr-status.vercel.app",
  "https://i73nkutyqdn7zbnlwtpcc-web.rork.live",
]) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 140));
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 140)));
  await page
    .goto(url, { waitUntil: "networkidle", timeout: 45000 })
    .catch((e) => errors.push("nav: " + e.message.slice(0, 80)));
  await page.waitForTimeout(6000);
  const body = (await page.textContent("body")) ?? "";
  const hasData = body.includes("LR-2") || body.includes("Published") || body.length > 500;
  console.log(url.slice(8, 40), "| loaded:", hasData, "| console errors:", errors.length);
  errors.slice(0, 3).forEach((e) => console.log("   ", e));
  await page.close();
}
await browser.close();

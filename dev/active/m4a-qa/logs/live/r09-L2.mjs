const page = (await taskSpace(37)).page("p2");
const st = () => page.evaluate(() => ({
  status: [...document.querySelectorAll("[role=status]")].map(s => s.textContent.trim()).filter(t => /내보|만들/.test(t)).map(t => t.slice(0, 120)),
  alert: [...document.querySelectorAll("[role=alert]")].map(s => s.textContent.trim()).filter(Boolean),
  alertBtns: [...document.querySelectorAll("[role=alert] button")].map(b => b.textContent.trim()),
  focus: `${document.activeElement?.tagName}:${(document.activeElement?.textContent ?? "").trim().slice(0, 30)}`,
}));
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await page.cdp("Network.enable", {});
await page.cdp("Network.setCacheDisabled", { cacheDisabled: true });
await page.cdp("Network.setBlockedURLs", { urls: ["*/assets/staticHtml-*", "*/assets/exportFlow-*"] });
await page.goto("http://127.0.0.1:4395/studio/project-1");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim() === "정적 사이트(zip) 내보내기"), undefined, { timeout: 30000 }).catch(async (e) => {
  console.log("no zip btn", String(e).slice(0, 80));
  await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].find(t => /검사/.test(t.textContent))?.click());
  await page.waitForTimeout(1500);
});
console.log("tabs", await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].map(t => `${t.textContent.trim()}:${t.getAttribute("aria-selected")}`)), "toolbar", await page.evaluate(() => document.body.innerText.match(/이 (브라우저|탭)에 저장됨/)?.[0]));
await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].find(t => /검사/.test(t.textContent))?.click());
await page.waitForTimeout(1000);
console.log("before", JSON.stringify(await st()), await page.evaluate(() => [...document.querySelectorAll("button")].filter(b => /내보내기$/.test(b.textContent.trim())).map(b => b.textContent.trim() + ":" + (b.getAttribute("aria-disabled") ?? b.disabled))));
const t0 = Date.now();
await page.click("loc=role:button[name='정적 사이트(zip) 내보내기']", { label: "export zip blocked chunk" });
await page.waitForFunction(() => [...document.querySelectorAll("[role=alert]")].some(s => s.textContent.trim()), undefined, { timeout: 60000 }).catch(e => console.log("wait err", String(e).slice(0, 100)));
console.log("ms", Date.now() - t0, JSON.stringify(await st()));
await page.screenshot({ path: "/tmp/m4a-qa-live/out/L2-390-fail.png" });
await page.cdp("Network.setBlockedURLs", { urls: [] });
await page.cdp("Network.setCacheDisabled", { cacheDisabled: false });

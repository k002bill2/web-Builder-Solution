const page = (await taskSpace(37)).page("p1");
const st = () => page.evaluate(() => ({
  status: [...document.querySelectorAll("[role=status]")].map(s => s.textContent.trim()).filter(t => /내보|만들/.test(t)).map(t => t.slice(0, 120)),
  alert: [...document.querySelectorAll("[role=alert]")].map(s => s.textContent.trim()).filter(Boolean),
  focus: `${document.activeElement?.tagName}:${(document.activeElement?.textContent ?? "").trim().slice(0, 30)}`,
}));
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await page.waitForTimeout(800);
console.log("url", await page.url(), "tabs", await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].map(t => `${t.textContent.trim()}:${t.getAttribute("aria-selected")}`)));
// 강제 재생성: SEO 제목 1글자 바꾸기 (검사 탭에 없으면 편집 경로 생략)
await page.cdp("Network.enable", {});
await page.cdp("Network.setCacheDisabled", { cacheDisabled: true });
await page.cdp("Network.setBlockedURLs", { urls: ["*render.html*", "*/assets/render*"] });
const t0 = Date.now();
await page.click("loc=role:button[name='정적 사이트(zip) 내보내기']", { label: "export zip blocked" });
await page.waitForFunction(() => [...document.querySelectorAll("[role=alert]")].some(s => s.textContent.trim()) || [...document.querySelectorAll("[role=status]")].some(s => /만들었습니다/.test(s.textContent) && !s.dataset.qaOld), undefined, { timeout: 120000 }).catch(e => console.log("wait err", String(e).slice(0, 100)));
console.log("ms", Date.now() - t0, JSON.stringify(await st()));
await page.screenshot({ path: "/tmp/m4a-qa-live/out/L2-390-fail.png" });
await page.cdp("Network.setBlockedURLs", { urls: [] });
await page.cdp("Network.setCacheDisabled", { cacheDisabled: false });

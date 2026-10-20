// E0-2 보조: preview 1280 미완료 이미지 1장 = loading=lazy 화면 밖인지 확인 → 스크롤 후 complete
const task = await taskSpace("csp-zip E0");
const page = task.page("p1");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://localhost:4399/");
await page.waitForLoadState();
const before = await page.evaluate(() => [...document.images].map((i) => ({ loading: i.loading, complete: i.complete, top: Math.round(i.getBoundingClientRect().top) })));
await page.evaluate(() => [...document.images].forEach((i) => i.scrollIntoView()));
await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), undefined, { timeout: 10000 });
const after = await page.evaluate(() => ({ imgs: [...document.images].map((i) => i.complete && i.naturalWidth > 0), violations: window.__v ? window.__v.length : "no-listener" }));
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
console.log(JSON.stringify({ before, after }));

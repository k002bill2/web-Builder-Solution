// 재촬영 — 내보내기 버튼 5개 전체가 보이게(IDB에 남은 project-1 재사용, 앱 안 클릭으로 이동)
const D = "/Users/younghwankang/orca/workspaces/web-builder-solution/sample-copy/dev/active/sample-copy/qa";
const task = await taskSpace("sample-copy qa-2");
const page = task.page("p1");
const log = (k, v) => console.log("X", k, JSON.stringify(v).slice(0, 800));
try {
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.cdp("Runtime.enable", {}); await page.events();
await page.goto("http://localhost:4399/catalog");
await page.waitForTimeout(1500);
log("links", await page.evaluate(() => [...document.querySelectorAll("a")].map((a) => a.textContent.trim() + "→" + a.getAttribute("href")).slice(0, 15)));
log("go projects", await page.evaluate(() => { const a = [...document.querySelectorAll("a")].find((a) => /\/projects/.test(a.getAttribute("href") || "")); if (!a) return "missing"; a.click(); return "clicked"; }));
await page.waitForTimeout(1500);
log("open project", await page.evaluate(() => { const a = [...document.querySelectorAll("a,button")].find((a) => /\/studio\//.test(a.getAttribute("href") || "") || /이어서 편집|열기/.test(a.textContent)); if (!a) return "missing"; a.click(); return a.textContent.trim().slice(0, 40); }));
await page.waitForFunction(() => /^\/studio\//.test(location.pathname), undefined, { timeout: 20000 });
await page.waitForTimeout(2000);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /검사 · 내보내기/.test(b.textContent))?.click());
await page.waitForTimeout(1200);
log("scroll", await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "PNG 내려받기"); if (!b) return "missing"; b.scrollIntoView({ block: "start" }); return "ok"; }));
await page.waitForTimeout(500);
log("visible export buttons", await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => { const r = b.getBoundingClientRect(); return r.left > 980 && r.top >= 0 && r.bottom <= innerHeight && /내려받기|내보내기/.test(b.textContent); }).map((b) => b.textContent.trim())));
await page.screenshot({ path: `${D}/screens/01b-export-buttons-all-1280.png` });
const ev = await page.events();
log("console errors", ev.filter((e) => (e.method === "Runtime.consoleAPICalled" && e.params.type === "error") || e.method === "Runtime.exceptionThrown").map((e) => JSON.stringify(e.params).slice(0, 300)));
} catch (e) { log("FATAL", String(e).slice(0, 300)); }
await task.finish({ keep: [] });
console.log("X finished");

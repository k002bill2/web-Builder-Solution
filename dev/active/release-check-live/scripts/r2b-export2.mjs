// R2b 2차 — r2b-export 1차는 게이트 차단 3(대비 AA·SEO 2)으로 zip 버튼 비활성. 게이트 통과 경로(export-sync-qa/qa-flow2.mjs): A v1 → history.back → 보정값 쓰기 v2 → 3안 v2 → B안 새로 시작 → SEO 입력 → 정적 zip
const task = await taskSpace("release-check-live r2b-2");
const page = task.page("p1");
const log = (k, v) => console.log(k, JSON.stringify(v).slice(0, 1500));
const btn = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim())); if (!b) return "missing"; b.click(); return "clicked"; }, re);
const has = (re, timeout = 30000) => page.waitForFunction((src) => [...document.querySelectorAll("button")].some((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).trim())), re, { timeout });
const ui = () => page.evaluate(() => ({ btn: [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 40) + (b.getAttribute("aria-disabled") === "true" || b.disabled ? "[disabled]" : "")).filter((t) => /내보내기|차단/.test(t)), gate: (document.body.innerText.match(/차단 \d+건[^\n]*/) || [""])[0] }));
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://localhost:4399/catalog");
await has("비교 추가$", 15000);
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) { await page.evaluate((l) => [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || x.textContent).trim() === l)?.click(), `${n} 비교 추가`); await page.waitForTimeout(300); }
await page.evaluate(() => ([...document.querySelectorAll("a,button")].find((a) => (a.getAttribute("aria-label") || a.textContent).trim() === "비교 보드 열기")).click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 10000 });
await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: A 모던 카페 브랜드']");
await page.waitForTimeout(400);
await btn("^프로필 확정");
await has("^3안 만들기"); await btn("^3안 만들기");
await has("^A안 선택$"); await page.click("loc=role:button[name='A안 선택']");
await has("^A안으로 편집 시작$"); await btn("^A안으로 편집 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname), undefined, { timeout: 30000 });
await page.waitForTimeout(1200);
log("A v1 gate", await ui());
await page.evaluate(() => history.back());
await page.waitForFunction(() => /^\/profile\//.test(location.pathname), undefined, { timeout: 15000 });
await has("^보정값 쓰기"); await page.click("loc=role:button[name*='보정값 쓰기']");
await page.waitForTimeout(800);
await page.click("loc=role:button[name='조정 저장 (v2)']");
await page.waitForTimeout(2500);
await has("^3안 만들기 \\(v2\\)$"); await btn("^3안 만들기 \\(v2\\)$");
await has("^B안 선택$"); await page.click("loc=role:button[name='B안 선택']");
await has("^B안으로 편집 시작$"); await btn("^B안으로 편집 시작$");
await page.waitForSelector("dialog[open]", { timeout: 15000 });
log("restart", await btn("^B안으로 새로 시작$"));
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !document.querySelector("dialog[open]"), undefined, { timeout: 30000 });
await page.waitForTimeout(2000);
log("B v2 gate", await ui());
await page.click("loc=role:button[name='첫 차단으로 이동']").catch((e) => log("no gate jump", String(e).slice(0, 120)));
await page.waitForTimeout(500);
await page.fill("loc=role:textbox[name*='제목']", "모던 카페").catch((e) => log("title err", String(e).slice(0, 150)));
await page.fill("loc=role:textbox[name*='설명']", "스페셜티 커피와 디저트를 제공하는 모던 카페입니다.").catch((e) => log("desc err", String(e).slice(0, 150)));
await page.waitForTimeout(2500);
log("gate after SEO", await ui());
log("path", await page.evaluate(() => location.pathname));
const dl = page.waitForEvent("download", { timeout: 60000 });
log("click zip", await btn("^정적 사이트\\(zip\\) 내보내기"));
try { const d = await dl; log("download", { url: d.url().slice(0, 40), suggested: d.suggestedFilename() }); await d.saveAs("/var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T//r2b-zip/export.zip"); log("saved", "/var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T//r2b-zip/export.zip"); }
catch (e) { log("dlErr", String(e)); }
await page.waitForTimeout(1000);
log("after", await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert]")].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 5)));

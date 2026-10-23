// R2a — 05d A안(1.25) 대조. 새 TaskSpace, 앱 안 클릭만, 캔버스 OOPIF 판독은 d05-oopif2 방식(attach flatten:false + sendMessageToTarget)
const task = await taskSpace("release-check-live r2b");
const page = task.page("p1");
const labels = () => page.evaluate(() => [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") || b.textContent).trim()).filter((t) => /비교|전부 선택/.test(t)));
const btn = (re) => page.evaluate((src) => [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click() ?? "missing", re);
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://localhost:4399/catalog");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /비교 (추가|제거|해제)/.test((b.getAttribute("aria-label") || b.textContent).trim())), undefined, { timeout: 15000 });
console.log({ catalogBefore: await labels() });
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) { console.log({ add: n, r: await page.evaluate((l) => { const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || x.textContent).trim() === l); if (!b) return "missing"; b.click(); return "clicked"; }, `${n} 비교 추가`) }); await page.waitForTimeout(300); }
await page.waitForTimeout(300);
console.log({ catalogAfter: await labels() });
console.log({ open: await page.evaluate(() => { const e = [...document.querySelectorAll("a,button")].find((a) => (a.getAttribute("aria-label") || a.textContent).trim() === "비교 보드 열기") || [...document.querySelectorAll("a")].find((a) => a.textContent.trim().startsWith("비교 보드")); e.click(); return e.tagName + ":" + e.textContent.trim().slice(0, 20); }) });
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 10000 });
await page.waitForTimeout(500);
console.log({ compare: await labels() });
await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: A 모던 카페 브랜드']");
await page.waitForTimeout(400);
console.log({ confirm: await btn("^프로필 확정") });
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^3안 만들기/.test(b.textContent.trim())), undefined, { timeout: 15000 });
await btn("^3안 만들기");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim() === "A안 선택"), undefined, { timeout: 20000 });
await page.click("loc=role:button[name='A안 선택']");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "A안으로 편집 시작"), undefined, { timeout: 10000 });
await btn("^A안으로 편집 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.getElementById("field-hero-1-title"), undefined, { timeout: 15000 });
await page.waitForTimeout(2000);
console.log({ path: await page.evaluate(() => location.pathname) });
console.log({ exportBtns: await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => (b.getAttribute("aria-label") || b.textContent).trim()).filter((t) => /내보내기|zip|이미지/.test(t))) });
console.log({ imgsInCanvasHint: await page.evaluate(() => document.body.innerText.match(/이미지[^\n]{0,30}/g)?.slice(0, 6)) });
const dl = page.waitForEvent("download", { timeout: 60000 });
console.log({ click: await btn("^정적 사이트\\(zip\\) 내보내기") });
let d;
try { d = await dl; } catch (e) { console.log({ dlErr: String(e) }); console.log({ body: await page.evaluate(() => document.body.innerText.slice(0, 1500)) }); }
if (d) { console.log({ url: d.url().slice(0, 40), suggested: d.suggestedFilename() }); await d.saveAs("/var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T//r2b-zip/export.zip"); console.log({ saved: "/var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T//r2b-zip/export.zip" }); }
console.log({ after: await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert]")].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 5)) });

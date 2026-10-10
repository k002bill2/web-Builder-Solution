// FIELD-UNDO-1 RESUME-1 — /studio까지 앱 안 클릭으로만 이동(메모리 store 새로고침 함정). `ego-browser nodejs < qb-flow.mjs` · 127.0.0.1:4355(vite preview)
// 경로: 카탈로그 → 모던 카페·프리미엄 헤어살롱 비교 추가 → 비교 보드 B 전부 선택 → 프로필 확정 (v1) → 3안 만들기 (v1) → B안 선택 → B안으로 편집 시작
const task = await taskSpace(globalThis.SPACE ?? "field-undo-1 qb r3");
console.log({ spaceId: task.spaceId });
const page = task.page("p1");
const btn = (re) => page.evaluate((src) => [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click() ?? "missing", re);
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4355/catalog");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim().endsWith("비교 추가")), undefined, { timeout: 15000 });
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 10000 });
await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: B 프리미엄 헤어살롱']");
await page.waitForTimeout(400);
await btn("^프로필 확정");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^3안 만들기/.test(b.textContent.trim())), undefined, { timeout: 15000 });
await btn("^3안 만들기");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim() === "B안 선택"), undefined, { timeout: 20000 });
await page.click("loc=role:button[name='B안 선택']");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "B안으로 편집 시작"), undefined, { timeout: 10000 });
await btn("^B안으로 편집 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.getElementById("field-hero-1-title"), undefined, { timeout: 15000 });
console.log(await page.evaluate(() => location.pathname));

// SAVE-ON-LEAVE Ego — `ego-browser nodejs < qb.mjs` · 127.0.0.1:4361(vite preview). 경로 = field-undo-1/qb-flow.mjs(앱 안 클릭만 — 메모리 store 새로고침 함정)
// 1280: Hero 제목 입력 → 즉시 "프로젝트로 돌아가기" → /projects "편집기 열기" → 마지막 편집 유지 확인 ×3 · 캡처 1장
const OUT = "/Users/younghwankang/orca/workspaces/web-builder-solution/save-on-leave/dev/active/save-on-leave/shots";
const { writeFileSync, mkdirSync } = await import("node:fs");
mkdirSync(OUT, { recursive: true });
const task = await taskSpace("save-on-leave qb");
const page = task.page("p1");
const log = { spaceId: task.spaceId, rounds: [] };
const btn = (re) => page.evaluate((src) => [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click() ?? "missing", re);
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4361/catalog");
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
const inStudio = () => page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.getElementById("field-hero-1-title"), undefined, { timeout: 15000 });
await inStudio();
log.path = await page.evaluate(() => location.pathname);
const base = await page.evaluate(() => document.getElementById("field-hero-1-title").value);
for (let i = 1; i <= 3; i += 1) {
  const value = `${base} 이탈${i}`;
  await page.click("loc=css:#field-hero-1-title");
  await page.fill("loc=css:#field-hero-1-title", value);
  // 디바운스(2초)를 기다리지 않고 바로 떠난다
  const status = await page.evaluate(() => document.querySelector("header")?.textContent);
  await page.click("loc=role:link[name='프로젝트로 돌아가기']");
  await page.waitForFunction(() => location.pathname === "/projects" && [...document.querySelectorAll("a")].some((a) => (a.getAttribute("aria-label") || "").endsWith("편집기 열기")), undefined, { timeout: 15000 });
  await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => (a.getAttribute("aria-label") || "").endsWith("편집기 열기")).click());
  await inStudio();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.getElementById("field-hero-1-title").value);
  log.rounds.push({ i, statusBeforeLeave: status?.includes("저장 전 변경 있음") ? "저장 전 변경 있음" : status, kept: after === value, after });
}
const { w, h } = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
const r = await page.cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
const buf = Buffer.from(r.data, "base64");
const p = `${OUT}/sol-reopen-final-1280.png`;
writeFileSync(p, buf);
log.shot = { p, w, h, bytes: buf.length, png: buf.subarray(1, 4).toString() === "PNG" };
console.log(JSON.stringify(log, null, 1));

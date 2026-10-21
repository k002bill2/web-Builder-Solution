// TYPESCALE-IMPL T4 TS-AC-13 — 앱 안 클릭으로만 /studio 이동(메모리 store 새로고침 함정). `ego-browser nodejs < t4-ego.mjs` · localhost:4399(vite preview)
// 경로: 카탈로그 → 모던 카페·프리미엄 헤어살롱 비교 추가 → 비교 보드 B 전부 선택 → 프로필 확정 → 3안 만들기 → (typeScale ≠ 프로필 안) 선택 → 편집 시작 → 제목 font-size 실측
const task = await taskSpace("typescale-impl t4 ts-ac-13");
const page = task.page("p1");
const btn = (re) => page.evaluate((src) => [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click() ?? "missing", re);
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://localhost:4399/catalog");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim().endsWith("비교 추가")), undefined, { timeout: 15000 });
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 10000 });
await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: B 프리미엄 헤어살롱']");
await page.waitForTimeout(400);
await btn("^프로필 확정");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^3안 만들기/.test(b.textContent.trim())), undefined, { timeout: 15000 });
await btn("^3안 만들기");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim() === "C안 선택"), undefined, { timeout: 20000 });
const cards = await page.evaluate(() => [...document.body.innerText.matchAll(/비율[^\n·]{0,30}/g)].map((m) => m[0]));
console.log({ scaleTexts: cards });
const pick = globalThis.PICK ?? "C";
await page.click(`loc=role:button[name='${pick}안 선택']`);
await page.waitForFunction((p) => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === `${p}안으로 편집 시작`), pick, { timeout: 10000 });
await btn(`^${pick}안으로 편집 시작$`);
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.getElementById("field-hero-1-title"), undefined, { timeout: 15000 });
const m = await page.evaluate(() => {
  const t = document.getElementById("field-hero-1-title");
  const cs = getComputedStyle(t);
  const root = getComputedStyle(document.documentElement);
  const near = t.closest("[style*='--']");
  const vars = near ? [...near.style].filter((k) => k.startsWith("--")).map((k) => `${k}:${near.style.getPropertyValue(k)}`).filter((s) => /scale|size|type|h1|title/i.test(s)) : [];
  const body = t.ownerDocument.querySelector("p");
  return { path: location.pathname, tag: t.tagName, text: t.textContent.slice(0, 40), fontSize: cs.fontSize, lineHeight: cs.lineHeight, bodyFontSize: body ? getComputedStyle(body).fontSize : null, vars };
});
console.log({ pick, measure: m });

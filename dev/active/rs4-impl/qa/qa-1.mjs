// RS4 QA 1 — 앱 안 클릭만. 127.0.0.1:4381 vite preview(d8ff4929)
// 카탈로그 → 비교 2개 → B 전부 선택 → 프로필 확정 → 3안 → A안 선택 → IDB put 실패 주입(QuotaExceededError) → A안으로 편집 시작(create) → 결과 문형
const task = await taskSpace("rs4-impl qa");
console.log({ spaceId: task.spaceId });
const page = task.page("p1");
const btn = (re) => page.evaluate((src) => { const el = [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim())); if (!el) return "missing:" + src; el.click(); return "ok"; }, re);
const aria = (name) => page.evaluate((n) => { const el = [...document.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") || b.textContent).replace(/\s+/g, " ").trim() === n); if (!el) return "missing:" + n; el.click(); return "ok"; }, name);
const has = (re) => page.waitForFunction((src) => [...document.querySelectorAll("button")].some((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).trim())), re, { timeout: 20000 });
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4381/catalog");
// 깨끗한 시작 — 이전 QA의 IDB 제거 후 다시 로드
await page.evaluate(async () => { const dbs = await indexedDB.databases(); await Promise.all(dbs.map((d) => new Promise((r) => { const q = indexedDB.deleteDatabase(d.name); q.onsuccess = q.onerror = q.onblocked = () => r(); }))); });
await page.goto("http://127.0.0.1:4381/catalog");
await has("비교 추가$");
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) console.log(await aria(`${n} 비교 추가`));
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 10000 });
await has("^이 레퍼런스로 전부 선택: B");
console.log(await aria("이 레퍼런스로 전부 선택: B 프리미엄 헤어살롱"));
await page.waitForTimeout(800);
console.log(await btn("^프로필 확정"));
await page.waitForTimeout(3000);
console.log(await page.evaluate(() => ({ path: location.pathname, b: [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") || b.textContent).replace(/\s+/g," ").trim()).filter(Boolean).slice(8, 40) })));
await has("^3안 만들기");
await btn("^3안 만들기");
await has("^A안 선택$");
await aria("A안 선택");
await has("^A안으로 편집 시작$");
// 실패 주입: 이후 IDB put이 동기로 QuotaExceededError
await page.evaluate(() => {
  const orig = IDBObjectStore.prototype.put;
  window.__failPut = true;
  IDBObjectStore.prototype.put = function (...a) {
    if (window.__failPut) throw new DOMException("quota (QA 주입)", "QuotaExceededError");
    return orig.apply(this, a);
  };
});
await btn("^A안으로 편집 시작$");
await page.waitForTimeout(2500);
const out = await page.evaluate(() => ({
  path: location.pathname,
  alerts: [...document.querySelectorAll('[role="alert"],[role="status"],dialog[open]')].map((n) => n.innerText.trim()).filter(Boolean),
  buttons: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter((t) => /편집|다시|저장|확인/.test(t)),
}));
console.log(JSON.stringify(out, null, 1));
await page.screenshot({ path: "/Users/younghwankang/orca/workspaces/web-builder-solution/rs4-impl/dev/active/rs4-impl/qa/shots/01-create-unconfirmed-1280.png" });

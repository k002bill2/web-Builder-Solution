// M4-a-7 Ego E2 — B-M4A-12: 쓰기 탭 p1 내보내기(회귀 0) + 두 번째 탭 p2 내보내기 = 읽기 전용 사유 · "다시 시도" 0 (경로는 M4-a-6 ego-L4.mjs와 같음)
const PORT = 4400;
const task = await taskSpace("m4a7-readonly-e2");
console.log("SPACE", task.spaceId);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("X", k, JSON.stringify(v).slice(0, 1500)); };
const btn = (re) => page.evaluate((src) => void [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click(), re);
const has = (re, timeout = 30000) => page.waitForFunction((src) => [...document.querySelectorAll("button")].some((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).trim())), re, { timeout });
const ui = () => page.evaluate(() => ({ btn: [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 40) + (b.getAttribute("aria-disabled") === "true" || b.disabled ? "[disabled]" : "")).filter((t) => /내보내기|내려받기|차단|통과|다시|zip|HTML/.test(t)), status: [...document.querySelectorAll("[role=status]")].map((s) => s.textContent.trim()).filter(Boolean), alert: [...document.querySelectorAll("[role=alert]")].map((s) => s.textContent.trim()).filter(Boolean) }));
// 덮개 div가 포인터를 가로채는 경우가 있어(E2 1회차) 이름으로 찾아 DOM click — 이름 = aria-label 또는 글자
const press = async (pg, name) => {
  await pg.waitForFunction((n) => [...document.querySelectorAll("button")].some((x) => (x.getAttribute("aria-label") ?? x.textContent).trim() === n || x.textContent.trim() === n), name, { timeout: 30000 });
  await pg.evaluate((n) => [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") ?? x.textContent).trim() === n || x.textContent.trim() === n).click(), name);
};
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto(`http://localhost:${PORT}/catalog`);
log("idb reset", await page.evaluate(async () => { const dbs = await indexedDB.databases(); await Promise.all(dbs.map((d) => new Promise((r) => { const q = indexedDB.deleteDatabase(d.name); q.onsuccess = q.onerror = q.onblocked = () => r(); }))); localStorage.clear(); return dbs.map((d) => d.name); }));
await page.goto(`http://localhost:${PORT}/catalog`);
await has("비교 추가$");
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) await press(page, `${n} 비교 추가`);
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 15000 });
await press(page, "이 레퍼런스로 전부 선택: A 모던 카페 브랜드");
await page.waitForTimeout(400);
await btn("^프로필 확정");
await has("^3안 만들기");
await btn("^3안 만들기");
await has("^A안 선택$");
await press(page, "A안 선택");
await has("^A안으로 편집 시작$");
await btn("^A안으로 편집 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname), undefined, { timeout: 30000 });
await page.waitForTimeout(1200);
await page.evaluate(() => history.back());
await page.waitForFunction(() => /^\/profile\//.test(location.pathname), undefined, { timeout: 15000 });
await has("^보정값 쓰기");
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /보정값 쓰기/.test(b.getAttribute("aria-label") ?? b.textContent)).click());
await page.waitForTimeout(800);
await press(page, "조정 저장 (v2)");
await page.waitForTimeout(2500);
await has("^3안 만들기 \\(v2\\)$");
await btn("^3안 만들기 \\(v2\\)$");
await has("^B안 선택$");
await press(page, "B안 선택");
await has("^B안으로 편집 시작$");
await btn("^B안으로 편집 시작$");
await page.waitForSelector("dialog[open]", { timeout: 15000 });
await btn("^B안으로 새로 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !document.querySelector("dialog[open]"), undefined, { timeout: 30000 });
await page.waitForTimeout(2000);
log("B v2 gate", await ui());
await press(page, "첫 차단으로 이동").catch((e) => log("no gate jump", String(e).slice(0, 120)));
await page.waitForTimeout(500);
await page.fill("#page-info-title", "모던 카페").catch((e) => log("title err", String(e).slice(0, 150)));
await page.fill("#page-info-description", "스페셜티 커피와 디저트를 제공하는 모던 카페입니다.").catch((e) => log("desc err", String(e).slice(0, 150)));
await page.waitForTimeout(2500);
log("gate after SEO", await ui());
log("url", await page.url());
log("sections", await page.evaluate(() => [...document.querySelectorAll("button,[role=option],li")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 40)).filter((t) => /Hero|About|섹션|이미지/.test(t)).slice(0, 30)));

// ---- 계측 ----
const arm = (pg) => pg.evaluate(() => {
  window.__ev = []; window.__err = [];
  window.addEventListener("studio:editor", (e) => window.__ev.push(e.detail));
  window.addEventListener("unhandledrejection", (e) => window.__err.push("rej " + String(e.reason?.message ?? e.reason).slice(0, 200)));
  window.addEventListener("error", (e) => window.__err.push("err " + String(e.message).slice(0, 200)));
});
const stOf = (pg) => pg.evaluate(() => ({
  status: [...document.querySelectorAll("[role=status]")].map((s) => s.textContent.trim()).filter((t) => /만들었/.test(t)).map((t) => t.slice(0, 160)),
  alert: [...document.querySelectorAll("[role=alert]")].map((s) => s.textContent.trim()).filter(Boolean),
  ev: (window.__ev ?? []).filter((e) => /^export|snapshot/.test(e.name)),
  err: window.__err ?? [],
  res: performance.getEntriesByType("resource").filter((e) => /assets\/|render|woff|font/.test(e.name)).filter((e) => /exportFlow-|staticHtml-|ExportAfter-|render|woff|font|zip/i.test(e.name)).map((e) => `${e.name.replace(/^.*\/(assets\/)?/, "")} ${e.responseStatus ?? "?"} ${e.transferSize}`),
}));
const settled = (pg, label) => pg.waitForFunction(() => [...document.querySelectorAll("[role=status]")].some((s) => /만들었습니다/.test(s.textContent)) || [...document.querySelectorAll("[role=alert]")].some((s) => /내보내지 못했습니다/.test(s.textContent)), undefined, { timeout: 60000 }).catch((e) => log(label + " wait", String(e).slice(0, 100)));
const p1 = page;
await arm(p1);
await press(p1, "정적 사이트(zip) 내보내기");
await p1.waitForTimeout(800);
await settled(p1, "p1");
log("p1 writer", await stOf(p1));
const p2 = await task.newPage();
await p2.goto(`http://localhost:${PORT}${new URL(out.url ?? (await p1.url())).pathname}`);
await p2.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "정적 사이트(zip) 내보내기"), undefined, { timeout: 30000 }).catch((e) => log("p2 no zip btn", String(e).slice(0, 100)));
await p2.waitForTimeout(1500);
await arm(p2);
await press(p2, "정적 사이트(zip) 내보내기").catch((e) => log("p2 click", String(e).slice(0, 120)));
await p2.waitForTimeout(800);
await settled(p2, "p2");
log("p2 readonly", await stOf(p2));
log("p2 retry buttons", await p2.evaluate(() => [...document.querySelectorAll("button")].filter((b) => b.textContent.trim() === "다시 시도").length));
await p2.screenshot({ path: "/tmp/m4a7-e2-readonly.png" });
await task.finish({ keep: [] });
console.log("DONE");

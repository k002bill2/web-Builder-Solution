// M4-a-6 Ego R2(L3) — L2 + 계측(편집기 이벤트·오류·리소스 상태) + 미차단 기준선 — QA r01 경로 A(게이트 통과 문서) → 새 Page 복원 진입 + 청크 차단(QA r09 방식) → 2회 실패 → 해제 → 다시 시도
const PORT = 4397;
const task = await taskSpace("m4a6-retry-l3");
console.log("SPACE", task.spaceId);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("X", k, JSON.stringify(v).slice(0, 1500)); };
const btn = (re) => page.evaluate((src) => void [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click(), re);
const has = (re, timeout = 30000) => page.waitForFunction((src) => [...document.querySelectorAll("button")].some((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).trim())), re, { timeout });
const ui = () => page.evaluate(() => ({ btn: [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 40) + (b.getAttribute("aria-disabled") === "true" || b.disabled ? "[disabled]" : "")).filter((t) => /내보내기|내려받기|차단|통과|다시|zip|HTML/.test(t)), status: [...document.querySelectorAll("[role=status]")].map((s) => s.textContent.trim()).filter(Boolean), alert: [...document.querySelectorAll("[role=alert]")].map((s) => s.textContent.trim()).filter(Boolean) }));
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto(`http://localhost:${PORT}/catalog`);
log("idb reset", await page.evaluate(async () => { const dbs = await indexedDB.databases(); await Promise.all(dbs.map((d) => new Promise((r) => { const q = indexedDB.deleteDatabase(d.name); q.onsuccess = q.onerror = q.onblocked = () => r(); }))); localStorage.clear(); return dbs.map((d) => d.name); }));
await page.goto(`http://localhost:${PORT}/catalog`);
await has("비교 추가$");
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 15000 });
await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: A 모던 카페 브랜드']");
await page.waitForTimeout(400);
await btn("^프로필 확정");
await has("^3안 만들기");
await btn("^3안 만들기");
await has("^A안 선택$");
await page.click("loc=role:button[name='A안 선택']");
await has("^A안으로 편집 시작$");
await btn("^A안으로 편집 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname), undefined, { timeout: 30000 });
await page.waitForTimeout(1200);
await page.evaluate(() => history.back());
await page.waitForFunction(() => /^\/profile\//.test(location.pathname), undefined, { timeout: 15000 });
await has("^보정값 쓰기");
await page.click("loc=role:button[name*='보정값 쓰기']");
await page.waitForTimeout(800);
await page.click("loc=role:button[name='조정 저장 (v2)']");
await page.waitForTimeout(2500);
await has("^3안 만들기 \\(v2\\)$");
await btn("^3안 만들기 \\(v2\\)$");
await has("^B안 선택$");
await page.click("loc=role:button[name='B안 선택']");
await has("^B안으로 편집 시작$");
await btn("^B안으로 편집 시작$");
await page.waitForSelector("dialog[open]", { timeout: 15000 });
await btn("^B안으로 새로 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !document.querySelector("dialog[open]"), undefined, { timeout: 30000 });
await page.waitForTimeout(2000);
log("B v2 gate", await ui());
await page.click("loc=role:button[name='첫 차단으로 이동']").catch((e) => log("no gate jump", String(e).slice(0, 120)));
await page.waitForTimeout(500);
await page.fill("#page-info-title", "모던 카페").catch((e) => log("title err", String(e).slice(0, 150)));
await page.fill("#page-info-description", "스페셜티 커피와 디저트를 제공하는 모던 카페입니다.").catch((e) => log("desc err", String(e).slice(0, 150)));
await page.waitForTimeout(2500);
log("gate after SEO", await ui());
log("url", await page.url());
log("sections", await page.evaluate(() => [...document.querySelectorAll("button,[role=option],li")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 40)).filter((t) => /Hero|About|섹션|이미지/.test(t)).slice(0, 30)));

// ---- L2 재현(새 Page 복원 진입 · 차단 먼저) + 계측 ----
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
const p2 = await task.newPage();
await p2.cdp("Network.enable", {});
await p2.cdp("Network.setCacheDisabled", { cacheDisabled: true });
await p2.cdp("Network.setBlockedURLs", { urls: ["*/assets/staticHtml-*", "*/assets/exportFlow-*"] });
await p2.goto(`http://localhost:${PORT}${new URL(out.url ?? (await page.url())).pathname}`);
await p2.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "정적 사이트(zip) 내보내기"), undefined, { timeout: 30000 }).catch(async () => {
  await p2.evaluate(() => [...document.querySelectorAll("[role=tab]")].find((t) => /검사/.test(t.textContent))?.click());
  await p2.waitForTimeout(1500);
});
await p2.waitForTimeout(1500);
await arm(p2);
await p2.click("loc=role:button[name='정적 사이트(zip) 내보내기']", { label: "zip blocked 1" });
await p2.waitForTimeout(800);
await settled(p2, "a1");
log("attempt1 blocked", await stOf(p2));
await p2.click("loc=role:button[name='다시 시도']", { label: "retry blocked 2" });
await p2.waitForTimeout(800);
await settled(p2, "a2");
log("attempt2 blocked", await stOf(p2));
await p2.screenshot({ path: "/tmp/m4a6-l3-reload.png" });
await p2.cdp("Network.setBlockedURLs", { urls: [] });
await p2.cdp("Network.setCacheDisabled", { cacheDisabled: false });
let t0 = Date.now();
await p2.click("loc=role:button[name='다시 시도']", { label: "retry unblocked 3" });
await p2.waitForTimeout(800);
await settled(p2, "a3");
log("attempt3 ms", Date.now() - t0);
log("attempt3 unblocked", await stOf(p2));
await p2.screenshot({ path: "/tmp/m4a6-l3-attempt3.png" });
if (!(await stOf(p2)).status.length) {
  t0 = Date.now();
  await p2.click("loc=role:button[name='다시 시도']", { label: "retry unblocked 4" }).catch((e) => log("no retry4", String(e).slice(0, 100)));
  await p2.waitForTimeout(800);
  await settled(p2, "a4");
  log("attempt4 ms", Date.now() - t0);
  log("attempt4 unblocked", await stOf(p2));
}
// ---- 기준선: 한 번도 막지 않은 p1에서 zip 내보내기 ----
await arm(page);
t0 = Date.now();
await page.click("loc=role:button[name='정적 사이트(zip) 내보내기']", { label: "zip baseline p1" }).catch((e) => log("p1 click", String(e).slice(0, 120)));
await page.waitForTimeout(800);
await settled(page, "p1");
log("p1 baseline ms", Date.now() - t0);
log("p1 baseline", await stOf(page));
await task.finish({ keep: [] });
console.log("DONE");

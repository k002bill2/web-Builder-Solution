// RS4 QA 9 — AC-09 원인 가르기: p1 = 앱 R-E4(대화상자 열어 둔 채, 합성 이벤트로 리스너 확인) · p2 = 대조(무조건 beforeunload 리스너만 건 같은 출처 페이지)
const task = await takeOverTaskSpace(2);
const page = task.page("p1");
console.log("== 사용자 새로고침 뒤", JSON.stringify(await page.evaluate(async () => {
  const db = await new Promise((r) => { const q = indexedDB.open("design-studio"); q.onsuccess = () => r(q.result); });
  const d = await new Promise((r) => { const q = db.transaction("docs").objectStore("docs").getAll(); q.onsuccess = () => r(q.result); });
  db.close();
  return { nav: performance.getEntriesByType("navigation")[0]?.type, path: location.pathname, docs: d.map((x) => `${x.id}:${x.data.doc.candidateId}v${x.data.doc.profileVersion}`) };
})));
const has = (re) => page.waitForFunction((src) => [...document.querySelectorAll("button")].some((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).replace(/\s+/g, " ").trim())), re, { timeout: 20000 });
const btn = (re, sc = "") => page.evaluate(([src, s]) => { const el = [...document.querySelectorAll(`${s} button`)].find((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).replace(/\s+/g, " ").trim())); if (!el) return "missing:" + src; el.click(); return "ok"; }, [re, sc]);
await has("^B안 선택$");
await btn("^B안 선택$");
await has("^B안으로 편집 시작$");
await page.evaluate(() => { const orig = IDBObjectStore.prototype.put; window.__failPut = true; IDBObjectStore.prototype.put = function (...a) { if (window.__failPut) throw new DOMException("quota (QA 주입)", "QuotaExceededError"); return orig.apply(this, a); }; });
await btn("^B안으로 편집 시작$");
await page.waitForSelector("dialog[open]", { timeout: 15000 });
await btn("^B안으로 새로 시작$", "dialog[open]");
await page.waitForFunction(() => /새로 시작했지만 브라우저에 저장됐는지 확인하지 못했습니다/.test(document.body.innerText), undefined, { timeout: 10000 });
console.log("== 앱 합성 beforeunload", JSON.stringify(await page.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return { defaultPrevented: e.defaultPrevented }; })));
const pages = await task.pages();
const c = pages.find((p) => p.label === "p2") ?? (await task.newPage());
await c.goto("http://127.0.0.1:4381/catalog");
await c.evaluate(() => { window.addEventListener("beforeunload", (e) => { e.preventDefault(); e.returnValue = ""; }); document.title = "대조 — 항상 경고"; });
console.log({ app: page.label, control: c.label });
await task.handOff();
console.log("handed off");

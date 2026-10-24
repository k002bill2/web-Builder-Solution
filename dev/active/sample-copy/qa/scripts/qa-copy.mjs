// SAMPLE-COPY QA — 게이트 통과 경로(sample-bundle qa-sample 선례) → 내보내기 버튼 문구·대표 주소 도움말·zip 결과 줄·금지어 0
const PORT = 4399;
const D = "/Users/younghwankang/orca/workspaces/web-builder-solution/sample-copy/dev/active/sample-copy/qa";
const ZIPDIR = process.env.ZIPDIR;
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace("sample-copy qa-1");
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("X", k, JSON.stringify(v).slice(0, 1500)); };
const btn = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim())); if (!b) return "missing"; b.click(); return "clicked"; }, re);
const has = (re, timeout = 30000) => page.waitForFunction((src) => [...document.querySelectorAll("button")].some((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).trim())), re, { timeout });
const banned = () => page.evaluate(() => { const t = document.body.innerText; return Object.fromEntries(["발행", "정적 사이트", "게시"].map((w) => [w, (t.match(new RegExp(w, "g")) || []).length])); });
try {
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto(`http://localhost:${PORT}/catalog`);
log("idb reset", await page.evaluate(async () => { const dbs = await indexedDB.databases(); await Promise.all(dbs.map((d) => new Promise((r) => { const q = indexedDB.deleteDatabase(d.name); q.onsuccess = q.onerror = q.onblocked = () => r(); }))); localStorage.clear(); return dbs.map((d) => d.name); }));
await page.goto(`http://localhost:${PORT}/catalog`);
await page.cdp("Runtime.enable", {});
await page.cdp("Log.enable", {});
await page.events();
await has("비교 추가$");
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 15000 });
log("compare footer warning", await page.evaluate(() => (document.body.innerText.match(/[^\n]*사업자정보[^\n]*/g) || [])));
await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: A 모던 카페 브랜드']");
await page.waitForTimeout(400);
log("compare footer warning after select", await page.evaluate(() => (document.body.innerText.match(/[^\n]*사업자정보[^\n]*/g) || [])));
await btn("^프로필 확정");
await has("^3안 만들기"); await btn("^3안 만들기");
await has("^A안 선택$"); await page.click("loc=role:button[name='A안 선택']");
await has("^A안으로 편집 시작$"); await btn("^A안으로 편집 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname), undefined, { timeout: 30000 });
await page.waitForTimeout(1200);
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
await btn("^B안으로 새로 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !document.querySelector("dialog[open]"), undefined, { timeout: 30000 });
await page.waitForTimeout(2000);
log("path", await page.evaluate(() => location.pathname));
await page.click("loc=role:button[name='첫 차단으로 이동']").catch((e) => log("no gate jump", String(e).slice(0, 120)));
await page.waitForTimeout(500);
await page.fill("loc=role:textbox[name*='제목']", "모던 카페").catch((e) => log("title err", String(e).slice(0, 150)));
await page.fill("loc=role:textbox[name*='설명']", "스페셜티 커피와 디저트를 제공하는 모던 카페입니다.").catch((e) => log("desc err", String(e).slice(0, 150)));
await page.waitForTimeout(2500);
// 2. 대표 주소 도움말
log("canonical help", await page.evaluate(() => { const p = [...document.querySelectorAll("p")].find((p) => p.textContent.trim() === "대표 주소(canonical)"); if (!p) return "missing"; p.scrollIntoView({ block: "center" }); return [...p.parentElement.querySelectorAll("p")].map((x) => x.textContent.trim()); }));
await page.waitForTimeout(400);
await page.screenshot({ path: `${D}/screens/02-canonical-help-1280.png` });
// 1. 검사 · 내보내기 탭
log("open gate tab", await page.evaluate(() => { const b = [...document.querySelectorAll("button,[role=tab]")].find((b) => /검사 · 내보내기/.test((b.getAttribute("aria-label") || b.textContent).trim())); if (!b) return "missing"; b.click(); return "clicked"; }));
await page.waitForTimeout(1200);
const order = await page.evaluate(() => { const want = /(PNG|샘플|HTML|React|zip|내려받기|내보내기)/; const hits = [...document.querySelectorAll("button")].filter((b) => want.test(b.textContent.trim()) && b.getBoundingClientRect().height > 0); hits[0]?.scrollIntoView({ block: "center" }); return hits.map((b) => { const rc = b.getBoundingClientRect(); return { t: b.textContent.trim(), top: Math.round(rc.top + scrollY), left: Math.round(rc.left), disabled: b.getAttribute("aria-disabled") === "true" || b.disabled }; }); });
log("export buttons (DOM)", order);
log("export order (by top,left)", [...order].sort((a, b) => a.top - b.top || a.left - b.left).map((o) => o.t));
await page.waitForTimeout(500);
await page.screenshot({ path: `${D}/screens/01-export-buttons-1280.png` });
// 4a. 금지어 — 내보내기 열린 상태
log("banned (export open)", await banned());
// 3. HTML 샘플 묶음(zip)
const dl = page.waitForEvent("download", { timeout: 90000 });
log("click zip", await btn("^HTML 샘플 묶음\\(zip\\) 내보내기$"));
let saved = null;
try { const d = await dl; await d.saveAs(`${ZIPDIR}/${d.suggestedFilename()}`); saved = { via: "event", name: d.suggestedFilename() }; }
catch (e) { log("dlErr", String(e).slice(0, 200)); }
await page.waitForTimeout(1500);
log("result line", await page.evaluate(() => (document.body.innerText.match(/[^\n]*HTML 샘플 묶음[^\n]*/g) || [])));
await page.screenshot({ path: `${D}/screens/03-zip-result-1280.png` });
if (!saved) {
  const r = await page.evaluate(async () => { const a = [...document.querySelectorAll("a")].find((e) => e.textContent.trim() === "내려받기" && e.href.startsWith("blob:")); if (!a) return null; const b = await (await fetch(a.href)).arrayBuffer(); let s = ""; const u = new Uint8Array(b); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return { name: a.getAttribute("download"), b64: btoa(s) }; });
  if (r) { await writeFile(`${ZIPDIR}/${r.name}`, Buffer.from(r.b64, "base64")); saved = { via: "fallback blob link", name: r.name }; }
}
log("zip saved", saved);
log("banned (after zip)", await banned());
// 4b. 스냅샷 대화상자
log("open snapshot", await btn("^스냅샷$"));
await page.waitForSelector("dialog[open]", { timeout: 15000 }).catch((e) => log("snap dialog err", String(e).slice(0, 150)));
await page.waitForTimeout(800);
log("snapshot dialog open", await page.evaluate(() => !!document.querySelector("dialog[open]")));
log("banned (snapshot open)", await banned());
await page.screenshot({ path: `${D}/screens/04-snapshot-dialog-1280.png` });
await page.keyboard?.press?.("Escape").catch(() => {});
} catch (e) { log("FATAL", String(e).slice(0, 400)); await page.screenshot({ path: `${D}/screens/zz-fatal.png` }).catch(() => {}); }
const ev = await page.events();
log("console errors", ev.filter((e) => (e.method === "Runtime.consoleAPICalled" && e.params.type === "error") || e.method === "Runtime.exceptionThrown" || (e.method === "Log.entryAdded" && e.params.entry.level === "error")).map((e) => JSON.stringify(e.params).slice(0, 300)));
await writeFile(`${D}/logs/qa-copy.json`, JSON.stringify(out, null, 1));

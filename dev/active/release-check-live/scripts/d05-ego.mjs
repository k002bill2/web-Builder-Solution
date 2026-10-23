// B-M2B-05d TS-AC-13 — 프로필 1.25(A 모던 카페 전부 선택) → 3안 → PICK안 편집 시작(앱 안 클릭만) → render.html OOPIF에 Target.attachToTarget(flatten) → h1 font-size·--site-t1
const PICK = globalThis.PICK ?? process.env.PICK ?? "C";
const task = await taskSpace("release-check-live 05d");
const page = task.page("p1");
const btn = (re) => page.evaluate((src) => [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click() ?? "missing", re);
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://localhost:4399/catalog");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim().endsWith("비교 추가")), undefined, { timeout: 15000 });
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) if (await page.evaluate((l) => [...document.querySelectorAll("button")].some((b) => b.getAttribute("aria-label") === l), `${n} 비교 추가`)) await page.click(`loc=role:button[name='${n} 비교 추가']`); // 비교 목록 유지(재실행 토글 방지)
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 10000 });
console.log({ compareButtons: await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => (b.getAttribute("aria-label") || b.textContent).trim()).filter((t) => /전부 선택/.test(t))) });
await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: A 모던 카페 브랜드']");
await page.waitForTimeout(400);
const profileText = await page.evaluate(() => [...document.body.innerText.matchAll(/(비율|scale)[^\n]{0,30}/gi)].map((m) => m[0]).slice(0, 8));
console.log({ profileText });
console.log({ confirm: await btn("^프로필 확정") });
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^3안 만들기/.test(b.textContent.trim())), undefined, { timeout: 15000 });
await btn("^3안 만들기");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim() === "C안 선택"), undefined, { timeout: 20000 });
const cards = await page.evaluate(() => [...document.body.innerText.matchAll(/[^\n]{0,20}비율[^\n·]{0,30}/g)].map((m) => m[0]));
console.log({ PICK, scaleTexts: cards });
await page.click(`loc=role:button[name='${PICK}안 선택']`);
await page.waitForFunction((p) => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === `${p}안으로 편집 시작`), PICK, { timeout: 10000 });
await btn(`^${PICK}안으로 편집 시작$`);
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.getElementById("field-hero-1-title"), undefined, { timeout: 15000 });
await page.waitForTimeout(2000);
console.log({ path: await page.evaluate(() => location.pathname) });
const expr = `(() => { const r = document.querySelector("[data-site-root]") || document.documentElement; const rs = getComputedStyle(r); const v = (k) => rs.getPropertyValue(k).trim();
  const hs = [...document.querySelectorAll("h1,h2")].slice(0, 3).map((h) => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 30), fontSize: getComputedStyle(h).fontSize }));
  return JSON.stringify({ url: location.pathname, w: innerWidth, rootFs: getComputedStyle(document.documentElement).fontSize, rootVarT1: getComputedStyle(document.documentElement).getPropertyValue("--site-t1").trim(), t1: v("--site-t1"), t2: v("--site-t2"), t3: v("--site-t3"), t4: v("--site-t4"), t5: v("--site-t5"), headings: hs }); })()`;
const out = { attempts: [] };
try {
  const { targetInfos } = await task.cdp("Target.getTargets", {});
  out.targets = targetInfos.map((t) => ({ type: t.type, url: t.url.slice(0, 60), id: t.targetId.slice(0, 8) }));
  const rt = targetInfos.filter((t) => /render\.html/.test(t.url));
  for (const t of rt) {
    const { sessionId } = await task.cdp("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    out.attempts.push({ step: "attach", sessionId: sessionId?.slice(0, 8) });
    for (const opt of [{ sessionId }, { session: sessionId }]) {
      try { const r = await task.cdp("Runtime.evaluate", { expression: expr, returnByValue: true }, opt); out.attempts.push({ opt: Object.keys(opt)[0], value: r.result?.value ?? r }); if (r.result?.value && JSON.parse(r.result.value).url?.includes("render")) break; }
      catch (e) { out.attempts.push({ opt: Object.keys(opt)[0], err: String(e).slice(0, 200) }); }
    }
  }
} catch (e) { out.attempts.push({ step: "targets", err: String(e).slice(0, 300) }); }
console.log(JSON.stringify(out, null, 1));

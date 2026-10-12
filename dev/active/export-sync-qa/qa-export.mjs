// EXPORT-SYNC-QA — preview 4367 정적 HTML 성공 · dev 4369 환경 안내. 앱 안 클릭만(field-undo-1/qb-flow.mjs 경로) + SEO 입력(게이트 해소, m2b-6-qa/s4-export.mjs)
const D = "/Users/younghwankang/orca/workspaces/web-builder-solution/export-sync-qa/dev/active/export-sync-qa";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(globalThis.SPACE ?? "export-sync-qa");
console.log({ spaceId: task.spaceId });
const out = {};
const log = (k, v) => { out[k] = v; console.log("X", k, JSON.stringify(v).slice(0, 1200)); };
async function run(pid, port) {
  const page = task.page(pid);
  const btn = (re) => page.evaluate((src) => [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click() ?? "missing", re);
  const ui = () => page.evaluate(() => ({ btn: [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 40) + (b.getAttribute("aria-disabled") === "true" || b.disabled ? "[disabled]" : "")).filter((t) => /내보내기|내려받기|차단|다시/.test(t)), status: [...document.querySelectorAll("[role=status]")].map((s) => s.textContent.trim()).filter(Boolean), alert: [...document.querySelectorAll("[role=alert]")].map((s) => s.textContent.trim()).filter(Boolean) }));
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.goto(`http://127.0.0.1:${port}/catalog`);
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim().endsWith("비교 추가")), undefined, { timeout: 30000 });
  for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
  await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
  await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 15000 });
  await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: B 프리미엄 헤어살롱']");
  await page.waitForTimeout(400);
  await btn("^프로필 확정");
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^3안 만들기/.test(b.textContent.trim())), undefined, { timeout: 20000 });
  await btn("^3안 만들기");
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim() === "B안 선택"), undefined, { timeout: 30000 });
  await page.click("loc=role:button[name='B안 선택']");
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "B안으로 편집 시작"), undefined, { timeout: 15000 });
  await btn("^B안으로 편집 시작$");
  await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.getElementById("field-hero-1-title"), undefined, { timeout: 30000 });
  log(`${port} path`, await page.evaluate(() => location.pathname));
  log(`${port} gate before`, await ui());
  await page.click("loc=role:button[name='첫 차단으로 이동']").catch((e) => log(`${port} no gate jump`, String(e).slice(0, 120)));
  await page.fill("loc=role:textbox[name*='제목']", "프리미엄 헤어살롱").catch((e) => log(`${port} title err`, String(e).slice(0, 150)));
  await page.fill("loc=role:textbox[name*='설명']", "프리미엄 헤어 스타일링과 컬러 시술을 제공하는 살롱입니다.").catch((e) => log(`${port} desc err`, String(e).slice(0, 150)));
  await page.waitForTimeout(2500);
  log(`${port} gate after SEO`, await ui());
  const t0 = Date.now();
  await page.click("loc=role:button[name='정적 HTML 내보내기']").catch((e) => log(`${port} html click err`, String(e).slice(0, 150)));
  let last;
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(500); last = await ui(); if (last.alert.length || last.btn.some((b) => /내려받기/.test(b) && /HTML|html/.test(b))) break; }
  log(`${port} after html (${Date.now() - t0}ms)`, last);
  return page;
}
const p1 = await run("p1", 4367);
// preview: 내려받기 링크가 있으면 내려받아 파일 크기 기록
const after = out["4367 after html" + Object.keys(out).find((k) => k.startsWith("4367 after html")).slice(15)];
const linkName = after?.btn.find((b) => /내려받기/.test(b) && /HTML|html/.test(b));
if (linkName) {
  const dl = p1.waitForEvent("download", { timeout: 30000 });
  await p1.click(`loc=role:link[name='${linkName}']`).catch(() => p1.click(`loc=role:button[name='${linkName}']`)).catch((e) => log("dl click err", String(e).slice(0, 150)));
  try { const d = await dl; await d.saveAs(`${D}/exports/site.html`); log("html download", { name: d.suggestedFilename() }); } catch (e) { log("html download FAIL", String(e).slice(0, 150)); }
}
await run("p2", 4369);
await writeFile(`${D}/logs/qa-export.json`, JSON.stringify(out, null, 1));

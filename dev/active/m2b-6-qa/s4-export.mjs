// S4 E2E 내보내기(앱 안 조작) — SEO 메타 입력(게이트 해소) → 정적 HTML 내보내기 → 내려받기 · PNG 내려받기 3회(소요 시간 분포, B9 여유)
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-6-qa/dev/active/m2b-6-qa";
const { writeFile, readFile } = await import("node:fs/promises");
const task = await taskSpace(68);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("X", k, JSON.stringify(v).slice(0, 900)); };
const ui = () => page.evaluate(() => ({ btn: [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 30)).filter((t) => /내보내기|내려받기|차단|다시/.test(t)), st: [...document.querySelectorAll("[role=status],[role=alert]")].map((s) => s.textContent.trim().slice(0, 80)).filter(Boolean) }));
if (!(await page.evaluate(() => !!document.activeElement && document.activeElement.labels?.[0]?.textContent.includes("제목")))) await page.click("loc=role:button[name='첫 차단으로 이동']").catch(() => {});
await page.fill("loc=role:textbox[name*='제목']", "부티크 법률사무소");
await page.fill("loc=role:textbox[name*='설명']", "기업·개인 법률 상담을 제공하는 부티크 법률사무소입니다.");
await page.waitForTimeout(2500);
log("gate after SEO", await ui());
// 정적 HTML
let t0 = Date.now();
const dl1 = page.waitForEvent("download", { timeout: 30000 });
await page.click("loc=role:button[name='정적 HTML 내보내기']");
await page.waitForTimeout(500);
const after = await ui(); log("after html click", after);
const linkName = after.btn.find((b) => /내려받기/.test(b) && /HTML|html/.test(b));
if (linkName) await page.click(`loc=role:link[name='${linkName}']`).catch(() => page.click(`loc=role:button[name='${linkName}']`)).catch((e) => log("dl click err", String(e).slice(0, 150)));
try { const d = await dl1; await d.saveAs(`${DIR}/exports/site.html`); log("html download", { ms: Date.now() - t0, name: d.suggestedFilename() }); } catch (e) { log("html download FAIL", String(e).slice(0, 150)); log("ui", await ui()); }
// PNG 3회
for (let i = 1; i <= 3; i++) {
  t0 = Date.now();
  const dl = page.waitForEvent("download", { timeout: 30000 });
  await page.click("loc=role:button[name='PNG 내려받기']").catch((e) => log("png click err", String(e).slice(0, 150)));
  try { const d = await dl; await d.saveAs(`${DIR}/exports/site-${i}.png`); log(`png ${i}`, { ms: Date.now() - t0, name: d.suggestedFilename() }); } catch (e) { log(`png ${i} FAIL`, String(e).slice(0, 150)); log("ui", await ui()); }
  await page.waitForTimeout(1000);
}
log("final ui", await ui());
await writeFile(`${DIR}/logs/s4-export.json`, JSON.stringify(out, null, 1));

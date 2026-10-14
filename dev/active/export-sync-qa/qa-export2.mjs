// EXPORT-SYNC-QA r2 — 게이트 통과 문서에서 정적 HTML 내보내기 → status/alert DOM 원문 · 내려받기
const PORT = globalThis.PORT, PID = globalThis.PID || "p1";
const D = "/Users/younghwankang/orca/workspaces/web-builder-solution/export-sync-qa/dev/active/export-sync-qa";
const { writeFile, stat } = await import("node:fs/promises");
const task = await taskSpace(16);
const page = task.page(PID);
const out = { port: PORT };
const log = (k, v) => { out[k] = v; console.log("X", k, JSON.stringify(v).slice(0, 2000)); };
const dom = () => page.evaluate(() => ({ btn: [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 40) + (b.getAttribute("aria-disabled") === "true" || b.disabled ? "[disabled]" : "")).filter((t) => /내보내기|내려받기|다시/.test(t)), status: [...document.querySelectorAll("[role=status]")].map((s) => s.outerHTML.slice(0, 600)).filter((h) => /내보내|HTML|스타일시트|preview|개발 서버|내려받/.test(h)), alert: [...document.querySelectorAll("[role=alert]")].map((s) => s.outerHTML.slice(0, 800)).filter((h) => !/<p role="alert" class="sr-only"><\/p>/.test(h)) }));
log("before", await dom());
const t0 = Date.now();
await page.click("loc=role:button[name='정적 HTML 내보내기']");
let last;
for (let i = 0; i < 60; i++) { await page.waitForTimeout(500); last = await dom(); if (last.alert.length || last.btn.some((b) => /내려받기/.test(b) && /HTML|html/.test(b))) break; }
log(`after click +${Date.now() - t0}ms`, last);
const shotP = `${D}/shots/export-${PORT}.png`; await page.screenshot({ path: shotP }); log("shot", `${shotP} ${(await stat(shotP)).size}B`);
const linkName = last.btn.find((b) => /내려받기/.test(b) && /HTML|html/.test(b))?.replace("[disabled]", "");
if (linkName) {
  const dl = page.waitForEvent("download", { timeout: 30000 });
  await page.click(`loc=role:link[name='${linkName}']`).catch(() => page.click(`loc=role:button[name='${linkName}']`)).catch((e) => log("dl click err", String(e).slice(0, 150)));
  try { const d = await dl; const p = `${D}/exports/site-${PORT}.html`; await d.saveAs(p); log("download", { name: d.suggestedFilename(), bytes: (await stat(p)).size }); } catch (e) { log("download FAIL", String(e).slice(0, 200)); }
}
await writeFile(`${D}/logs/qa-export2-${PORT}.json`, JSON.stringify(out, null, 1));

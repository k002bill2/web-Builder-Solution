// 다운로드 재시도 — 결과 줄의 폴백 "내려받기"(blob 링크) · 이벤트 실패 시 blob을 페이지에서 직접 읽어 저장
const D = "/Users/younghwankang/orca/workspaces/web-builder-solution/sample-bundle/dev/active/sample-bundle/qa";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace("sample-bundle qa-1");
const page = task.page("p1");
const log = (k, v) => console.log("X", k, JSON.stringify(v).slice(0, 1500));
log("fallback el", await page.evaluate(() => [...document.querySelectorAll("a,button")].filter((e) => e.textContent.trim() === "내려받기").map((e) => ({ tag: e.tagName, href: (e.getAttribute("href") || "").slice(0, 60), download: e.getAttribute("download") }))));
const dl = page.waitForEvent("download", { timeout: 30000 });
log("click", await page.evaluate(() => { const e = [...document.querySelectorAll("a,button")].find((e) => e.textContent.trim() === "내려받기"); e.click(); return e.tagName; }));
try { const d = await dl; log("download", d.suggestedFilename()); await d.saveAs(`${D}/download/${d.suggestedFilename()}`); log("saved", "event"); }
catch (e) {
  log("dlErr", String(e).slice(0, 200));
  const r = await page.evaluate(async () => { const a = [...document.querySelectorAll("a")].find((e) => e.textContent.trim() === "내려받기" && e.href.startsWith("blob:")); if (!a) return null; const b = await (await fetch(a.href)).arrayBuffer(); let s = ""; const u = new Uint8Array(b); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return { name: a.getAttribute("download"), b64: btoa(s) }; });
  if (r) { await writeFile(`${D}/download/${r.name}`, Buffer.from(r.b64, "base64")); log("saved", { via: "blob fetch", name: r.name }); } else log("no blob link", null);
}

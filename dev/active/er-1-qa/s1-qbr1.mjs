// ER-1 QB-R1 — 게이트 통과 문서(경로 A) 정적 HTML·PNG 내보내기 + 캔버스/정적HTML 렌더 캡처. 앱 안 클릭만.
const D = "/Users/younghwankang/orca/workspaces/web-builder-solution/er-1-qa/dev/active/er-1-qa/";
const TAG = process.env.TAG || "r1";
const { readFile } = await import("node:fs/promises");
const task = await taskSpace(82);
const page = task.page("p1");
await page.waitForFunction(() => !document.body.innerText.includes("미리보기를 그리는 중"), undefined, { timeout: 20000 });
await page.evaluate(() => { window.__ev = []; if (!window.__evOn) { window.__evOn = 1; window.addEventListener("studio:editor", (e) => window.__ev.push(JSON.stringify(e.detail))); } });
const status = () => page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert]")].map(e => e.innerText.trim()).filter(Boolean).join(" ## "));
console.log("PATH", await page.evaluate(() => location.pathname), "GATE", await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf("품질 게이트"); return t.slice(i, i + 20).replace(/\n/g, " "); }));
console.log("F2", await page.evaluate(() => (document.body.innerText.match(/[^\n]*시안 \(F2\)[^\n]*/g) || []).join(" / ")));
// 정적 HTML
let dl = page.waitForEvent("download", { timeout: 30000 });
await page.click("loc=role:button[name*=\"정적 HTML 내보내기\"]", { label: "정적 HTML " + TAG });
let d = await dl.catch((e) => { console.log("NO HTML DOWNLOAD", e.message); return null; });
let htmlPath = null;
if (d) { console.log("HTML FILE", d.suggestedFilename()); htmlPath = `${D}exports/${TAG}-${d.suggestedFilename()}`; await d.saveAs(htmlPath); }
await page.waitForTimeout(1500);
console.log("STATUS after HTML:", await status());
// PNG
dl = page.waitForEvent("download", { timeout: 30000 });
await page.click("loc=role:button[name*=\"PNG 내려받기\"]", { label: "PNG " + TAG });
d = await dl.catch((e) => { console.log("NO PNG DOWNLOAD", e.message); return null; });
if (d) { console.log("PNG FILE", d.suggestedFilename()); await d.saveAs(`${D}exports/${TAG}-${d.suggestedFilename()}`); }
await page.waitForTimeout(1500);
console.log("STATUS after PNG:", await status());
console.log("EVENTS", JSON.stringify(await page.evaluate(() => window.__ev)));
await page.evaluate(() => [...document.querySelectorAll("h2,h3")].find(h => h.textContent.trim() === "내보내기")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(400);
await page.screenshot({ path: `${D}shots/${TAG}-export-notice.png` });
// 캔버스(iframe) 문서 높이·섹션 구조
console.log("CANVAS", await page.evaluate(() => { const f = document.querySelector("iframe"); const doc = f?.contentDocument; if (!doc) return "no iframe doc"; return JSON.stringify({ iframeW: f.clientWidth, docW: doc.documentElement.scrollWidth, docH: doc.documentElement.scrollHeight, sections: [...doc.querySelectorAll("body > * section, header, footer, section")].map(s => (s.tagName + ":" + (s.getAttribute("data-section-type") || s.className || "").toString().slice(0, 40))).slice(0, 20), imgs: doc.images.length }); }));
// 정적 HTML을 p2(빈 페이지)에 document.write — goto 없음
if (htmlPath && htmlPath.endsWith(".html")) {
  const html = await readFile(htmlPath, "utf8");
  console.log("HTML bytes", html.length, "img tags", (html.match(/<img/g) || []).length, "data:image", (html.match(/data:image/g) || []).length, "ext http", (html.match(/https?:\/\//g) || []).length);
  const p2 = await task.newPage();
  await p2.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await p2.evaluate((h) => { document.open(); document.write(h); document.close(); }, html);
  await p2.waitForTimeout(2500);
  console.log("STATIC", JSON.stringify(await p2.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, fonts: [...document.fonts].filter(f => f.status === "loaded").map(f => f.family).slice(0, 6), sections: [...document.querySelectorAll("section, header, footer")].map(s => s.tagName + ":" + (s.getAttribute("data-section-type") || s.className || "").toString().slice(0, 40)).slice(0, 20) }))));
  await p2.screenshot({ path: `${D}shots/${TAG}-static-render.png`, fullPage: true });
  await p2.close();
}

// M2B-6 S5 이관 항목(정적 사본 127.0.0.1:4339) — 모션 L2 재생·1초 최종·감소 설정 / header 4변형 Esc 직후 visibility / CTA Tab 링 / 예약 비활성 외형 / grid 타일 A
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-6-qa/dev/active/m2b-6-qa";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(68);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("C", k, JSON.stringify(v).slice(0, 900)); };
const size = (w, h) => page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
await size(1280, 900);

// (a) L2 문서 정적 사본 — render.html(4337)에서 s1과 같은 제품 경로(serialize → buildStaticHtml)
await page.goto("http://127.0.0.1:4337/render.html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 20000 });
await page.evaluate(async () => {
  const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
  const { buildStaticHtml } = await import("/src/features/studio/staticHtml/staticMarkup.ts");
  const { stripFontFaces } = await import("/src/features/studio/staticHtml/siteFontEmbed.ts");
  const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
  window.__msgs = []; window.addEventListener("message", (e) => window.__msgs.push(e.data));
  const L2 = { motion: "L2" };
  const doc = withSections(sampleDoc(), [section("header", "sticky-hamburger", "m-h", L2), section("hero", "grid", "m-hero", { ...L2, tone: "alt" }), section("services", "cards-3", "m-s", L2), section("statistics", "stats-3", "m-st", L2), section("about", "story", "m-a", L2), section("footer", "minimal", "m-f")]);
  window.__q = { buildStaticHtml, stripFontFaces, doc };
  window.postMessage({ type: "render", doc, kitTokens: base }, "*");
});
await page.waitForFunction(() => window.__msgs.some((m) => m?.type === "rects"), undefined, { timeout: 10000 });
await page.waitForTimeout(300);
await page.evaluate(() => { window.__msgs = []; window.postMessage({ type: "serialize" }, "*"); });
await page.waitForFunction(() => window.__msgs.some((m) => m?.type === "html"), undefined, { timeout: 8000 });
const l2 = await page.evaluate(() => {
  const css = window.__q.stripFontFaces([...document.querySelectorAll("style")].map((s) => s.textContent).join("\n"));
  const markup = window.__msgs.find((m) => m?.type === "html").markup;
  return window.__q.buildStaticHtml({ markup, css, title: "qa", description: "qa" }).replace("<style>", '<link rel="stylesheet" href="_fonts.css"><style>');
});
await writeFile(`${DIR}/static/_motion-L2.html`, l2);
log("L2 data-motion", [...l2.matchAll(/data-motion="(L\d)"/g)].map((m) => m[1]));

// (b) 재생 표본: 0·200·500·1000·1200ms 시점 애니메이션 대상 opacity·transform
const SAMPLE = async () => page.evaluate(async () => {
  const t0 = performance.timeOrigin; const rows = {};
  const snap = () => { const anims = document.getAnimations(); return { running: anims.filter((a) => a.playState === "running").length, total: anims.length, targets: anims.slice(0, 12).map((a) => { const el = a.effect.target; const c = getComputedStyle(el); return `${el.className.split(" ")[0]}|${a.animationName}|op${(+c.opacity).toFixed(2)}|${c.transform === "none" ? "none" : c.transform.slice(0, 40)}`; }) }; };
  for (const at of [0, 200, 500, 1000, 1200]) { while (performance.now() < at) await new Promise((r) => requestAnimationFrame(r)); rows[at] = { now: Math.round(performance.now()), ...snap() }; }
  return rows;
});
for (const [w, h] of [[1280, 900], [390, 844]]) {
  await size(w, h);
  await page.goto("http://127.0.0.1:4339/_motion-L2.html");
  log(`motion L2 ${w}`, await SAMPLE());
  log(`motion L2 ${w} overflowX`, await page.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth));
}
await page.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await size(1280, 900);
await page.goto("http://127.0.0.1:4339/_motion-L2.html");
log("motion L2 reduce 1280", await SAMPLE());
await page.cdp("Emulation.setEmulatedMedia", { features: [] });

// (c) header 4변형 · 390 · 메뉴 열기 → Esc 직후·300ms 뒤 시트 visibility/display/:popover-open
await size(390, 844);
for (const v of ["sticky-right-cta", "sticky-hamburger", "sticky-two-tier", "transparent"]) {
  await page.goto(`http://127.0.0.1:4339/header--${v}.html`);
  await page.waitForTimeout(600);
  await page.click("header .kit-menu-button:not(.kit-close)");
  await page.waitForTimeout(400);
  const st = () => page.evaluate(() => { const s = document.querySelector(".kit-sheet"); const c = getComputedStyle(s); return { open: s.matches(":popover-open"), vis: c.visibility, disp: c.display, op: c.opacity, focus: document.activeElement?.className || document.activeElement?.tagName }; });
  const opened = await st();
  await page.keyboard.press("Escape");
  const just = await st();
  await page.waitForTimeout(300);
  log(`header Esc ${v}`, { opened, justAfterEsc: just, after300: await st() });
}

// (d) CTA Tab 링 — 1280 cta-band 정적 사본, 실제 Tab 이동으로 CTA까지
await size(1280, 900);
await page.goto("http://127.0.0.1:4339/cta-band--banner.html");
await page.waitForTimeout(600);
const tabs = [];
for (let i = 0; i < 12; i++) {
  await page.keyboard.press("Tab");
  const f = await page.evaluate(() => { const a = document.activeElement; const c = getComputedStyle(a); return { tag: a.tagName, text: a.textContent.trim().slice(0, 12), inBand: !!a.closest(".kit-band"), outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} off${c.outlineOffset}`, fv: a.matches(":focus-visible") }; });
  tabs.push(f);
  if (f.inBand) break;
}
log("CTA Tab", tabs);
try { await page.screenshot({ path: `${DIR}/logs/cta-tab-ring-1280.png` }); log("CTA shot", "ok (CDP viewport)"); } catch (e) { log("CTA shot", "FAIL " + String(e).slice(0, 120)); }

// (e) 예약 비활성 외형 — booking 비활성 입력 vs form(같은 비활성 K2) 계산 스타일
for (const n of ["contact--booking", "contact--form"]) {
  await page.goto(`http://127.0.0.1:4339/${n}.html`);
  await page.waitForTimeout(500);
  log(`disabled ${n}`, await page.evaluate(() => { const fs = document.querySelector("fieldset"); const i = document.querySelector("input:not([type=checkbox]), textarea"); const b = document.querySelector("form button, fieldset button"); const c = (e) => e && (({ opacity, color, backgroundColor, borderTopColor, cursor }) => ({ opacity, color, backgroundColor, borderTopColor, cursor }))(getComputedStyle(e)); return { fieldsetDisabled: fs?.disabled, input: c(i), button: c(b), note: [...document.querySelectorAll("form p, fieldset p, .kit-form p")].map((p) => p.textContent.trim().slice(0, 60)) }; }));
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/s5-carry.json`, JSON.stringify(out, null, 1));

// ER-5 QA 캡처 도우미 — 브리프 방식(Page.captureScreenshot + captureBeyondViewport + 뷰포트 clip). fullPage 금지.
import { writeFileSync } from "node:fs";
export const SHOTS = "/Users/younghwankang/orca/workspaces/web-builder-solution/qa-reopen/dev/active/qa-reopen/shots";
export async function shot(page, name) {
  const { w, h } = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const r = await page.cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  const p = `${SHOTS}/${name}.png`;
  writeFileSync(p, Buffer.from(r.data, "base64"));
  return `${p} (${w}x${h})`;
}
export async function width(page, w, h = 900) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
}
// 보조: captureScreenshot이 렌더 iframe(OOPIF)을 늦게 반영할 때 실제 합성 프레임을 screencast로 받는다.
export async function cast(page, name) {
  await page.events();
  await page.cdp("Page.startScreencast", { format: "png", maxWidth: 2000, maxHeight: 2000 });
  await page.waitForTimeout(1500);
  const ev = (await page.events()).filter((e) => e.method === "Page.screencastFrame");
  await page.cdp("Page.stopScreencast", {});
  if (!ev.length) return "cast: frame 0";
  const p = `${SHOTS}/${name}.png`;
  writeFileSync(p, Buffer.from(ev[ev.length - 1].params.data, "base64"));
  return `${p} (screencast)`;
}
// ER-5b 추가: 넘침·포커스 가림 측정(열린 dialog·Callout 기준)
export async function measure(page, sel = "dialog[open]") {
  return page.evaluate((sel) => {
    const W = innerWidth, H = innerHeight, de = document.documentElement;
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), sw: el.scrollWidth, cw: el.clientWidth }; };
    const t = document.querySelector(sel);
    const tb = box(t);
    const a = document.activeElement; const ab = box(a);
    let covered = null;
    if (a && a !== document.body) { const r = a.getBoundingClientRect(); const x = Math.min(Math.max(r.left + r.width / 2, 0), W - 1), y = Math.min(Math.max(r.top + r.height / 2, 0), H - 1); const hit = document.elementFromPoint(x, y); covered = !(hit && (hit === a || a.contains(hit) || hit.contains(a))); }
    // 대상 안 가로 넘침 자식
    const kids = t ? [...t.querySelectorAll("*")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > W + 0.5 || r.left < -0.5); }).map((e) => e.tagName + "." + (e.className + "").slice(0, 30)).slice(0, 5) : [];
    return { vw: W, vh: H, pageOverflowX: de.scrollWidth > W, docSW: de.scrollWidth, target: sel, found: !!t, tb, targetInView: tb ? tb.l >= 0 && tb.r <= W && tb.t >= 0 && tb.b <= H : null, targetInnerOverflowX: tb ? tb.sw > tb.cw + 1 : null, kidsOutside: kids, active: a ? (a.id ? "#" + a.id : a.tagName) + " " + (a.getAttribute("aria-label") || a.textContent || a.value || "").trim().slice(0, 30) : null, activeBox: ab, activeInView: ab ? ab.t >= 0 && ab.b <= H && ab.l >= 0 && ab.r <= W : null, activeCovered: covered };
  }, sel);
}
// ER-5b: captureBeyondViewport:true는 스크롤된 화면에서 fixed/dialog를 스크롤 0 기준으로 그려 위치가 어긋남(실측) → 화면 그대로 판정용 캡처
export async function shotV(page, name) {
  const { w, h } = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const r = await page.cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  const p = `${SHOTS}/${name}.png`;
  writeFileSync(p, Buffer.from(r.data, "base64"));
  return `${p} (${w}x${h}, viewport)`;
}

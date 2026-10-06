// ER-5 QA 캡처 도우미 — 브리프 방식(Page.captureScreenshot + captureBeyondViewport + 뷰포트 clip). fullPage 금지.
import { writeFileSync } from "node:fs";
export const SHOTS = "/Users/younghwankang/orca/workspaces/web-builder-solution/er-5-qa/dev/active/er-5-qa/shots";
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

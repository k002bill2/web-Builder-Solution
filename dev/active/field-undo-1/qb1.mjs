// FU-QB-1 — qb-flow.mjs 뒤 같은 공간에서: 제목 입력 → 섹션 목록(Hero 줄) 클릭 → "더보기" 항목 → Ctrl+Z → 값·알림 · 뷰포트 clip 캡처
const OUT = "/Users/younghwankang/orca/workspaces/web-builder-solution/field-undo-1/dev/active/field-undo-1/shots";
const { writeFileSync } = await import("node:fs");
const page = (await taskSpace(globalThis.SPACE)).page("p1");
const shotV = async (name) => {
  const { w, h } = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  const r = await page.cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  const buf = Buffer.from(r.data, "base64"); const p = `${OUT}/${name}.png`; writeFileSync(p, buf);
  return { p, w, h, bytes: buf.length, png: buf.subarray(1, 4).toString() === "PNG" };
};
const WIDTHS = globalThis.WIDTHS ?? [1280, 1024, 390];
// 390 = 탭 배치(섹션·편집·검사) — 보이지 않으면 그 탭을 실제 클릭으로 연다
const tab = async (name) => page.click(`loc=role:tab[name='${name}']`);
const shown = (sel) => page.evaluate((q) => !!document.querySelector(q)?.offsetParent, sel);
const out = [];
for (const w of WIDTHS) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: w === 390 ? 844 : 900, deviceScaleFactor: 1, mobile: false });
  await page.waitForTimeout(800);
  if (!(await shown("#field-hero-1-title"))) await tab("편집");
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => document.getElementById("field-hero-1-title").value);
  await page.click("loc=css:#field-hero-1-title");
  await page.fill("loc=css:#field-hero-1-title", `봄 신메뉴 출시 ${w}-${Date.now() % 1000}`);
  await page.waitForTimeout(150);
  const typed = await page.evaluate(() => document.getElementById("field-hero-1-title").value);
  if (!(await shown("[data-row-id='hero-1']"))) await tab("섹션");
  await page.waitForTimeout(200);
  // 좁은 폭: 섹션 목록이 접힌 details 안 — 요약을 실제 클릭으로 연다(이것도 칸 밖 클릭)
  const folded = await page.evaluate(() => { const d = document.querySelector("[data-row-id='hero-1']").closest("details"); if (!d || d.open) return false; d.querySelector("summary").id ||= "qb-sections-summary"; return d.querySelector("summary").id; });
  if (folded) await page.click(`loc=css:#${folded}`);
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector("[data-row-id='hero-1']").scrollIntoView({ block: "center" }));
  await page.click("loc=css:[data-row-id='hero-1']");
  await page.waitForTimeout(300);
  const active = await page.evaluate(() => document.activeElement?.tagName + " " + (document.activeElement?.getAttribute("data-row-id") ?? ""));
  await page.click("loc=role:button[name='더보기']");
  await page.waitForTimeout(300);
  const menu = await page.evaluate(() => [...document.querySelectorAll("[role=menuitem]")].map((m) => `${m.textContent.trim()}${m.getAttribute("aria-disabled") === "true" || m.disabled ? "(비활성)" : ""}`));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector("[data-row-id='hero-1']").scrollIntoView({ block: "center" }));
  await page.click("loc=css:[data-row-id='hero-1']");
  await page.keyboard.press("Control+z");
  await page.waitForTimeout(500);
  const notice0 = await page.evaluate(() => document.querySelector("[role=status][aria-label='편집 알림']")?.textContent.trim());
  if (!(await shown("#field-hero-1-title"))) await tab("편집");
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => document.getElementById("field-hero-1-title").value);
  const notice = await page.evaluate(() => document.querySelector("[role=status][aria-label='편집 알림']")?.textContent.trim());
  const shot = await shotV(`qb1-${w}`);
  out.push({ w, folded, before, typed, active, menu, after, restored: after === before, notice: notice0, noticeAfterTab: notice, shot });
}
console.log(JSON.stringify(out, null, 1));

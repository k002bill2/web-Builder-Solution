// QB-14 — 정적 HTML(내보내기 그대로, static/qb-*.html)을 127.0.0.1:4339(python http.server, static/)로 열어 세 header 시트: 실제 클릭 → 열림 · Esc → 닫힘 · 시트 안 앵커 클릭 → 닫힘. `ego-browser nodejs < qb14.mjs`
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-1b/dev/active/m2b-1b";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace("m2b-1b qb14");
const page = task.page("p1");
const H = { 1280: 900, 768: 1024, 390: 844 };
const out = {};
const key = async (k, code, vk) => { for (const type of ["keyDown", "keyUp"]) await page.cdp("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: vk }); };
const clickAt = async (sel) => {
  const p = await page.evaluate((sel) => { const el = [...document.querySelectorAll(sel)].find((e) => e.checkVisibility()); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  if (!p) return false;
  for (const type of ["mousePressed", "mouseReleased"]) await page.cdp("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: "left", clickCount: 1 });
  await page.waitForTimeout(250);
  return true;
};
const isOpen = () => page.evaluate(() => !!document.querySelector("[popover]")?.matches(":popover-open"));
for (const name of ["qb-1-hamburger", "qb-2-two-tier", "qb-13-transparent"]) for (const w of [1280, 768, 390]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: H[w], deviceScaleFactor: 1, mobile: false });
  await page.goto(`http://127.0.0.1:4339/${name}.html`);
  await page.waitForTimeout(400);
  const r = { scripts: await page.evaluate(() => document.scripts.length) };
  r.button = await clickAt(".kit-bar > button");
  if (!r.button) { out[`${name}-${w}`] = { ...r, note: "버튼 숨김(이 폭은 바에 nav)" }; continue; }
  r.openByClick = await isOpen();
  await key("Escape", "Escape", 27);
  await page.waitForTimeout(200);
  r.closedByEsc = !(await isOpen());
  await clickAt(".kit-bar > button");
  r.reopened = await isOpen();
  await clickAt("[popover] nav a[href^='#']");
  r.closedByAnchor = !(await isOpen());
  r.hash = await page.evaluate(() => location.hash);
  r.ok = r.openByClick && r.closedByEsc && r.reopened && r.closedByAnchor && r.hash.startsWith("#");
  out[`${name}-${w}`] = r;
}
await writeFile(`${DIR}/logs/qb14.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));

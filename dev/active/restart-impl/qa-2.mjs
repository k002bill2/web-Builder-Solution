// RS-AC-14 — 1280·1024·390 + 확대 200%(1280×900의 200% = CSS 640×450) · 버튼 순서·위치·가림
const task = await taskSpace(13);
const page = task.page("p1");
const fs = await import("node:fs/promises");
const dir = "/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/dev/active/restart-impl/shots";
const out = [];
for (const [name, w, h] of [["1280", 1280, 900], ["1024", 1024, 768], ["390", 390, 844], ["zoom200", 640, 450]]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await page.waitForTimeout(300);
  const m = await page.evaluate(() => {
    const d = document.querySelector("dialog[open]");
    d.scrollTop = d.scrollHeight;
    const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
    const buttons = [...d.querySelectorAll("button")].map((b) => ({ text: b.textContent.trim(), rect: r(b) }));
    const vh = innerHeight, vw = innerWidth;
    return { dialog: r(d), scroll: [d.scrollHeight, d.clientHeight], buttons, hidden: buttons.filter((b) => b.rect[1] < 0 || b.rect[1] + b.rect[3] > vh || b.rect[0] < 0 || b.rect[0] + b.rect[2] > vw).map((b) => b.text) };
  });
  const path = `${dir}/rs14-${name}.png`;
  await page.screenshot({ path });
  out.push({ name, ...m, png: path, bytes: (await fs.stat(path)).size });
}
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
console.log(JSON.stringify(out.map((o) => ({ n: o.name, d: o.dialog, s: o.scroll, b: o.buttons.map((b) => b.text.slice(0, 6) + "@" + b.rect.join(",")), hidden: o.hidden, bytes: o.bytes }))));

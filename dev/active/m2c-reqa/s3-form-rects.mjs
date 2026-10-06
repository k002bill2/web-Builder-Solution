// M2C-REQA — 비활성 폼 자리(rect) 측정: fieldset.kit-fieldset(:disabled 확인) 안 입력칸·버튼·체크박스 + .kit-notice. 정적 사본 127.0.0.1:4339, 창 높이 = logs/s2-heights.json. → logs/form-rects.json
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa";
const { readFile, writeFile } = await import("node:fs/promises");
const H = JSON.parse(await readFile(`${DIR}/logs/s2-heights.json`, "utf8"));
const names = ["contact--booking", "contact--form"];
const page = (await taskSpace(80)).page("p1");
await page.cdp("Emulation.setScrollbarsHidden", { hidden: true });
const out = {};
for (const w of [1280, 768, 390]) for (const n of names) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: H[n][w].h, deviceScaleFactor: 1, mobile: false });
  await page.goto(`http://127.0.0.1:4339/${n}.html`);
  await page.waitForTimeout(1500);
  (out[n] ??= {})[w] = await page.evaluate(() => {
    const R = (e) => { const r = e.getBoundingClientRect(); return [Math.floor(r.left), Math.floor(r.top + scrollY), Math.ceil(r.right), Math.ceil(r.bottom + scrollY)]; };
    const fs = [...document.querySelectorAll("fieldset.kit-fieldset")];
    const notice = [...document.querySelectorAll(".kit-notice")];
    const parts = [...document.querySelectorAll(".kit-fieldset .kit-field, .kit-fieldset .kit-submit, .kit-fieldset .kit-check")];
    const cs = (e) => { const s = getComputedStyle(e); return { cls: e.className, bs: s.borderTopStyle, bw: s.borderTopWidth, bg: s.backgroundColor, color: s.color, op: s.opacity }; };
    return { fieldset: fs.map(R), disabled: fs.map((f) => f.matches(":disabled")), notice: notice.map(R), noticeInFieldset: notice.map((e) => !!e.closest("fieldset")), parts: parts.map(R), styles: [...parts, ...notice].map(cs) };
  });
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await page.cdp("Emulation.setScrollbarsHidden", { hidden: false });
await writeFile(`${DIR}/logs/form-rects.json`, JSON.stringify(out, null, 1));
for (const [n, v] of Object.entries(out)) for (const [w, r] of Object.entries(v)) console.log(n, w, "fs", JSON.stringify(r.fieldset), r.disabled, "notice", JSON.stringify(r.notice), r.noticeInFieldset, "parts", r.parts.length);
console.log(JSON.stringify(out["contact--form"][1280].styles));

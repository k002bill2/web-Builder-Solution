// M2C-5b — kit-art 자리(rect) 측정. 정적 사본 127.0.0.1:4339, 창 높이 = logs/s2-heights.json(캡처와 같은 창). 결과 → logs/art-rects.json
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa";
const { readFile, writeFile } = await import("node:fs/promises");
const H = JSON.parse(await readFile(`${DIR}/logs/s2-heights.json`, "utf8"));
const names = ["about--story","footer--biz-extended-map","hero--fullbleed-left","hero--grid","hero--image","hero--split","portfolio--grid-2","portfolio--grid-3","portfolio--masonry"];
const page = (await taskSpace(80)).page("p1");
await page.cdp("Emulation.setScrollbarsHidden", { hidden: true }); // 캡처(--hide-scrollbars)와 같은 폭
const out = {};
for (const w of [1280, 768, 390]) for (const n of names) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: H[n][w].h, deviceScaleFactor: 1, mobile: false });
  await page.goto(`http://127.0.0.1:4339/${n}.html`);
  await page.waitForTimeout(1500);
  (out[n] ??= {})[w] = await page.evaluate(() => [...document.querySelectorAll('[class*="kit-art"]')].filter((e) => !e.parentElement.closest('[class*="kit-art"]')).map((e) => { const r = e.getBoundingClientRect(); return [Math.floor(r.left), Math.floor(r.top + scrollY), Math.ceil(r.right), Math.ceil(r.bottom + scrollY)]; }));
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await page.cdp("Emulation.setScrollbarsHidden", { hidden: false });
await writeFile(`${DIR}/logs/art-rects.json`, JSON.stringify(out));
console.log(Object.entries(out).map(([n, v]) => `${n} ${Object.entries(v).map(([w, r]) => `${w}:${r.length}`).join(" ")}`).join("\n"));

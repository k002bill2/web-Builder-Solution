// M2B-6 S2 — 정적 사본(127.0.0.1:4339) 폭별 문서 높이·가로 넘침·글꼴 loaded 측정 → logs/s2-heights.json (shots.sh 창 높이 입력)
// 폭 = CDP Emulation.setDeviceMetricsOverride(1280·768·390). 모션(1초) 끝난 뒤 1.5초에 잰다.
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa";
const { readdir, writeFile } = await import("node:fs/promises");
const task = await taskSpace(80);
const page = task.page("p1");
const names = (await readdir(`${DIR}/static`)).filter((f) => f.endsWith(".html") && !f.startsWith("_")).map((f) => f.slice(0, -5)).sort();
const H = { 1280: 900, 768: 1024, 390: 844 };
const out = {};
for (const w of [1280, 768, 390]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: H[w], deviceScaleFactor: 1, mobile: false });
  for (const n of names) {
    await page.goto(`http://127.0.0.1:4339/${n}.html`);
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({
      h: Math.ceil(document.documentElement.scrollHeight),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      iw: window.innerWidth,
      fonts: [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family}:${f.weight}`),
      anim: document.getAnimations().filter((a) => a.playState === "running").length,
    }));
    (out[n] ??= {})[w] = r;
  }
  console.log("W", w, "done");
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/s2-heights.json`, JSON.stringify(out, null, 1));
const rows = Object.entries(out).map(([n, v]) => `${n} ${[1280, 768, 390].map((w) => `${w}:h${v[w].h}/ox${v[w].overflowX}/iw${v[w].iw}/f${v[w].fonts.length}/a${v[w].anim}`).join(" ")}`);
console.log(rows.join("\n"));

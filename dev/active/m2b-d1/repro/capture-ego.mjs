// M2B-D1 — 제품 capturePng(수정본)를 Ego Lite(D-1 관측 환경)에서 5회. `ego-browser nodejs < capture-ego.mjs`
const { readFileSync } = await import("node:fs");
const BODY = readFileSync("/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-d1/dev/active/m2b-d1/repro/capture-body.js", "utf8");
const task = await taskSpace("m2b-d1 probe");
const page = task.page("p1");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4337/render.html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 20000 });
for (let run = 1; run <= 5; run++) {
  const r = await page.cdp("Runtime.evaluate", { expression: BODY, awaitPromise: true, returnByValue: true });
  console.log(JSON.stringify({ run, ...(r.result?.value ?? r) }));
}

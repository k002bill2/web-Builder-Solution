// M2A-2b B8 — 렌더 문서 웹폰트 요청 수 전후. render.html 최상위 + sampleDoc + 킷 토큰(k9b 방식). `ego-browser nodejs < b8fonts.mjs <라벨>`
const label = process.env.B8_LABEL ?? "run";
const task = await taskSpace(`m2a-2b b8 ${label}`);
const page = task.page("p1");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4337/render.html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
await page.evaluate(async () => {
  const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
  const { SAMPLE_KIT_TOKENS } = await import("/src/render/testing/sampleKitTokens.ts");
  window.postMessage({ type: "render", doc: sampleDoc(), kitTokens: SAMPLE_KIT_TOKENS }, "*");
});
await page.waitForTimeout(2500);
const r = await page.evaluate(async () => {
  await document.fonts.ready;
  const res = performance.getEntriesByType("resource").map((e) => e.name).filter((n) => /\.(woff2?|ttf|otf)(\?|$)/.test(n));
  const faces = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`);
  const fam = (sel) => { const el = document.querySelector(sel); return el && getComputedStyle(el).fontFamily; };
  return { fontRequests: res.length, files: res.map((n) => n.split("/").pop()), fontFaces: faces, kitFont: fam("[data-kit] h2, [data-kit] h1"), fallbackFont: fam('[data-fallback="true"] p'), markerFont: fam('[data-kit-marker="fallback"]') };
});
console.log("B8", label, JSON.stringify(r));
await task.finish({ keep: [] });

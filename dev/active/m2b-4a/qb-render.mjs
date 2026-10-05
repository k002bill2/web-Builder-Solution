// M2B-4a [B] 렌더 문서 — `ego-browser nodejs < qb-render.mjs`. 4337(dev) render.html을 최상위로 열고(window.parent === window) render{doc, kitTokens}를 보낸다.
// B6 렌더 문서: [...document.fonts] 중 별칭·대응 굵기·loaded 면 · B7: 첫 rects = 글꼴 로드 뒤(첫 rects 섹션 높이 = 로드 뒤 다시 잰 높이) ·
// 느린 망(CDP 전송 속도 제한)에서 3초에 폴백 rects + 늦은 로드 뒤 rects 재전송 · 글꼴 차단(CDP setBlockedURLs)에도 rects 계속
const task = await taskSpace(65);
const page = task.page("p1");
const RENDER = "http://127.0.0.1:4337/render.html";
const { readFile } = await import("node:fs/promises");
const out = JSON.parse(await readFile("/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-4a/dev/active/m2b-4a/logs/qb-render.json", "utf8").catch(() => "{}"));
const ONLY_NET = true;
const log = (k, v) => { out[k] = v; console.log("QB", k, JSON.stringify(v).slice(0, 1200)); };

const boot = async () => {
  await page.goto(RENDER);
  await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
  await page.evaluate(async () => {
    const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
    const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
    window.__rects = [];
    window.addEventListener("message", (e) => { if (e.data?.type === "rects") window.__rects.push({ t: performance.now(), rects: e.data.rects }); });
    window.__send = (family, hw = 700, bw = 400) => {
      window.__t0 = performance.now();
      window.__rects = [];
      window.postMessage({ type: "render", doc: sampleDoc(), kitTokens: { ...base, type: { ...base.type, family, headingWeight: hw, bodyWeight: bw } } }, "*");
    };
  });
};
const sections = (r) => r.rects.filter((x) => x[1] === null).map((x) => [x[0], Math.round(x[5] * 10) / 10]);
const faces = () => page.evaluate(() => [...document.fonts].filter((f) => f.status !== "unloaded").map((f) => `${f.family}:${f.weight}:${f.status}`));

// 1) 계열 3종 — 쓰는 면만 loaded · 첫 rects = 로드 뒤 높이
for (const [family, hw, bw] of ONLY_NET ? [] : [["Noto Serif KR", 700, 400], ["Noto Sans KR", 700, 400], ["Pretendard", 600, 500]]) {
  await boot();
  await page.evaluate(([f, h, b]) => window.__send(f, h, b), [family, hw, bw]);
  await page.waitForFunction(() => window.__rects.length > 0, undefined, { timeout: 10000 });
  await page.waitForTimeout(500);
  const first = await page.evaluate(() => ({ dt: Math.round(window.__rects[0].t - window.__t0), rects: window.__rects[0].rects }));
  // 다시 재기 — viewport 메시지(같은 폭)로 측정만 다시
  await page.evaluate(() => window.postMessage({ type: "viewport", width: window.innerWidth }, "*"));
  await page.waitForTimeout(300);
  const again = await page.evaluate(() => window.__rects.at(-1));
  const style = await page.evaluate(() => {
    const root = document.querySelector("[data-site-root]");
    const h = document.querySelector("[data-site-root] h1, [data-site-root] h2");
    return { rootFont: getComputedStyle(root).fontFamily, synthesis: getComputedStyle(root).fontSynthesis, headingWeight: getComputedStyle(h).fontWeight };
  });
  log(`B6-render ${family} ${hw}/${bw}`, { faces: await faces(), style, firstRectsMs: first.dt, firstEqualsRemeasure: JSON.stringify(sections(first)) === JSON.stringify(sections(again)), firstSections: sections(first).slice(0, 4) });
}

// 2·3) 메모리 캐시를 피하려고 다른 URL(localhost — 같은 서버)로: 차단 먼저(실패는 캐시 0) → 느린 망
const RENDER2 = "http://localhost:4337/render.html";
const boot2 = async () => {
  await page.goto(RENDER2);
  await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
  await page.evaluate(async () => {
    const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
    const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
    window.__rects = [];
    window.addEventListener("message", (e) => { if (e.data?.type === "rects") window.__rects.push({ t: performance.now(), rects: e.data.rects }); });
    window.__send = (family) => { window.__t0 = performance.now(); window.__rects = []; window.postMessage({ type: "render", doc: sampleDoc(), kitTokens: { ...base, type: { ...base.type, family } } }, "*"); };
  });
};
await page.cdp("Network.enable", {});
await page.cdp("Network.setCacheDisabled", { cacheDisabled: true });
await boot2();
await page.cdp("Network.setBlockedURLs", { urls: ["*KitSerifKR*"] });
await page.evaluate(() => window.__send("Noto Serif KR"));
await page.waitForTimeout(4000);
log("B7 글꼴 차단(localhost)", { rectsMs: await page.evaluate(() => window.__rects.map((r) => Math.round(r.t - window.__t0))), sections: await page.evaluate(() => document.querySelectorAll("[data-site-root] [data-instance-id]").length), faces: await faces() });
await page.cdp("Network.setBlockedURLs", { urls: [] });

await boot2();
await page.cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: 80000, uploadThroughput: 80000 });
await page.evaluate(() => window.__send("Noto Serif KR"));
await page.waitForTimeout(14000);
const slow = await page.evaluate(() => window.__rects.map((r) => ({ ms: Math.round(r.t - window.__t0), sec: r.rects.filter((x) => x[1] === null).slice(0, 3).map((x) => Math.round(x[5])) })));
log("B7 느린 망(localhost, 80KB/s) rects 시점(ms)·앞 3섹션 높이", { rects: slow, faces: await faces(), loadedAt: await page.evaluate(() => performance.getEntriesByType("resource").filter((e) => /KitSerifKR/.test(e.name)).map((e) => Math.round(e.responseEnd - window.__t0))) });
await page.cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await page.cdp("Network.setCacheDisabled", { cacheDisabled: false });

const { writeFile } = await import("node:fs/promises");
await writeFile("/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-4a/dev/active/m2b-4a/logs/qb-render.json", JSON.stringify(out, null, 1));

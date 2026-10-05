// M2B-4a [B] 재측정(턴한도 1회차) — woff2 서명 검사(0f40de1) 뒤 B9-HTML + 계산 스타일 동등성 Kit Sans KR 보충. `ego-browser nodejs < qb-b9html.mjs`
// 부모 = 4337 dev render.html에서 실제 createStaticHtmlGenerator import · 킷 CSS·글꼴 바이트 = 4339 preview(운영 빌드)
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-4a";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(65);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("QB", k, JSON.stringify(v).slice(0, 1600)); };
const job = async (fn, arg) => {
  await page.evaluate(([src, arg]) => {
    window.__r = undefined;
    (0, eval)(`(${src})`)(arg).then((v) => (window.__r = { v }), (e) => (window.__r = { e: String(e) }));
  }, [fn.toString(), arg ?? null]);
  await page.waitForFunction(() => window.__r !== undefined, undefined, { timeout: 180000 });
  const r = await page.evaluate(() => window.__r);
  if (r.e) throw new Error(r.e);
  return r.v;
};
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4337/render.html?b9html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
const r = await job(async () => {
  const sh = await import("/src/features/studio/staticHtml/staticHtml.ts");
  const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
  const { sampleTheme } = await import("/src/engine/testing/sampleTheme.ts");
  const B = "http://127.0.0.1:4339";
  const fetchText = async (u) => (await fetch(B + u)).text();
  const calls = [];
  const fetchBytesRaw = async (u) => { const r = await fetch(B + u, { cache: "no-store" }); calls.push([u.slice(-34), r.status, r.headers.get("content-type")]); if (!r.ok) throw new Error(`${u} ${r.status}`); return r.arrayBuffer(); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const theme = (family) => { const p = sampleTheme().profile; return { ...p, base: { ...p.base, typography_tokens: { ...p.base.typography_tokens, family } } }; };
  const doc = { ...sampleDoc(), profileVersion: 2, meta: { title: "글꼴 검증", description: "M2B-4a" } };
  const made = [];
  const urls = { createObjectURL: (b) => (made.push(b), URL.createObjectURL(b)), revokeObjectURL: (u) => URL.revokeObjectURL(u) };
  const frames = () => document.querySelectorAll("iframe").length;
  const gen = (family, fetchBytes) => sh.createStaticHtmlGenerator({ projects: () => [{ projectId: "p", profileId: "profile-1" }], versions: () => [theme(family)] }, { fetchText, fetchBytes, urls, fontTimeoutMs: 5000 });
  const run = async (name, family, fb) => {
    const before = made.length; const t0 = performance.now(); const f0 = frames(); let res;
    try { const g = await gen(family, fb)({ projectId: "p", doc }); res = { ok: true, html: !!g.downloadRef }; } catch (e) { res = { ok: false, code: e.code, message: e.message }; }
    return { name, ...res, ms: Math.round(performance.now() - t0), filesMade: made.length - before, framesLeft: frames() - f0 };
  };
  const results = [];
  results.push(await run("base(Serif)", "Noto Serif KR", fetchBytesRaw));
  calls.length = 0;
  // 없는 파일 — 4339 vite preview는 SPA 폴백 HTML 200을 준다(수정 전: 렌더 문서로 넘어가 JOB_TIMEOUT 정적 HTML 렌더 문서 시간 초과)
  results.push({ ...(await run("spaFallback(NOPE→200 html)", "Noto Serif KR", (u) => fetchBytesRaw(u.replace("KitSerifKR", "NOPE")))), calls: calls.splice(0) });
  // 진짜 404(응답 실패)
  results.push(await run("http404(throw)", "Noto Serif KR", async (u) => { throw new Error(`${u} 404`); }));
  let lateArrived = 0;
  results.push(await run("late51", "Noto Serif KR", async (u) => { await sleep(5100); lateArrived++; return fetchBytesRaw(u); }));
  await sleep(1500);
  results.push({ ...(await run("ok49", "Noto Serif KR", async (u) => { await sleep(4900); return fetchBytesRaw(u); })), lateArrivedBeforeOk49: lateArrived });
  // Kit Sans KR 정적 HTML(계산 스타일 보충용)
  const g = await gen("Noto Sans KR", fetchBytesRaw)({ projectId: "p", doc });
  const sansHtml = await (await fetch(g.downloadRef)).text();
  return { results, sansHtml };
});
log("B9-HTML 재측정", r.results);
await writeFile(`${DIR}/app/dist/qb-static-Noto-Sans-KR.html`, r.sansHtml);

const PROPS = ["fontFamily", "fontWeight", "fontSize", "lineHeight", "fontSynthesis", "color"];
const grab = (props) => page.evaluate((props) => [...document.querySelectorAll("[data-site-root] [data-kit] :is(h1,h2,h3,p,a,li,span,button)")].map((el) => props.map((p) => getComputedStyle(el)[p]).join("|")), props);
for (const family of ["Noto Sans KR"]) {
  await page.goto("http://127.0.0.1:4337/render.html?cmp");
  await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
  await page.evaluate(async (family) => {
    const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
    const { sampleTheme } = await import("/src/engine/testing/sampleTheme.ts");
    const { docKitTokens } = await import("/src/features/studio/docPurpose.ts");
    const p = sampleTheme().profile;
    const v = { ...p, base: { ...p.base, typography_tokens: { ...p.base.typography_tokens, family } } };
    window.postMessage({ type: "render", doc: { ...sampleDoc(), profileVersion: 2 }, kitTokens: docKitTokens({ profileId: "profile-1", versions: [v], latestVersion: 2 }, 2) }, "*");
  }, family);
  await page.waitForFunction(() => document.querySelectorAll("[data-site-root] [data-kit]").length > 3, undefined, { timeout: 10000 });
  await page.waitForTimeout(800);
  const a = await grab(PROPS);
  await page.goto(`http://127.0.0.1:4339/qb-static-${family.replace(/ /g, "-")}.html`);
  await page.waitForTimeout(800);
  const b = await grab(PROPS);
  const faces = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family}:${f.weight}`); });
  const mism = a.map((x, i) => (x === b[i] ? null : [i, x, b[i]])).filter(Boolean);
  log(`계산 스타일 동등성 ${family}`, { elements: [a.length, b.length], mismatches: mism.length, sample: a[0], staticFaces: faces, first: mism.slice(0, 3) });
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/dev/active/m2b-4a/logs/qb-b9html.json`, JSON.stringify(out, null, 1));

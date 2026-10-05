// M2B-6 S1 — 실렌더 30/30 + 정적 사본 생성. `ego-browser nodejs < s1-render30.mjs` (4337 = 이 worktree vite dev, 127.0.0.1)
// render.html을 최상위로 열고(window.parent === window) 변형마다 문서 1개를 render → 판정([data-kit] · [data-fallback] 0 · 표식 0) → serialize(제품 경로)
// → buildStaticHtml(제품 함수, CSS = 렌더 문서 <style> 원문 — cssText 직렬화 0). 글꼴은 제품 loadSiteFonts(data: woff2)를 static/_fonts.css 1개로 공유(link 1줄 — 사본 크기 절감, 제품 출력과의 유일한 차이).
// 음성 대조: 렌더 문서는 엔진에 없는 변형을 INVALID_DOC로 거부(no-such-variant 렌더 경로 불가 — 실측) → 킷 토큰 없는 render(NO_KIT_TOKENS = 전부 폴백)로 표식 검출기가 실제로 잡는지 확인.
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-6-qa/dev/active/m2b-6-qa";
const { writeFile, mkdir } = await import("node:fs/promises");
await mkdir(`${DIR}/static`, { recursive: true });
const task = await taskSpace(process.env.SPACE ? Number(process.env.SPACE) : "m2b-6 qa");
console.log("SPACE", task.spaceId);
const page = task.page("p1");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4337/render.html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 20000 });
const pairs = await page.evaluate(async () => {
  const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
  const { SECTION_DEFINITIONS } = await import("/src/engine/sections/registry.ts");
  const { buildStaticHtml } = await import("/src/features/studio/staticHtml/staticMarkup.ts");
  const { loadSiteFonts, stripFontFaces, defaultFetchBytes } = await import("/src/features/studio/staticHtml/siteFontEmbed.ts");
  const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
  window.__msgs = [];
  window.addEventListener("message", (e) => window.__msgs.push(e.data));
  const doc0 = sampleDoc();
  // 고정 틀: header = sticky-right-cta · footer = minimal. header 변형은 뒤에 hero/center(alt), hero 변형은 alt 톤, 본문은 base 톤
  const docFor = (type, variant) => {
    const H = section("header", type === "header" ? variant : "sticky-right-cta", "q-header");
    const F = section("footer", type === "footer" ? variant : "minimal", "q-footer");
    const mid = type === "header" ? [section("hero", "center", "q-hero", { tone: "alt" })] : type === "footer" ? [] : [section(type, variant, "q-target", { tone: type === "hero" ? "alt" : "base" })];
    return withSections(doc0, [H, ...mid, F]);
  };
  window.__q = { docFor, base, buildStaticHtml, loadSiteFonts, stripFontFaces, defaultFetchBytes, sampleDoc, section, withSections };
  return SECTION_DEFINITIONS.map((d) => [d.type, d.variant]);
});
console.log("PAIRS", pairs.length, JSON.stringify(pairs));

const renderOne = async (docExpr) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.evaluate((expr) => {
      window.__msgs = [];
      const doc = expr.neg ? window.__q.docFor("about", "story") : window.__q.docFor(expr.type, expr.variant);
      window.__q.cur = doc;
      window.postMessage(expr.neg ? { type: "render", doc } : { type: "render", doc, kitTokens: window.__q.base }, "*");
    }, docExpr);
    try {
      await page.waitForFunction(() => window.__msgs.some((m) => m?.type === "rects") && document.querySelectorAll("[data-site-root] [data-instance-id]").length === window.__q.cur.sections.length, undefined, { timeout: 8000 });
      return;
    } catch (e) {
      console.log("RENDER-RETRY", attempt, JSON.stringify(docExpr), String(e).slice(0, 100));
    }
  }
  throw new Error("render failed " + JSON.stringify(docExpr));
};
const judge = () => page.evaluate(() => {
  const root = document.querySelector("[data-site-root]");
  const inst = [...root.querySelectorAll("[data-instance-id]")].filter((el) => !el.parentElement.closest("[data-instance-id]"));
  return {
    instances: inst.map((el) => [el.getAttribute("data-instance-id"), el.getAttribute("data-kit"), el.getAttribute("data-section")]),
    allKit: inst.every((el) => el.hasAttribute("data-kit")),
    fallback: root.querySelectorAll("[data-fallback]").length,
    marker: document.querySelectorAll("[data-kit-marker]").length,
    errors: window.__msgs.filter((m) => m?.type === "error").map((m) => m.code),
  };
});

// 음성 대조
await renderOne({ neg: true });
const neg = await judge();
console.log("NEG", JSON.stringify(neg));

// 글꼴 1회 — 제품 loadSiteFonts(css 원문 · 사용 면만 · data:)
const fontInfo = await page.evaluate(async () => {
  const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
  const fonts = await window.__q.loadSiteFonts(css, window.__q.base.type, window.__q.defaultFetchBytes);
  window.__q.css = window.__q.stripFontFaces(css);
  window.__q.fontsCss = fonts.css;
  window.__q.notice = fonts.notice;
  return { faces: fonts.bytes.map((f) => `${f.family}:${f.weight}:${f.data.byteLength}`), cssLen: css.length, fontsCssLen: fonts.css.length };
});
console.log("FONTS", JSON.stringify(fontInfo));
await writeFile(`${DIR}/static/_fonts.css`, await page.evaluate(() => window.__q.fontsCss));

const results = { neg, fontInfo, pairs: {} };
for (const [type, variant] of pairs) {
  const name = `${type}--${variant}`;
  await renderOne({ type, variant });
  await page.waitForTimeout(250);
  const j = await judge();
  // serialize = 제품 경로(렌더 문서가 html{markup} 응답)
  await page.evaluate(() => { window.__msgs = []; window.postMessage({ type: "serialize" }, "*"); });
  await page.waitForFunction(() => window.__msgs.some((m) => m?.type === "html"), undefined, { timeout: 8000 });
  const html = await page.evaluate(() => {
    const markup = window.__msgs.find((m) => m?.type === "html").markup;
    const out = window.__q.buildStaticHtml({ markup, css: window.__q.css, title: "qa", description: "qa", notice: window.__q.notice });
    return out.replace("<style>", '<link rel="stylesheet" href="_fonts.css"><style>');
  });
  await writeFile(`${DIR}/static/${name}.html`, html);
  results.pairs[name] = { ...j, bytes: html.length, pass: j.allKit && j.fallback === 0 && j.marker === 0 && j.errors.length === 0 };
  console.log("PAIR", name, results.pairs[name].pass, JSON.stringify(j.instances));
}
const passN = Object.values(results.pairs).filter((r) => r.pass).length;
results.summary = { total: pairs.length, pass: passN, negMarkerDetected: neg.marker > 0 && neg.fallback > 0 };
console.log("SUMMARY", JSON.stringify(results.summary));
await mkdir(`${DIR}/logs`, { recursive: true });
await writeFile(`${DIR}/logs/s1-render30.json`, JSON.stringify(results, null, 1));

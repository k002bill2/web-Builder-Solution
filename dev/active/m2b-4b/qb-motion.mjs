// M2B-4b [B] 모션 — `ego-browser nodejs < qb-motion.mjs`. 부모 = 4337(dev) render.html 에서 실제 생성기(capturePng·createStaticHtmlGenerator)를 import 해 부른다.
// 킷 CSS·글꼴 = 4339(preview, 운영 빌드). 정적 HTML = app/dist/qb-motion-*.html 로 써서 4339 에서 연다.
// B1 렌더 문서(캔버스) 첫 그리기·편집 직후 최종 · B2 PNG L2 = L0 픽셀(3폭) · B3 정적 HTML 1.0초 최종·reduce 0초·print · B4 3폭 재생 중·후 가로 넘침 0·확대 칸 · B5 200%·시트 Esc · 계산 스타일 동등성
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-4b";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(66);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("QB", k, JSON.stringify(v).slice(0, 1600)); };
const H = { 1280: 900, 768: 1024, 390: 844 };
const job = async (fn, arg) => {
  await page.evaluate(([src, arg]) => {
    window.__r = undefined;
    (0, eval)(`(${src})`)(arg).then((v) => (window.__r = { v }), (e) => (window.__r = { e: String(e && e.stack || e) }));
  }, [fn.toString(), arg ?? null]);
  await page.waitForFunction(() => window.__r !== undefined, undefined, { timeout: 240000 });
  const r = await page.evaluate(() => window.__r);
  if (r.e) throw new Error(r.e);
  return r.v;
};
const setSize = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: H[width], deviceScaleFactor: 1, mobile: false });
const media = (m = "", reduce = false) => page.cdp("Emulation.setEmulatedMedia", { media: m, features: reduce ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] });
const HEROES = ["fullbleed-left", "split", "center", "grid", "text", "image"];

await setSize(1280);
await media();
await page.goto("http://127.0.0.1:4337/render.html?parent");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
await page.evaluate(async () => {
  const png = await import("/src/features/studio/png/pngCapture.ts");
  const sh = await import("/src/features/studio/staticHtml/staticHtml.ts");
  const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
  const { sampleTheme } = await import("/src/engine/testing/sampleTheme.ts");
  const { docKitTokens } = await import("/src/features/studio/docPurpose.ts");
  const B = "http://127.0.0.1:4339";
  const fetchText = async (u) => (await fetch(B + u)).text();
  const fetchBytes = async (u) => { const r = await fetch(B + u); if (!r.ok) throw new Error(`${u} ${r.status}`); return r.arrayBuffer(); };
  // 문서: hero 변형 교체 · 모든 섹션 motion = 같은 레벨(렌더가 min·첫 화면 판정)
  const docOf = (hero, motion) => {
    const base = sampleDoc();
    const sections = base.sections.map((s) => ({ ...(s.type === "hero" ? section("hero", hero, s.instanceId, { tone: s.tone }) : s), motion }));
    return { ...withSections(base, sections), profileVersion: 2, meta: { title: "모션 검증", description: "M2B-4b" } };
  };
  const theme = () => sampleTheme().profile;
  const tokens = () => docKitTokens({ profileId: "profile-1", versions: [theme()], latestVersion: 2 }, 2);
  const pixels = async (url, w, h) => { const img = new Image(); img.src = url; for (let i = 0; ; i++) { try { await img.decode(); break; } catch (e) { if (i >= 2) throw e; await new Promise((r) => setTimeout(r, 300)); } } const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
  const diff = (a, b) => { if (a.length !== b.length) return -1; let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) n++; return n; };
  const capture = async (doc, view) => {
    const rec = {};
    const deps = { open: (widthRem) => sh.openCaptureFrame(widthRem, 16384 / 16), fetchText, fetchBytes, fontTimeoutMs: 5000, timeoutMs: 8000, draw: async (url, w, h) => { rec.url = url; rec.w = w; rec.h = h; return new Blob(["png"]); }, download: () => undefined };
    await png.savePng({ doc, kitTokens: tokens(), view, name: "qb", revision: 1 }, deps);
    return rec;
  };
  const gen = () => sh.createStaticHtmlGenerator({ projects: () => [{ projectId: "p", profileId: "profile-1" }], versions: () => [theme()] }, { fetchText, fetchBytes, urls: { createObjectURL: (b) => URL.createObjectURL(b), revokeObjectURL: (u) => URL.revokeObjectURL(u) }, fontTimeoutMs: 5000 });
  window.__x = { docOf, tokens, capture, pixels, diff, gen };
});

// B2 PNG: L2 문서 = L0 문서 픽셀 (3폭 · hero 6변형 중 이미지 확대 있는 fullbleed-left·split + 본문 카드)
for (const hero of ["fullbleed-left", "split", "grid"]) {
  log(`B2-PNG ${hero}`, await job(async (hero) => {
    const { docOf, capture, pixels, diff } = window.__x;
    const r = {};
    for (const view of ["desktop", "tablet", "mobile"]) {
      const a = await capture(docOf(hero, "L2"), view);
      const b = await capture(docOf(hero, "L0"), view);
      const svgA = decodeURIComponent(a.url.replace("data:image/svg+xml;charset=utf-8,", ""));
      r[view] = { size: [a.w, a.h], sameHeight: a.h === b.h, diffL2vsL0: diff(await pixels(a.url, a.w, a.h), await pixels(b.url, b.w, b.h)), play: svgA.includes("data-motion-play"), motionAttrs: (svgA.match(/data-motion="L2"/g) ?? []).length, stopRuleLast: /animation: none !important; transition: none !important; }\s*<\/style>/.test(svgA) };
    }
    return r;
  }, hero));
}

// 정적 HTML 생성 — hero 6변형 L2 + fullbleed L0
const htmls = await job(async (heroes) => {
  const { docOf, gen } = window.__x;
  const res = {};
  for (const [name, hero, level] of [...heroes.map((h) => [h, h, "L2"]), ["L0", "fullbleed-left", "L0"], ["L1", "fullbleed-left", "L1"]]) {
    const r = await gen()({ projectId: "p", doc: docOf(hero, level) });
    res[name] = await (await fetch(r.downloadRef)).text();
  }
  return res;
}, HEROES);
for (const [name, html] of Object.entries(htmls)) await writeFile(`${DIR}/app/dist/qb-motion-${name}.html`, html);
log("정적 HTML 소스", Object.fromEntries(Object.entries(htmls).map(([n, h]) => [n, { bytes: h.length, play: (h.match(/data-motion-play/g) ?? []).length, motionL2: (h.match(/data-motion="L2"/g) ?? []).length, motionL1: (h.match(/data-motion="L1"/g) ?? []).length, scripts: (h.match(/<script/g) ?? []).length, reduceMedia: h.includes("prefers-reduced-motion:no-preference"), startingStyle: h.includes("@starting-style") }])));

// 정적 HTML 열기 — 첫 화면 대상 상태 측정 함수
const probe = (t) => page.evaluate((t) => {
  const els = [...document.querySelectorAll("[data-kit] *")];
  const notFinal = els.filter((el) => { const s = getComputedStyle(el); return s.opacity !== "1" || (s.transform !== "none" && s.transform !== "matrix(1, 0, 0, 1, 0, 0)"); }).map((el) => el.className || el.tagName).slice(0, 5);
  const anims = document.getAnimations();
  const sections = [...new Set(anims.map((a) => a.effect.target.closest("[data-kit]").id))];
  return { t, now: Math.round(performance.now()), anims: anims.length, running: anims.filter((a) => a.playState === "running").length, maxEnd: Math.max(0, ...anims.map((a) => a.effect.getComputedTiming().endTime)), animSections: sections, notFinalCount: notFinal.length, notFinal, overflow: document.scrollingElement.scrollWidth - innerWidth };
}, t);

// B3 정적 HTML (1280): 모션 켬 = 첫 화면만 재생·1.0초 최종 / reduce = 0초 최종·애니메이션 0 / print = 같음
await setSize(1280);
const b3 = {};
for (const [label, m, reduce] of [["motion", "", false], ["reduce", "", true], ["print", "print", false]]) {
  await media(m, reduce);
  await page.goto("http://127.0.0.1:4339/qb-motion-fullbleed-left.html");
  const t0 = await probe("load");
  await page.waitForFunction(() => performance.now() >= 1000, undefined, { timeout: 5000 });
  b3[label] = { atLoad: t0, at1s: await probe("1.0s") };
}
await media();
log("B3 fullbleed-left L2", b3);
for (const name of ["L0", "L1"]) {
  await page.goto(`http://127.0.0.1:4339/qb-motion-${name}.html`);
  const a = await probe("load");
  await page.waitForFunction(() => performance.now() >= 1000, undefined, { timeout: 5000 });
  log(`B3 ${name}`, { atLoad: a, at1s: await probe("1.0s") });
}

// B4 3폭 × hero 6변형: 재생 중(30ms 간격 표본)·후 가로 넘침 0 · 확대 대상의 칸(가장 가까운 overflow≠visible 조상)과 아래 변 고정
const b4 = {};
for (const hero of HEROES) {
  for (const w of [1280, 768, 390]) {
    await setSize(w);
    await page.goto(`http://127.0.0.1:4339/qb-motion-${hero}.html`);
    b4[`${hero}@${w}`] = await page.evaluate(async () => {
      const samples = [];
      const zoomInfo = [];
      const t0 = performance.now();
      while (performance.now() < 1100) {
        samples.push(document.scrollingElement.scrollWidth - innerWidth);
        for (const el of document.querySelectorAll(".kit-hero-media, .kit-hx-split-img, .kit-hx-tile--a, .kit-hx-wide")) {
          const a = el.getAnimations().find((x) => x.animationName === "kit-zoom");
          if (!a || a.playState !== "running" || zoomInfo.length > 0) continue;
          let clip = el.parentElement;
          while (clip && getComputedStyle(clip).overflow === "visible") clip = clip.parentElement;
          const r = el.getBoundingClientRect();
          const c = clip.getBoundingClientRect();
          zoomInfo.push({ cls: el.className, scaleNow: getComputedStyle(el).transform, clipCls: clip.className, clipOverflow: getComputedStyle(clip).overflow, outsideClip: { top: Math.round(c.top - r.top), bottom: Math.round(r.bottom - c.bottom), left: Math.round(c.left - r.left), right: Math.round(r.right - c.right) }, bottomFixedDelta: Math.round(r.bottom - (el.offsetTop + el.offsetHeight + (el.offsetParent ? el.offsetParent.getBoundingClientRect().top : 0))) });
        }
        await new Promise((r) => setTimeout(r, 30));
      }
      return { samples: samples.length, maxOverflow: Math.max(...samples), afterOverflow: document.scrollingElement.scrollWidth - innerWidth, anims: document.getAnimations().length, zoom: zoomInfo[0] ?? null, ms: Math.round(performance.now() - t0) };
    });
  }
}
log("B4 3폭 hero 6변형", b4);

// B5 200% 글자(390): rise 출발 거리 비례 · 재생 중 넘침 0 · 시트 열림 모션·메뉴 전부 보임·Esc 닫힘
await setSize(390);
const b5 = {};
for (const pct of ["100%", "200%"]) {
  await page.goto("http://127.0.0.1:4339/qb-motion-fullbleed-left.html");
  b5[pct] = await page.evaluate(async (pct) => {
    document.documentElement.style.fontSize = pct;
    const anims = document.getAnimations();
    for (const a of anims) { a.currentTime = 0; a.pause(); }
    const rise = anims.find((a) => a.animationName === "kit-rise");
    const ty = rise ? new DOMMatrix(getComputedStyle(rise.effect.target).transform).m42 : null;
    const pausedOverflow = document.scrollingElement.scrollWidth - innerWidth;
    for (const a of anims) a.play();
    const samples = [];
    while (performance.now() < 3000 && anims.some((a) => a.playState === "running")) { samples.push(document.scrollingElement.scrollWidth - innerWidth); await new Promise((r) => setTimeout(r, 30)); }
    // 시트
    const btn = document.querySelector("button[popovertarget]");
    const sheet = document.getElementById(btn.getAttribute("popovertarget"));
    btn.click();
    await new Promise((r) => requestAnimationFrame(() => r()));
    const openStart = { open: sheet.matches(":popover-open"), opacity: getComputedStyle(sheet).opacity, transitions: sheet.getAnimations().map((a) => a.transitionProperty) };
    await new Promise((r) => setTimeout(r, 300));
    const links = [...sheet.querySelectorAll("a")].map((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= innerWidth + 0.5; });
    const opened = { opacity: getComputedStyle(sheet).opacity, transform: getComputedStyle(sheet).transform, links: links.length, linksVisible: links.filter(Boolean).length, overflow: document.scrollingElement.scrollWidth - innerWidth };
    return { rootPx: getComputedStyle(document.documentElement).fontSize, riseStartY: ty, pausedOverflow, playSamples: samples.length, playMaxOverflow: Math.max(...samples), openStart, opened };
  }, pct);
  await page.press("body", "Escape");
  b5[pct].afterEsc = await page.evaluate(() => ({ open: !!document.querySelector(":popover-open") }));
}
log("B5 200%·시트", b5);
await page.cdp("Emulation.clearDeviceMetricsOverride", {});

// B1 렌더 문서(캔버스 1280): L2 문서 첫 그리기 직후·슬롯 편집(재그리기) 직후 — 애니메이션 0 · 모든 요소 최종 · data-motion 있음 · data-motion-play 0
await setSize(1280);
await page.goto("http://127.0.0.1:4337/render.html?b1");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
const send = (title) => page.evaluate(async (title) => {
  const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
  const { sampleTheme } = await import("/src/engine/testing/sampleTheme.ts");
  const { docKitTokens } = await import("/src/features/studio/docPurpose.ts");
  const base = sampleDoc();
  const sections = base.sections.map((s) => ({ ...(s.type === "hero" ? { ...section("hero", "split", s.instanceId, { tone: s.tone }), slots: { ...section("hero", "split", s.instanceId).slots, title } } : s), motion: "L2" }));
  window.postMessage({ type: "render", doc: { ...withSections(base, sections), profileVersion: 2 }, kitTokens: docKitTokens({ profileId: "profile-1", versions: [sampleTheme().profile], latestVersion: 2 }, 2) }, "*");
}, title);
const canvasProbe = () => page.evaluate(() => {
  const els = [...document.querySelectorAll("[data-kit] *")];
  return { sections: document.querySelectorAll("[data-kit]").length, motionAttrs: [...document.querySelectorAll("[data-motion]")].map((e) => `${e.id}:${e.getAttribute("data-motion")}`), play: document.querySelectorAll("[data-motion-play]").length, anims: document.getAnimations().length, notFinal: els.filter((el) => { const s = getComputedStyle(el); return s.opacity !== "1" || s.transform !== "none"; }).length, h1: document.querySelector("h1")?.textContent };
});
await send("첫 그리기");
await page.waitForFunction(() => document.querySelector("h1")?.textContent === "첫 그리기", undefined, { timeout: 10000 });
const first = await canvasProbe();
await send("편집 직후");
await page.waitForFunction(() => document.querySelector("h1")?.textContent === "편집 직후", undefined, { timeout: 10000 });
log("B1 캔버스", { first, afterEdit: await canvasProbe() });

// 계산 스타일 동등성(1280, fullbleed-left L2): 렌더 문서 vs 정적 HTML 1.2초 뒤 — 속성별 불일치 수
const PROPS = ["opacity", "transform", "fontFamily", "fontSize", "color", "display", "overflow", "transformOrigin", "animationName"];
const grab = () => page.evaluate((props) => [...document.querySelectorAll("[data-site-root] [data-kit], [data-site-root] [data-kit] *")].map((el) => [el.id || el.className || el.tagName, ...props.map((p) => getComputedStyle(el)[p])]), PROPS);
await page.evaluate(async () => {
  const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
  const { sampleTheme } = await import("/src/engine/testing/sampleTheme.ts");
  const { docKitTokens } = await import("/src/features/studio/docPurpose.ts");
  const base = sampleDoc();
  const sections = base.sections.map((s) => ({ ...s, motion: "L2" }));
  window.postMessage({ type: "render", doc: { ...withSections(base, sections), profileVersion: 2, meta: { title: "모션 검증", description: "M2B-4b" } }, kitTokens: docKitTokens({ profileId: "profile-1", versions: [sampleTheme().profile], latestVersion: 2 }, 2) }, "*");
});
await page.waitForFunction(() => !document.querySelector("h1") || document.querySelectorAll("[data-kit]").length > 5, undefined, { timeout: 10000 });
await page.waitForTimeout(1200);
const a = await grab();
await page.goto("http://127.0.0.1:4339/qb-motion-fullbleed-left.html");
await page.waitForTimeout(1200);
const b = await grab();
const byProp = Object.fromEntries(PROPS.map((p, i) => [p, a.filter((row, j) => b[j] && row[i + 1] !== b[j][i + 1]).map((row, j) => `${row[0]}: ${row[i + 1]} → ${b[a.indexOf(row)]?.[i + 1]}`).slice(0, 6)]));
log("계산 스타일 동등성", { elements: [a.length, b.length], mismatchByProp: Object.fromEntries(Object.entries(byProp).map(([p, v]) => [p, { n: v.length, sample: v }])) });
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/dev/active/m2b-4b/logs/qb-motion.json`, JSON.stringify(out, null, 1));

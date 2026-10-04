// M2B-1a 브라우저 판정 [B]·[V] — `ego-browser nodejs < qb.mjs`. m2a-2b b9b.mjs 방식: render.html을 최상위 페이지로 열고 페이지가 render{doc, kitTokens}를 스스로 보낸다.
// 문서 = sampleDoc의 s-hero 자리만 hero 변형으로 바꾼 것(header·본문·footer 그대로). 캡처 = 뷰포트(fullPage 0).
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-1a/dev/active/m2b-1a";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace("m2b-1a qb");
const page = task.page("p1");
const H = { 1280: 900, 768: 1024, 390: 844 };
const setSize = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: H[width], deviceScaleFactor: 1, mobile: false });
const out = {};
const log = (k, v) => { out[k] = v; console.log("QB", k, JSON.stringify(v)); };
const settle = () => page.waitForTimeout(350);
// 캡처: ego-browser Page.captureScreenshot 시간 초과(logs/qb-probe.txt) → 같은 문서의 정적 HTML(buildStaticHtml)을 파일로 쓰고 Chrome headless --screenshot으로 찍는다(shots.sh)
const snap = async (name) => {
  const html = await page.evaluate(() => {
    const css = [...document.styleSheets].map((s) => [...s.cssRules].map((r) => r.cssText).join("\n")).join("\n");
    return window.__q.buildStaticHtml({ markup: document.querySelector("[data-site-root]").outerHTML, css, title: "qb", description: "qb" });
  });
  await writeFile(`${DIR}/static/${name}.html`, html);
};
const VARIANTS = ["split", "center", "grid", "text", "image"];
const QB = { split: 5, center: 6, grid: 7, text: 8, image: 9 };

await setSize(1280);
await page.goto("http://127.0.0.1:4337/render.html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
log("gate-profiles", await page.evaluate(async () => {
  const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
  const { checkProfileContrast } = await import("/src/domain/profileContrast.ts");
  const { buildStaticHtml } = await import("/src/features/studio/staticHtml/staticMarkup.ts");
  const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
  const P = {
    light: { primary: "#0A5C36", surface: "#F4F0E8", ink: "#1A1A1A", muted: "#6E6E6E", bg: "#FCFBF8" },
    dark: { primary: "#757575", surface: "#EFE9F3", ink: "#000000", muted: "#5F5F66", bg: "#FAFAF7" },
    bright: { primary: "#2F5FC4", surface: "#1F232A", ink: "#F3F4F6", muted: "#A3A9B3", bg: "#14161A" },
  };
  const rgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
  const toks = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, { ...base, card: { tone: k === "dark" ? "dark" : "light", style: "bordered-md" }, palette: Object.fromEntries(Object.entries(p).map(([r, h]) => [r, rgb(h)])) }]));
  window.__q = { sampleDoc, section, withSections, toks, buildStaticHtml };
  return Object.fromEntries(Object.entries(P).map(([k, p]) => [k, checkProfileContrast(Object.entries(p).map(([role, hex]) => ({ role, hex })), k === "dark" ? "dark" : "light", "aa").map((c) => [c.id, Math.round(c.ratio * 100) / 100, c.pass])]));
}));

// heroes = [{ v, tone, off, long }] — 첫 번째가 s-hero 자리, 나머지는 바로 뒤에 덧붙인다(QB-12)
const draw = (profile, heroes, { dropFallback = false } = {}) =>
  page.evaluate(([profile, heroes, dropFallback]) => {
    const { sampleDoc, section, withSections, toks } = window.__q;
    const make = ({ v, tone, off, long }, i) => {
      let s = section("hero", v, i === 0 ? "s-hero" : `s-hero${i}`, { tone });
      if (off && s.slots.image) s = { ...s, slots: { ...s.slots, image: { ...s.slots.image, enabled: false } } };
      if (long) s = { ...s, slots: { ...s.slots, title: "가나다라마바사아자차".repeat(4), subtitle: "카타파하거너더러머버".repeat(12), cta: "서어저처커터퍼허고노".repeat(2).slice(0, 16) } };
      return s;
    };
    const doc0 = sampleDoc();
    const sections = doc0.sections.flatMap((s) => (s.instanceId === "s-hero" ? heroes.map(make) : dropFallback && s.type === "cta-band" ? [] : [s]));
    window.__q.cur = toks[profile].palette;
    window.postMessage({ type: "render", doc: withSections(doc0, sections), kitTokens: toks[profile] }, "*");
  }, [profile, heroes, dropFallback]);

// 글자 요소 × 가장 가까운 불투명 배경 → 역할 쌍 · 대비 (b9b COLORS를 hero 섹션으로 좁힘)
const COLORS = (sel) => {
  const P = window.__q.cur;
  const parse = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const roleOf = (c) => { const v = parse(c).slice(0, 3).join(","); const hit = Object.entries(P).find(([, p]) => parse(p).join(",") === v); return hit ? hit[0] : v === "255,255,255" ? "on-primary" : `?${v}`; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) return s.backgroundColor; } return "rgb(255, 255, 255)"; };
  const texts = [...document.querySelectorAll(`${sel} *`)].filter((el) => el.checkVisibility() && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  return texts.map((el) => { const fg = getComputedStyle(el).color; const bg = bgOf(el); return { slot: el.dataset.slot ?? el.tagName, pair: `${roleOf(fg)}/${roleOf(bg)}`, ratio: Math.round(ratio(parse(fg), parse(bg)) * 100) / 100 }; });
};
const ALLOWED = new Set(["on-primary/primary", "primary/on-primary", "ink/bg", "ink/surface", "muted/bg"]);

// 배치 실측 (KB-AC-10·12·14·16·18·19·20·21 + 첫 화면 h1)
const LAYOUT = (v) => {
  const root = document.querySelector(`[data-section="hero/${v}"]`);
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +(b.y + scrollY).toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), right: +b.right.toFixed(1), bottom: +(b.bottom + scrollY).toFixed(1) }; };
  const vis = (el) => el && el.checkVisibility();
  const h1 = root.querySelector("h1");
  const copy = root.querySelector(".kit-hx-copy, .kit-hx-center");
  const wrap = root.querySelector(".kit-wrap");
  const ws = wrap && getComputedStyle(wrap);
  const ch = (() => { const s = document.createElement("span"); s.style.cssText = "position:absolute;visibility:hidden;width:60ch"; copy.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return +w.toFixed(1); })();
  const tiles = [...root.querySelectorAll(".kit-hx-tiles > *")].filter(vis).map(r);
  const media = root.querySelector("[data-media]");
  return {
    section: r(root), h1: r(h1), copy: r(copy), proseMax60ch: ch,
    wrapInnerLeft: wrap ? +(wrap.getBoundingClientRect().x + parseFloat(ws.paddingLeft)).toFixed(1) : null,
    wrapInnerWidth: wrap ? +(wrap.getBoundingClientRect().width - parseFloat(ws.paddingLeft) - parseFloat(ws.paddingRight)).toFixed(1) : null,
    figure: r(root.querySelector("figure")), media: vis(media) ? r(media) : null, tilesVisible: tiles.length, tiles,
    h1CenterDelta: h1 ? +Math.abs(h1.getBoundingClientRect().x + h1.getBoundingClientRect().width / 2 - (root.getBoundingClientRect().x + root.getBoundingClientRect().width / 2)).toFixed(2) : null,
    h1TopInFirstScreen: h1 ? +(h1.getBoundingClientRect().top + scrollY).toFixed(1) : null,
    subtitleColor: getComputedStyle(root.querySelector('[data-slot="subtitle"]')).color,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
};

// ① QB-5~9 · 배치 (프로필 light · 톤 alt · 이미지 켬 플레이스홀더) 3폭 + 이미지 끔 배치
for (const v of VARIANTS) {
  await draw("light", [{ v, tone: "alt" }], { dropFallback: true });
  await settle(); await snap(`qb-${QB[v]}-${v}`);
  for (const w of [1280, 768, 390]) {
    await setSize(w); await settle();
    await page.evaluate(() => scrollTo(0, 0));
    log(`layout-${v}-${w}`, await page.evaluate(LAYOUT, v));
  }
  if (["split", "grid", "image"].includes(v)) {
    await draw("light", [{ v, tone: "base", off: true }]);
    for (const w of [1280, 390]) { await setSize(w); await settle(); log(`layout-${v}-off-${w}`, await page.evaluate(LAYOUT, v)); }
  }
}

// ② KB-AC-34 대비 · KB-AC-11/13 색: 프로필 light·dark × 톤 base·alt × 5변형 × 1280·390
for (const profile of ["light", "dark"]) for (const tone of ["base", "alt"]) for (const v of VARIANTS) {
  await draw(profile, [{ v, tone }]);
  for (const w of [1280, 390]) {
    await setSize(w); await settle();
    const rows = await page.evaluate(COLORS, `[data-section="hero/${v}"]`);
    const bad = rows.filter((x) => !ALLOWED.has(x.pair) || x.ratio < 4.5);
    log(`colors-${profile}-${tone}-${v}-${w}`, { n: rows.length, pairs: rows.map((x) => `${x.slot}:${x.pair}:${x.ratio}`), bad });
  }
}

// ③ QB-12 — 한 문서에 hero 4종(split·grid·text·image) 톤 번갈아, 반대 배치도 · 부제 색 역할
for (const order of [["base", "alt", "base", "alt"], ["alt", "base", "alt", "base"]]) {
  const heroes = ["split", "grid", "text", "image"].map((v, i) => ({ v, tone: order[i] }));
  await draw("light", heroes, { dropFallback: true });
  await settle(); if (order[0] === "base") await snap("qb-12");
  for (const w of [1280, 768, 390]) {
    await setSize(w); await settle();
    log(`qb12-${order[0]}-${w}`, await page.evaluate((heroes) => {
      const P = window.__q.cur;
      return heroes.map(({ v, tone }) => { const c = getComputedStyle(document.querySelectorAll(`[data-section="hero/${v}"] [data-slot="subtitle"]`)[0]).color; return `${v}:${tone}:${Object.entries(P).find(([, p]) => p === c)?.[0] ?? c}`; });
    }, heroes));
  }
}

// ④ KB-AC-31 상한 글자 + 글자 200% → 1280·768·390 가로 넘침 0 · 말줄임 0
for (const v of VARIANTS) {
  await draw("light", [{ v, tone: "alt", long: true }]);
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const res = {};
  for (const w of [1280, 768, 390]) {
    await setSize(w); await settle();
    res[w] = await page.evaluate((v) => {
      const root = document.querySelector(`[data-section="hero/${v}"]`);
      return { overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, wider: [...root.querySelectorAll("*")].filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5).length, ellipsis: [...root.querySelectorAll("*")].filter((el) => { const s = getComputedStyle(el); return s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none"; }).length, h1Lines: Math.round(root.querySelector("h1").getBoundingClientRect().height / parseFloat(getComputedStyle(root.querySelector("h1")).lineHeight)) };
    }, v);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  log(`long200-${v}`, res);
}

// ⑤ QB-13 다른 프로필(ink가 밝은 팔레트) 1280·390 + 대비
for (const v of VARIANTS) {
  await draw("bright", [{ v, tone: "alt" }], { dropFallback: true });
  await settle(); await snap(`qb-13-${v}`);
  for (const w of [1280, 390]) {
    await setSize(w); await settle();
    await page.evaluate(() => scrollTo(0, 0));
    const rows = await page.evaluate(COLORS, `[data-section="hero/${v}"]`);
    log(`qb13-${v}-${w}`, { bad: rows.filter((x) => !ALLOWED.has(x.pair) || x.ratio < 4.5), pairs: [...new Set(rows.map((x) => x.pair))], min: Math.min(...rows.map((x) => x.ratio)), layoutOverflowX: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) });
  }
}

// ⑥ KB-AC-35 [B] 정적 HTML(buildStaticHtml) — 같은 폭 iframe(srcdoc, 같은 출처 · 검사용)에서 계산 스타일 = 캔버스 · 앵커 이동 뒤 제목이 header에 안 가림
const STYLE = (doc, v) => {
  const root = doc.querySelector(`#s-s-hero`);
  const g = (el, props) => el ? Object.fromEntries(props.map((p) => [p, doc.defaultView.getComputedStyle(el)[p]])) : null;
  return {
    root: g(root, ["backgroundColor", "color", "scrollMarginTop", "display", "gridTemplateAreas"]),
    h1: g(root.querySelector("h1"), ["color", "fontSize", "maxWidth"]),
    lead: g(root.querySelector("h1 + p"), ["color", "fontSize"]),
    cta: g(root.querySelector("h1 ~ a"), ["color", "backgroundColor", "borderRadius"]),
    grid: g(root.querySelector(".kit-hx-grid, .kit-hx-band, .kit-hx-center, .kit-wrap"), ["gridTemplateColumns", "maxWidth", "textAlign"]),
    tiles: [...root.querySelectorAll(".kit-hx-tiles > *")].map((t) => doc.defaultView.getComputedStyle(t).display + ":" + doc.defaultView.getComputedStyle(t).backgroundColor),
  };
};
for (const v of VARIANTS) for (const [tone, off] of [["alt", false], ["base", true]]) {
  await draw("light", [{ v, tone, off }], { dropFallback: true });
  for (const w of [1280, 768, 390]) {
    await setSize(w); await settle();
    const res = await page.evaluate(async ([v, w, STYLE_SRC]) => {
      const STYLE = eval(STYLE_SRC);
      const canvas = STYLE(document, v);
      const css = [...document.styleSheets].map((s) => [...s.cssRules].map((r) => r.cssText).join("\n")).join("\n");
      const html = window.__q.buildStaticHtml({ markup: document.querySelector("[data-site-root]").outerHTML, css, title: "t", description: "d" });
      const f = document.createElement("iframe");
      f.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:900px;border:0`;
      document.body.appendChild(f);
      await new Promise((ok) => { f.onload = ok; f.srcdoc = html; });
      const d = f.contentDocument;
      const stat = STYLE(d, v);
      const contact = d.querySelector("#s-s-contact");
      contact.scrollIntoView({ block: "start" });
      const headerBottom = d.querySelector("header").getBoundingClientRect().bottom;
      const h2Top = contact.querySelector("h2").getBoundingClientRect().top;
      const scripts = d.querySelectorAll("script").length;
      f.remove();
      return { same: JSON.stringify(canvas) === JSON.stringify(stat), canvas, diff: JSON.stringify(canvas) === JSON.stringify(stat) ? null : stat, anchorH2BelowHeader: h2Top >= headerBottom - 0.5, headerBottom: +headerBottom.toFixed(1), h2Top: +h2Top.toFixed(1), scripts };
    }, [v, w, `(${STYLE.toString()})`]);
    log(`static-${v}-${tone}${off ? "-off" : ""}-${w}`, res);
  }
}

await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/qb-b.json`, JSON.stringify(out, null, 1));
await task.finish({ keep: [] });

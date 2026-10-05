// M2B-2b P-B 판정 — `ego-browser nodejs < qb.mjs`. render.html(127.0.0.1:4337, 이 worktree vite)을 최상위 페이지로 열고 render{doc, kitTokens}를 보낸다(2a qb.mjs 구조 재사용).
// 폭 = CDP Emulation.setDeviceMetricsOverride(1280·768·390, innerWidth 기록). 캡처는 같은 문서의 정적 HTML(static/*.html, CSS = 렌더 문서 <style> 원문) → shots.sh(Chrome headless).
// 판정: KD-AC-02(상한+200%) · 05(색 쌍) · 06(정적 script) · 07(DOM 순서) · 08(헤딩) · 14(grid 열·비율·트랙 유지) · 15(masonry 다단·고정 비율) · 16(stats 한 줄·배치) · 정적 HTML 계산 스타일 동등성
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-2b/dev/active/m2b-2b";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace("m2b-2b qb");
const page = task.page("p1");
const H = { 1280: 900, 768: 1024, 390: 844 };
const setSize = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: H[width], deviceScaleFactor: 1, mobile: false });
const out = {};
const log = (k, v) => { out[k] = v; console.log("QB", k, JSON.stringify(v)); };
const settle = () => page.waitForTimeout(400);
const W3 = [1280, 768, 390];
const RENDER = "http://127.0.0.1:4337/render.html";
const TEST12 = "1,234,567,89";

const boot = async () => {
  await page.goto(RENDER);
  await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
  return page.evaluate(async () => {
    const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
    const { checkProfileContrast } = await import("/src/domain/profileContrast.ts");
    const { buildStaticHtml, STATIC_MENU_SCRIPT } = await import("/src/features/studio/staticHtml/staticMarkup.ts");
    const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
    const P = {
      light: { primary: "#0A5C36", surface: "#F4F0E8", ink: "#1A1A1A", muted: "#6E6E6E", bg: "#FCFBF8" },
      dark: { primary: "#757575", surface: "#EFE9F3", ink: "#000000", muted: "#5F5F66", bg: "#FAFAF7" },
    };
    const rgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
    const toks = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, { ...base, card: { tone: k === "dark" ? "dark" : "light", style: "bordered-md" }, palette: Object.fromEntries(Object.entries(p).map(([r, h]) => [r, rgb(h)])) }]));
    window.__q = { sampleDoc, section, withSections, toks, buildStaticHtml, STATIC_MENU_SCRIPT, P, baseRatio: base.mediaRatio };
    return { baseMediaRatio: base.mediaRatio, contrast: Object.fromEntries(Object.entries(P).map(([k, p]) => [k, checkProfileContrast(Object.entries(p).map(([role, hex]) => ({ role, hex })), k === "dark" ? "dark" : "light", "aa").map((c) => [c.id, Math.round(c.ratio * 100) / 100, c.pass])])) };
  });
};

// 섹션: g3 = grid-3 · g3off = grid-3 image2 꺼짐(트랙 유지 비교) · ms = masonry · g2 = grid-2 · st = stats-3
const KEYS = ["g3", "g3off", "ms", "g2", "st"];
const PAIRS = { g3: ["portfolio", "grid-3"], g3off: ["portfolio", "grid-3"], ms: ["portfolio", "masonry"], g2: ["portfolio", "grid-2"], st: ["statistics", "stats-3"] };
const SEL = Object.fromEntries(KEYS.map((k) => [k, `#s-s-${k}`]));
// spec = { tones?: KEYS 순 톤, slots?: {key: slots}, only?: 키 배열, ratio?: "16:9" }
const draw = async (profile, spec = {}) => {
  const nonce = `n${Math.random().toString(36).slice(2, 8)}`;
  await page.evaluate(([profile, spec, KEYS, PAIRS, TEST12, nonce]) => {
    const { sampleDoc, section, withSections, toks } = window.__q;
    const doc0 = sampleDoc();
    const tones = spec.tones ?? ["base", "alt", "base", "alt", "base"];
    const defaults = { g3off: { image2: { kind: "image", enabled: false, source: "placeholder", alt: "", decorative: false } }, st: { stat1Value: TEST12, stat2Value: TEST12, stat3Value: TEST12 } };
    const body = KEYS.filter((k) => !spec.only || spec.only.includes(k)).map((k) => {
      const x = section(PAIRS[k][0], PAIRS[k][1], `s-${k}`, { tone: tones[KEYS.indexOf(k)] });
      const off = k === "g3off" ? { image2: { ...x.slots.image2, enabled: false } } : {};
      return { ...x, slots: { ...x.slots, ...(k === "st" ? defaults.st : {}), ...off, ...(spec.slots?.[k] ?? {}) } };
    });
    const header = doc0.sections.find((s) => s.type === "header");
    const footer = doc0.sections.find((s) => s.type === "footer");
    window.__q.cur = toks[profile].palette;
    window.__q.nonce = spec.slots?.st?.heading ?? nonce;
    window.postMessage({ type: "render", doc: withSections(doc0, [header, ...body, footer]), kitTokens: { ...toks[profile], ...(spec.ratio ? { mediaRatio: spec.ratio } : {}) } }, "*");
  }, [profile, spec, KEYS, PAIRS, TEST12, nonce]);
  await settle();
  await page.waitForFunction(() => !!document.querySelector("[data-site-root] [data-kit][data-section^='portfolio/'], [data-site-root] [data-section='statistics/stats-3']"), undefined, { timeout: 30000 });
  await settle();
};

const snap = async (name, { zoom = false } = {}) => {
  const html = await page.evaluate(() => {
    // 제품(kitCss)과 같이 스타일시트 원문을 쓴다 — cssRules.cssText 직렬화 금지(2a 발견: var() 단축 속성 빈 값 직렬화)
    const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
    return window.__q.buildStaticHtml({ markup: document.querySelector("[data-site-root]").outerHTML, css, title: "qb", description: "qb" });
  });
  await writeFile(`${DIR}/static/${name}.html`, zoom ? html.replace("<html", '<html style="font-size: 200%"') : html);
  return html;
};

// 배치 실측 — 같은 함수를 정적 HTML에서도 돌려 계산 스타일 동등성 비교(정적은 data-section·data-slot 제거 → id·class로 찾음)
const LAYOUT = (SEL) => {
  const q = (s) => document.querySelector(s);
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(1), t: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const cs = (el, props) => (el ? Object.fromEntries(props.map((p) => [p, getComputedStyle(el)[p]])) : { missing: true });
  const vw = document.documentElement.clientWidth;
  const res = { innerWidth: window.innerWidth, clientWidth: vw, overflowX: document.documentElement.scrollWidth - vw };
  const gallery = (key) => {
    const s = q(SEL[key]); if (!s) return undefined;
    const g = s.querySelector(".kit-gallery");
    const figs = [...g.querySelectorAll("figure")];
    const media = figs.map((f) => f.firstElementChild);
    const boxes = media.map(r);
    const lefts = [...new Set(figs.map((f) => r(f).l))].sort((a, b) => a - b);
    return {
      n: figs.length, hidden: figs.map((f) => f.getAttribute("aria-hidden")), cols: getComputedStyle(g).gridTemplateColumns.split(" ").length, gridCols: getComputedStyle(g).gridTemplateColumns,
      gStyle: cs(g, ["display", "columnCount", "columnGap", "rowGap"]), fig: cs(figs[0], ["breakInside", "borderTopLeftRadius", "overflow", "marginBottom"]),
      boxes, ratios: boxes.map((b) => +(b.w / b.h).toFixed(4)), sameRow: new Set(boxes.map((b) => b.t)).size === 1, columnsUsed: lefts.length, assignInfo: figs.map((f) => lefts.indexOf(r(f).l)),
      clipped: figs.filter((f) => f.getClientRects().length > 1).length, intro: cs(s.querySelector(".kit-services-intro"), ["fontSize", "color"]),
    };
  };
  for (const k of ["g3", "g3off", "ms", "g2"]) { const v = gallery(k); if (v) res[k] = v; }
  const st = q(SEL.st);
  if (st) {
    const lis = [...st.querySelectorAll("li")];
    const values = lis.map((li) => li.querySelector(".kit-stat-value"));
    const vals = values.map((v) => { const s = getComputedStyle(v); const lh = s.lineHeight.endsWith("px") ? parseFloat(s.lineHeight) : parseFloat(s.lineHeight) * parseFloat(s.fontSize); const h = v.getBoundingClientRect().height; return { text: v.textContent, h: +h.toFixed(2), lineHeight: +lh.toFixed(2), oneLine: h <= lh * 1.1, fontSize: s.fontSize, w: +v.getBoundingClientRect().width.toFixed(1) }; });
    const boxes = lis.map(r);
    res.st = { n: lis.length, order: lis.map((li) => [...li.children].map((c) => c.className)), vals, boxes, sameRow: new Set(boxes.map((b) => b.t)).size === 1, stacked: boxes.every((b, i) => i === 0 || b.t >= boxes[i - 1].t + boxes[i - 1].h - 0.5), gridCols: getComputedStyle(st.querySelector("ul")).gridTemplateColumns, li: lis.map((li) => cs(li, ["borderTopWidth", "borderLeftWidth", "borderLeftColor", "paddingLeft"])), value: cs(values[0], ["fontWeight", "fontVariantNumeric", "color", "whiteSpace"]), label: cs(st.querySelector(".kit-stat-label"), ["fontSize", "color"]) };
  }
  return res;
};

const COLORS = (sel) => {
  const P = window.__q.cur;
  const parse = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const roleOf = (c) => { const v = parse(c).slice(0, 3).join(","); const hit = Object.entries(P).find(([, p]) => parse(p).join(",") === v); return hit ? hit[0] : v === "255,255,255" ? "on-primary" : `?${v}`; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) return s.backgroundColor; } return "rgb(255, 255, 255)"; };
  const texts = [...document.querySelectorAll(`${sel} *`)].filter((el) => el.checkVisibility() && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const rows = texts.map((el) => { const s = getComputedStyle(el); const fg = s.color; const bg = bgOf(el); return { slot: el.dataset.slot ?? el.className, pair: `${roleOf(fg)}/${roleOf(bg)}`, ratio: Math.round(ratio(parse(fg), parse(bg)) * 100) / 100, opacity: s.opacity, alpha: parse(fg)[3] ?? 1 }; });
  const focusables = document.querySelectorAll(`${sel} a, ${sel} button, ${sel} input, ${sel} [tabindex]`).length;
  return { rows, focusables };
};
// C-1 on-primary/primary · C-2 ink/bg · C-3 ink/primary · C-4 ink/surface · C-5 muted/bg
const ALLOWED = new Set(["on-primary/primary", "ink/bg", "ink/primary", "ink/surface", "muted/bg"]);
const judge = (c) => ({ n: c.rows.length, bad: c.rows.filter((x) => !ALLOWED.has(x.pair) || x.ratio < 4.5 || x.opacity !== "1" || x.alpha !== 1), min: c.rows.length ? Math.min(...c.rows.map((x) => x.ratio)) : null, pairs: [...new Set(c.rows.map((x) => x.pair))], focusables: c.focusables });

log("boot", await boot());
await setSize(1280);

// ⓪ KD-AC-07 · 08 · 06
await draw("light");
log("headings-order", await page.evaluate((SEL) => Object.fromEntries(Object.entries(SEL).map(([k, s]) => { const e = document.querySelector(s); return [k, { h2: e.querySelectorAll("h2").length, h3: e.querySelectorAll("h3").length, ul: e.querySelectorAll("ul").length, figcaption: e.querySelectorAll("figcaption, dl").length, order: [...e.querySelectorAll("figure, li")].map((x) => x.dataset.slot ?? x.firstElementChild?.dataset.slot) }]; })), SEL));
const eqHtml = await snap("qb-eq");
log("static-scripts", await page.evaluate((html) => { const d = new DOMParser().parseFromString(html, "text/html"); const s = [...d.querySelectorAll("script")]; return { n: s.length, sameBytes: s.length === 1 && s[0].textContent === window.__q.STATIC_MENU_SCRIPT, onAttrs: [...d.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.name)).filter((n) => n.startsWith("on")).length, dataLayout: [...d.querySelectorAll("[data-layout]")].map((e) => e.getAttribute("data-layout")) }; }, eqHtml));

// ① 배치 3폭 (KD-AC-14·15·16) — 렌더 문서, 프로필 media_ratio 기본
const live = {};
for (const w of W3) { await setSize(w); await settle(); live[w] = await page.evaluate(LAYOUT, SEL); log(`layout-${w}`, live[w]); }

// ①' media_ratio 16:9 — grid 칸 = 16:9 · masonry 고정 비율 그대로
await draw("light", { ratio: "16:9" });
for (const w of [1280, 390]) { await setSize(w); await settle(); const x = await page.evaluate(LAYOUT, SEL); log(`ratio169-${w}`, { g3: x.g3.ratios, g2: x.g2.ratios, ms: x.ms.ratios }); }

// ② 정적 HTML 계산 스타일 동등성 — 같은 문서(qb-eq)를 4339에서
await page.goto("http://127.0.0.1:4339/qb-eq.html");
for (const w of W3) {
  await setSize(w); await settle();
  const st = await page.evaluate(LAYOUT, SEL);
  const pick = (x) => JSON.stringify(Object.fromEntries(["g3", "g3off", "ms", "g2", "st"].map((k) => [k, x[k] && { ...x[k], hidden: undefined }])));
  const same = pick(st) === pick(live[w]);
  log(`static-eq-${w}`, { same, overflowX: st.overflowX, clientWidth: st.clientWidth, ...(same ? {} : { live: JSON.parse(pick(live[w])), static: JSON.parse(pick(st)) }) });
}

// ③ KD-AC-05 색 조합 — light·dark × 톤(교대 + 뒤집기) × 3폭
await boot();
for (const profile of ["light", "dark"]) for (const tones of [["base", "alt", "base", "alt", "base"], ["alt", "base", "alt", "base", "alt"]]) {
  await draw(profile, { tones });
  for (const w of W3) {
    await setSize(w); await settle();
    const res = {};
    for (const [k, s] of Object.entries(SEL)) res[k] = judge(await page.evaluate(COLORS, s));
    log(`colors-${profile}-${tones[0]}-${w}`, res);
  }
  if (profile === "light") await snap(tones[0] === "base" ? "qb-13" : "qb-13-flip");
}

// ④ KD-AC-02 / QB-15 상한 글자 + 글자 200%
const LONGP = (c) => ({ heading: c.repeat(40), intro: ("갤러리소개" + "abcdefghijklmnopqrstuvwxyz0123456789").repeat(5).slice(0, 160) });
const LONG = { g3: LONGP("가"), g3off: LONGP("나"), ms: LONGP("다"), g2: { heading: "w".repeat(40), intro: "라".repeat(160) }, st: { heading: "마".repeat(40), stat1Value: TEST12, stat2Value: "가나다라마바사아자차카타", stat3Value: "wwwwwwwwwwww", stat1Label: "바".repeat(30), stat2Label: "x".repeat(30), stat3Label: "사아자 차카타 파하 ".repeat(3).slice(0, 30) } };
const OVER = (SEL) => {
  const vw = document.documentElement.clientWidth;
  const res = { overflowX: document.documentElement.scrollWidth - vw };
  for (const [k, s] of Object.entries(SEL)) {
    const all = [...document.querySelector(s).querySelectorAll("*")].filter((el) => el.checkVisibility());
    res[k] = { wider: all.filter((el) => el.getBoundingClientRect().right > vw + 0.5 || el.getBoundingClientRect().left < -0.5).map((el) => el.className || el.tagName), ellipsis: all.filter((el) => { const st = getComputedStyle(el); return st.textOverflow === "ellipsis" || st.webkitLineClamp !== "none"; }).length, scrollOver: all.filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible").length, textLens: [...document.querySelectorAll(`${s} [data-slot]`)].filter((e) => e.tagName !== "FIGURE").map((e) => e.textContent.length) };
  }
  // 겹침: stats 칸끼리 · 갤러리 칸끼리 사각형 교차 0
  const inter = (a, b) => !(a.right <= b.left + 0.5 || b.right <= a.left + 0.5 || a.bottom <= b.top + 0.5 || b.bottom <= a.top + 0.5);
  const overlaps = (els) => { const r = els.map((e) => e.getBoundingClientRect()); let n = 0; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (inter(r[i], r[j])) n++; return n; };
  res.overlap = { st: overlaps([...document.querySelectorAll(`${SEL.st} li`)]), g3: overlaps([...document.querySelectorAll(`${SEL.g3} figure`)]), ms: overlaps([...document.querySelectorAll(`${SEL.ms} figure`)]) };
  return res;
};
await draw("light", { slots: LONG });
await snap("qb-15", { zoom: true });
await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
for (const w of W3) { await setSize(w); await settle(); log(`long200-${w}`, await page.evaluate(OVER, SEL)); }
await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
// 상한 문서 100%에서 stats 시험 문자열 한 줄(정규 단언) 재확인
for (const w of W3) { await setSize(w); await settle(); const x = await page.evaluate(LAYOUT, SEL); log(`long100-st-${w}`, x.st.vals); }

// ⑤ 캡처용 정적 문서 — 변형별(header + 그 변형 + footer)
const CAP = { "qb-5": ["g3"], "qb-5-off": ["g3off"], "qb-6": ["g2"], "qb-7": ["ms"], "qb-8": ["st"] };
for (const [name, only] of Object.entries(CAP)) { await draw("light", { only, tones: ["base", "base", "base", "base", "base"] }); await snap(name); }

await writeFile(`${DIR}/logs/qb.json`, JSON.stringify(out, null, 1));
console.log("DONE");

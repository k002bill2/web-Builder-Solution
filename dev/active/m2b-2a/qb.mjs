// M2B-2a P-B 판정 — `ego-browser nodejs < qb.mjs`. render.html(127.0.0.1:4337, 이 worktree vite)을 최상위 페이지로 열고 render{doc, kitTokens}를 보낸다.
// 폭 = CDP Emulation.setDeviceMetricsOverride(1280·768·390, innerWidth 기록). 캡처는 같은 문서의 정적 HTML(static/*.html) → shots.sh(Chrome headless).
// 판정: KD-AC-02(상한+200% 넘침·말줄임) · 05(글자/면 역할 쌍·대비, light·dark × base·alt) · 06(정적 script) · 07(DOM 순서) · 08(헤딩) · 09~12 배치 · 정적 HTML 계산 스타일 동등성
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-2a/dev/active/m2b-2a";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace("m2b-2a qb");
const page = task.page("p1");
const H = { 1280: 900, 768: 1024, 390: 844 };
const setSize = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: H[width], deviceScaleFactor: 1, mobile: false });
const out = {};
const log = (k, v) => { out[k] = v; console.log("QB", k, JSON.stringify(v)); };
const settle = () => page.waitForTimeout(350);
const W3 = [1280, 768, 390];
const RENDER = "http://127.0.0.1:4337/render.html";

const boot = async () => {
  await page.goto(RENDER);
  await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
  return page.evaluate(async () => {
    const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
    const { checkProfileContrast } = await import("/src/domain/profileContrast.ts");
    const { buildStaticHtml } = await import("/src/features/studio/staticHtml/staticMarkup.ts");
    const { STATIC_MENU_SCRIPT } = await import("/src/features/studio/staticHtml/staticMarkup.ts");
    const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
    const P = {
      light: { primary: "#0A5C36", surface: "#F4F0E8", ink: "#1A1A1A", muted: "#6E6E6E", bg: "#FCFBF8" },
      dark: { primary: "#757575", surface: "#EFE9F3", ink: "#000000", muted: "#5F5F66", bg: "#FAFAF7" },
    };
    const rgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
    const toks = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, { ...base, card: { tone: k === "dark" ? "dark" : "light", style: "bordered-md" }, palette: Object.fromEntries(Object.entries(p).map(([r, h]) => [r, rgb(h)])) }]));
    window.__q = { sampleDoc, section, withSections, toks, buildStaticHtml, STATIC_MENU_SCRIPT, P };
    return Object.fromEntries(Object.entries(P).map(([k, p]) => [k, checkProfileContrast(Object.entries(p).map(([role, hex]) => ({ role, hex })), k === "dark" ? "dark" : "light", "aa").map((c) => [c.id, Math.round(c.ratio * 100) / 100, c.pass])]));
  });
};

// spec = { tones: [about, list, cards2, masonry], slots: { text?, list?, cards2?, masonry? }, only?: 키 배열 }
const draw = async (profile, spec = {}) => {
  await page.evaluate(([profile, spec]) => {
    const { sampleDoc, section, withSections, toks } = window.__q;
    const doc0 = sampleDoc();
    const keys = ["text", "list", "cards2", "masonry"];
    const pairs = { text: ["about", "text"], list: ["services", "list"], cards2: ["services", "cards-2"], masonry: ["services", "cards-masonry"] };
    const tones = spec.tones ?? ["base", "alt", "base", "alt"];
    const body = keys.filter((k) => !spec.only || spec.only.includes(k)).map((k) => {
      const x = section(pairs[k][0], pairs[k][1], `s-${k}`, { tone: tones[keys.indexOf(k)] });
      return spec.slots?.[k] ? { ...x, slots: { ...x.slots, ...spec.slots[k] } } : x;
    });
    const rest = doc0.sections.filter((s) => s.type !== "about" && s.type !== "services" && s.type !== "cta-band" && (!spec.only || s.type === "header" || s.type === "footer"));
    const sections = spec.only ? [rest[0], ...body, ...rest.slice(1)] : [rest[0], rest[1], ...body, ...rest.slice(2)];
    window.__q.cur = toks[profile].palette;
    window.postMessage({ type: "render", doc: withSections(doc0, sections), kitTokens: toks[profile] }, "*");
  }, [profile, spec]);
  await settle();
  await page.waitForFunction(() => !!document.querySelector('[data-site-root] [data-section^="services/"], [data-site-root] [data-section="about/text"]'), undefined, { timeout: 30000 });
};

const snap = async (name, { zoom = false } = {}) => {
  const html = await page.evaluate(() => {
    // 제품(kitCss)과 같이 스타일시트 원문을 쓴다 — cssRules.cssText는 var() 단축 속성 + 같은 블록 longhand 덮기(.kit-card border)를 빈 값으로 직렬화해 카드 테두리를 잃는다(1차 실행 발견)
    const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
    return window.__q.buildStaticHtml({ markup: document.querySelector("[data-site-root]").outerHTML, css, title: "qb", description: "qb" });
  });
  await writeFile(`${DIR}/static/${name}.html`, zoom ? html.replace("<html", '<html style="font-size: 200%"') : html);
  return html;
};

// 정적 HTML은 data-section을 지운다(편집기 흔적) → 렌더·정적 모두 섹션 루트 id(s-<instanceId>)로 찾는다
const SEL = { text: "#s-s-text", list: "#s-s-list", cards2: "#s-s-cards2", masonry: "#s-s-masonry" };

// 배치 실측 (KD-AC-09~12) — 같은 함수를 정적 HTML에서도 돌려 계산 스타일 동등성 비교
const LAYOUT = (SEL) => {
  const q = (s) => document.querySelector(s);
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(1), t: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const cs = (el, props) => (el ? Object.fromEntries(props.map((p) => [p, getComputedStyle(el)[p]])) : { missing: true });
  const vw = document.documentElement.clientWidth;
  const res = { innerWidth: window.innerWidth, clientWidth: vw, overflowX: document.documentElement.scrollWidth - vw };
  const t = q(SEL.text);
  if (t) {
    const box = t.querySelector(".kit-about-text"), wrap = t.querySelector(".kit-wrap");
    const probe = document.createElement("div"); probe.style.width = "var(--site-prose-max)"; t.appendChild(probe); const prose = probe.getBoundingClientRect().width; probe.remove();
    const pad = parseFloat(getComputedStyle(wrap).paddingLeft);
    res.text = { figures: t.querySelectorAll("figure, img").length, box: r(box), proseMaxPx: +prose.toFixed(1), wrapContentLeft: +(wrap.getBoundingClientRect().left + pad).toFixed(1), style: cs(box, ["maxWidth", "textAlign"]), body: cs(t.querySelector(".kit-about-body"), ["fontSize", "whiteSpace", "color"]), oneColumn: true };
  }
  const l = q(SEL.list);
  if (l) {
    const head = l.querySelector(".kit-services-head"), ul = l.querySelector("ul");
    const lis = [...ul.querySelectorAll("li")].map(r);
    res.list = { head: r(head), ul: r(ul), sameRow: Math.abs(head.getBoundingClientRect().top - ul.getBoundingClientRect().top) < 1 && ul.getBoundingClientRect().left >= head.getBoundingClientRect().right, ulStyle: cs(ul, ["columnCount", "columnGap", "borderBottomStyle"]), li: cs(ul.querySelector("li"), ["breakInside", "fontWeight", "fontSize", "borderTopStyle", "whiteSpace", "color", "paddingTop"]), liLefts: [...new Set(lis.map((x) => x.l))], gridCols: getComputedStyle(l.querySelector(".kit-list-grid")).gridTemplateColumns, texts: [...ul.querySelectorAll("li")].map((li) => li.innerText) };
  }
  const c2 = q(SEL.cards2);
  if (c2) {
    const lis = [...c2.querySelectorAll("li")].map(r);
    res.cards2 = { n: lis.length, li: lis, sameRow: lis.length === 2 && Math.abs(lis[0].t - lis[1].t) < 1, sameHeight: lis.length === 2 && Math.abs(lis[0].h - lis[1].h) < 1, stacked: lis.length === 2 && lis[1].t >= lis[0].t + lis[0].h, gridCols: getComputedStyle(c2.querySelector("ul")).gridTemplateColumns, card: cs(c2.querySelector("li"), ["backgroundColor", "color", "borderTopWidth", "borderLeftWidth", "borderBottomWidth", "borderLeftColor", "borderTopLeftRadius", "boxShadow", "paddingTop"]) };
  }
  const m = q(SEL.masonry);
  if (m) {
    const ul = m.querySelector("ul");
    const lis = [...ul.querySelectorAll("li")];
    const boxes = lis.map(r);
    const lefts = [...new Set(boxes.map((x) => x.l))].sort((a, b) => a - b);
    res.masonry = { ulStyle: cs(ul, ["columnCount", "columnGap", "display"]), li: cs(lis[0], ["breakInside"]), dom: lis.map((li) => li.querySelector("h3")?.dataset.slot ?? li.textContent.slice(0, 6)), boxes, columnsUsed: lefts.length, assignInfo: boxes.map((b) => lefts.indexOf(b.l)), heightsDiffer: new Set(boxes.map((b) => b.h)).size > 1, ulBottom: +ul.getBoundingClientRect().bottom.toFixed(1), clipped: lis.filter((li) => li.getClientRects().length > 1).length };
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
// C-1 on-primary/primary · C-2 ink/bg · C-3 ink/primary(카드 톤 dark 카드 면) · C-4 ink/surface · C-5 muted/bg
const ALLOWED = new Set(["on-primary/primary", "ink/bg", "ink/primary", "ink/surface", "muted/bg"]);
const judge = (c) => ({ n: c.rows.length, bad: c.rows.filter((x) => !ALLOWED.has(x.pair) || x.ratio < 4.5 || x.opacity !== "1" || x.alpha !== 1), min: c.rows.length ? Math.min(...c.rows.map((x) => x.ratio)) : null, pairs: [...new Set(c.rows.map((x) => x.pair))], focusables: c.focusables });

log("gate-profiles", await boot());
await setSize(1280);

// ⓪ KD-AC-07 · 08 · 06 (렌더 문서 DOM + 같은 문서 정적 HTML)
await draw("light", { slots: { masonry: { card1Body: "가나다라마바사 ".repeat(14).trim(), card2Body: "", card3Body: "짧은 설명" } } });
log("headings-order", await page.evaluate((SEL) => Object.fromEntries(Object.entries(SEL).map(([k, s]) => { const e = document.querySelector(s); return [k, { h2: e.querySelectorAll("h2").length, h3: e.querySelectorAll("h3").length, liOrder: [...e.querySelectorAll("li")].map((li) => li.querySelector("h3")?.dataset.slot ?? li.textContent.trim().slice(0, 8)) }]; })), SEL));
const eqHtml = await snap("qb-eq");
log("static-scripts", await page.evaluate((html) => { const d = new DOMParser().parseFromString(html, "text/html"); const s = [...d.querySelectorAll("script")]; return { n: s.length, sameBytes: s.length === 1 && s[0].textContent === window.__q.STATIC_MENU_SCRIPT, onAttrs: [...d.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.name)).filter((n) => n.startsWith("on")).length, dataLayout: [...d.querySelectorAll("[data-layout]")].map((e) => e.getAttribute("data-layout")) }; }, eqHtml));

// ① 배치 3폭 (KD-AC-09~12) — 렌더 문서
const live = {};
for (const w of W3) { await setSize(w); await settle(); live[w] = await page.evaluate(LAYOUT, SEL); log(`layout-${w}`, live[w]); }

// ② 정적 HTML 계산 스타일 동등성 — 같은 문서(qb-eq)를 4339에서 열어 같은 LAYOUT 비교(박스 위치·계산 스타일)
const eq = {};
await page.goto("http://127.0.0.1:4339/qb-eq.html");
for (const w of W3) {
  await setSize(w); await settle();
  const st = await page.evaluate(LAYOUT, SEL);
  const pick = (x) => JSON.stringify({ t: x.text && { box: x.text.box, style: x.text.style, body: x.text.body }, l: x.list && { sameRow: x.list.sameRow, ulStyle: x.list.ulStyle, li: x.list.li, gridCols: x.list.gridCols, ul: x.list.ul }, c: x.cards2 && { li: x.cards2.li, gridCols: x.cards2.gridCols, card: x.cards2.card }, m: x.masonry && { ulStyle: x.masonry.ulStyle, li: x.masonry.li, boxes: x.masonry.boxes } });
  // 위치(top)·크기까지 비교 — 같은 문서·같은 CSS 원문이면 박스가 같아야 한다
  eq[w] = { same: pick(st) === pick(live[w]), found: Object.entries(JSON.parse(pick(st))).filter(([, v]) => v).map(([k]) => k), overflowX: st.overflowX, clientWidth: st.clientWidth };
  if (!eq[w].same) eq[w].diff = { live: JSON.parse(pick(live[w])), static: JSON.parse(pick(st)) };
  log(`static-eq-${w}`, eq[w]);
}

// ③ KD-AC-05 색 조합 — light·dark × 톤(교대 + 뒤집기 = 4변형 각각 base·alt) × 3폭
await boot();
for (const profile of ["light", "dark"]) for (const tones of [["base", "alt", "base", "alt"], ["alt", "base", "alt", "base"]]) {
  await draw(profile, { tones });
  for (const w of W3) {
    await setSize(w); await settle();
    const res = {};
    for (const [k, s] of Object.entries(SEL)) res[k] = judge(await page.evaluate(COLORS, s));
    log(`colors-${profile}-${tones[0]}-${w}`, res);
  }
  if (tones[0] === "base") await snap(profile === "light" ? "qb-13" : "qb-14");
  else if (profile === "light") await snap("qb-13-flip");
}

// ④ KD-AC-02 / QB-15 상한 글자 + 글자 200% — 3폭 넘침 0 · 밖으로 나간 요소 0 · 말줄임 0
const LONG = {
  text: { heading: "가".repeat(40), body: ("소개본문긴글자열" + "가나다라마바사아자차카타파하".repeat(2) + "abcdefghijklmnopqrstuvwxyz0123456789").repeat(6).slice(0, 400) },
  list: { heading: "나".repeat(40), intro: "다".repeat(160), items: ["아주긴서비스이름".repeat(6), "검사", "verylongservicenamewithoutspaces".repeat(3), "상담 · 진료"].join(" · ").slice(0, 400) },
  cards2: { heading: "라".repeat(40), intro: "마".repeat(160), card1Title: "바".repeat(30), card1Body: "사".repeat(120), card2Title: "w".repeat(30), card2Body: "x".repeat(120) },
  masonry: { heading: "아".repeat(40), intro: "자".repeat(160), card1Title: "차".repeat(30), card1Body: "카".repeat(120), card2Title: "타".repeat(30), card2Body: "y".repeat(120), card3Title: "z".repeat(30), card3Body: "파".repeat(120) },
};
const OVER = (SEL) => {
  const vw = document.documentElement.clientWidth;
  const res = { overflowX: document.documentElement.scrollWidth - vw };
  for (const [k, s] of Object.entries(SEL)) {
    const all = [...document.querySelector(s).querySelectorAll("*")].filter((el) => el.checkVisibility());
    res[k] = { wider: all.filter((el) => el.getBoundingClientRect().right > vw + 0.5 || el.getBoundingClientRect().left < -0.5).map((el) => el.className || el.tagName), ellipsis: all.filter((el) => { const st = getComputedStyle(el); return st.textOverflow === "ellipsis" || st.webkitLineClamp !== "none"; }).length, scrollOver: all.filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible").length };
  }
  const inputs = Object.fromEntries(Object.entries(SEL).map(([k, s]) => [k, [...document.querySelectorAll(`${s} [data-slot]`)].map((e) => e.textContent.length)]));
  res.textLens = inputs;
  return res;
};
await draw("light", { slots: LONG });
await snap("qb-15", { zoom: true });
await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
for (const w of W3) { await setSize(w); await settle(); log(`long200-${w}`, await page.evaluate(OVER, SEL)); }
await page.evaluate(() => { document.documentElement.style.fontSize = ""; });

// ⑤ 캡처용 정적 문서 — 변형별(header + 그 변형 + footer)
const CAP = { "qb-1": ["text"], "qb-2": ["list"], "qb-3": ["cards2"], "qb-4": ["masonry"] };
for (const [name, only] of Object.entries(CAP)) {
  await draw("light", { only, tones: ["base", "base", "base", "base"], slots: name === "qb-4" ? { masonry: { card1Body: "가나다라마바사 ".repeat(14).trim(), card2Body: "", card3Body: "짧은 설명" } } : name === "qb-2" ? { list: { items: "상담 · 진료 · 검사 · 예방 접종 · 건강 검진 · 재활 치료 · 영양 상담" } } : undefined });
  await snap(name);
}

await writeFile(`${DIR}/logs/qb.json`, JSON.stringify(out, null, 1));
console.log("DONE");

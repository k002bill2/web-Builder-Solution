// M2B-2a P-B 판정 — `ego-browser nodejs < qb.mjs`. render.html(127.0.0.1:4337, 이 worktree vite)을 최상위 페이지로 열고 render{doc, kitTokens}를 보낸다.
// 폭 = CDP Emulation.setDeviceMetricsOverride(1280·768·390, innerWidth 기록). 캡처는 같은 문서의 정적 HTML(static/*.html) → shots.sh(Chrome headless).
// 판정: KD-AC-02(상한+200% 넘침·말줄임) · 05(글자/면 역할 쌍·대비, light·dark × base·alt) · 06(정적 script) · 07(DOM 순서) · 08(헤딩) · 09~12 배치 · 정적 HTML 계산 스타일 동등성
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-2a/dev/active/m2b-2a";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace("m2b-2a qb-eq");
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
    const css = [...document.styleSheets].map((s) => [...s.cssRules].map((r) => r.cssText).join("\n")).join("\n");
    return window.__q.buildStaticHtml({ markup: document.querySelector("[data-site-root]").outerHTML, css, title: "qb", description: "qb" });
  });
  await writeFile(`${DIR}/static/${name}.html`, zoom ? html.replace("<html", '<html style="font-size: 200%"') : html);
  return html;
};

// 정적 HTML은 data-section을 지운다(편집기 흔적) → 섹션 루트 id(s-<instanceId>)로 찾는다
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
    res.cards2 = { n: lis.length, li: lis, sameRow: lis.length === 2 && Math.abs(lis[0].t - lis[1].t) < 1, sameHeight: lis.length === 2 && Math.abs(lis[0].h - lis[1].h) < 1, stacked: lis.length === 2 && lis[1].t >= lis[0].t + lis[0].h, gridCols: getComputedStyle(c2.querySelector("ul")).gridTemplateColumns, card: cs(c2.querySelector("li"), ["backgroundColor", "color", "borderTopWidth"]) };
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
await draw("light", { slots: { masonry: { card1Body: "가나다라마바사 ".repeat(14).trim(), card2Body: "", card3Body: "짧은 설명" } } });
await snap("qb-eq");
const live = {};
for (const w of W3) { await setSize(w); await settle(); live[w] = await page.evaluate(LAYOUT, SEL); }
await page.goto("http://127.0.0.1:4339/qb-eq.html");
for (const w of W3) {
  await setSize(w); await settle();
  const st = await page.evaluate(LAYOUT, SEL);
  const pick = (x) => JSON.stringify({ t: x.text && { box: x.text.box, style: x.text.style, body: x.text.body }, l: x.list && { sameRow: x.list.sameRow, ulStyle: x.list.ulStyle, li: x.list.li, gridCols: x.list.gridCols, ul: x.list.ul }, c: x.cards2 && { li: x.cards2.li, gridCols: x.cards2.gridCols, card: x.cards2.card }, m: x.masonry && { ulStyle: x.masonry.ulStyle, li: x.masonry.li, boxes: x.masonry.boxes } });
  const res = { same: pick(st) === pick(live[w]), found: Object.keys(JSON.parse(pick(st))).filter((k) => JSON.parse(pick(st))[k]), static: JSON.parse(pick(st)), overflowX: st.overflowX, clientWidth: st.clientWidth };
  if (!res.same) res.live = JSON.parse(pick(live[w]));
  log(`static-eq-${w}`, res);
}
await writeFile(`${DIR}/logs/qb-eq.json`, JSON.stringify(out, null, 1));
console.log("DONE");

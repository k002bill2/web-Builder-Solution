// M2B-2c P-B 판정 — `ego-browser nodejs < qb.mjs`. render.html(127.0.0.1:4337, 이 worktree vite)을 최상위 페이지로 열고 render{doc, kitTokens}를 보낸다(m2b-2b qb.mjs 구조 재사용).
// 폭 = CDP Emulation.setDeviceMetricsOverride(1280·768·390, innerWidth 기록). 캡처는 같은 문서의 정적 HTML(static/*.html, CSS = 렌더 문서 <style> 원문 — cssText 직렬화 0) → shots.sh(Chrome headless).
// 판정: 12변형 합본 KD-AC-02(상한+200%) · 05(색 쌍 + 실제 :focus-visible 링) · 06(정적 script) · 07(DOM 순서) · 08(헤딩) · 17·18·20·21(2c 배치·계산값) · 정적 HTML 계산 스타일 동등성(12변형) · 예약 정적 HTML Enter/버튼 요청·이동 0
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-2c/dev/active/m2b-2c";
const { writeFile, readFile } = await import("node:fs/promises");
const task = await taskSpace("m2b-2c qb");
const page = task.page("p1");
const H = { 1280: 900, 768: 1024, 390: 844 };
const setSize = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: H[width], deviceScaleFactor: 1, mobile: false });
await page.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
const out = {};
const log = (k, v) => { out[k] = v; console.log("QB", k, JSON.stringify(v).slice(0, 1500)); };
const settle = () => page.waitForTimeout(400);
const W3 = [1280, 768, 390];
const RENDER = "http://127.0.0.1:4337/render.html";

// 본문 12변형 (문서 순서 = 이 순서) — at about/text · sl services/list · c2 cards-2 · cm cards-masonry · g3 grid-3 · ms masonry · g2 grid-2 · st stats-3 · qt quotes-2 · pr tiers-2 · bk booking · cb banner
const KEYS = ["at", "sl", "c2", "cm", "g3", "ms", "g2", "st", "qt", "pr", "bk", "cb"];
const PAIRS = { at: ["about", "text"], sl: ["services", "list"], c2: ["services", "cards-2"], cm: ["services", "cards-masonry"], g3: ["portfolio", "grid-3"], ms: ["portfolio", "masonry"], g2: ["portfolio", "grid-2"], st: ["statistics", "stats-3"], qt: ["testimonials", "quotes-2"], pr: ["pricing", "tiers-2"], bk: ["contact", "booking"], cb: ["cta-band", "banner"] };
const SEL = Object.fromEntries(KEYS.map((k) => [k, `#s-s-${k}`]));
const ALT = KEYS.map((_, i) => (i % 2 ? "alt" : "base"));
const FLIP = KEYS.map((_, i) => (i % 2 ? "base" : "alt"));

const boot = async () => {
  await page.goto(RENDER);
  await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
  return page.evaluate(async () => {
    const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
    const { getSectionDefinition } = await import("/src/engine/sections/registry.ts");
    const { checkProfileContrast } = await import("/src/domain/profileContrast.ts");
    const { buildStaticHtml, STATIC_MENU_SCRIPT } = await import("/src/features/studio/staticHtml/staticMarkup.ts");
    const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
    const P = {
      light: { primary: "#0A5C36", surface: "#F4F0E8", ink: "#1A1A1A", muted: "#6E6E6E", bg: "#FCFBF8" },
      dark: { primary: "#757575", surface: "#EFE9F3", ink: "#000000", muted: "#5F5F66", bg: "#FAFAF7" },
    };
    const rgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
    const toks = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, { ...base, card: { tone: k === "dark" ? "dark" : "light", style: "bordered-md" }, palette: Object.fromEntries(Object.entries(p).map(([r, h]) => [r, rgb(h)])) }]));
    window.__q = { sampleDoc, section, withSections, getSectionDefinition, toks, buildStaticHtml, STATIC_MENU_SCRIPT, P };
    return { contrast: Object.fromEntries(Object.entries(P).map(([k, p]) => [k, checkProfileContrast(Object.entries(p).map(([role, hex]) => ({ role, hex })), k === "dark" ? "dark" : "light", "aa").map((c) => [c.id, Math.round(c.ratio * 100) / 100, c.pass])])) };
  });
};

// spec = { tones?, slots?: {key: slots}, only?: 키 배열, long?: true(모든 글자 슬롯 = 상한 글자) }
const draw = async (profile, spec = {}) => {
  // 렌더 문서 리스너가 붙기 전 post가 사라질 수 있어(1회차 실측: boot 직후 30초 시간 초과) 최대 3회 다시 보낸다
  for (let attempt = 1; ; attempt++) {
    await page.evaluate(([profile, spec, KEYS, PAIRS, ALT]) => {
      const { sampleDoc, section, withSections, getSectionDefinition, toks } = window.__q;
      const doc0 = sampleDoc();
      const tones = spec.tones ?? ALT;
      const FILL = "가나다라마 abcdefghij 바사아 1234567890 자차카타파하 ";
      const fill = (n, i) => (FILL.slice(i % 7) + FILL.repeat(Math.ceil(n / FILL.length) + 1)).slice(0, n).replace(/\s$/, "가");
      const keys = KEYS.filter((k) => !spec.only || spec.only.includes(k));
      const body = keys.map((k) => {
        const x = section(PAIRS[k][0], PAIRS[k][1], `s-${k}`, { tone: tones[spec.only ? keys.indexOf(k) : KEYS.indexOf(k)] });
        const long = spec.long ? Object.fromEntries(getSectionDefinition(x.type, x.variant).slots.filter((s) => s.kind !== "image").map((s, i) => [s.key, s.key === "items" ? Array.from({ length: 12 }, (_, j) => fill(30, j)).join(" · ").slice(0, s.maxLength) : fill(s.maxLength, i)])) : {};
        return { ...x, slots: { ...x.slots, ...long, ...(spec.slots?.[k] ?? {}) } };
      });
      const header = doc0.sections.find((s) => s.type === "header");
      const footer = doc0.sections.find((s) => s.type === "footer");
      window.__q.cur = toks[profile].palette;
      window.__q.want = keys.map((k) => `s-${k}`);
      window.postMessage({ type: "render", doc: withSections(doc0, [header, ...body, footer]), kitTokens: toks[profile] }, "*");
    }, [profile, spec, KEYS, PAIRS, ALT]);
    await settle();
    try {
      await page.waitForFunction(() => window.__q.want.every((id) => document.querySelector(`[data-site-root] [data-kit][data-instance-id="${id}"]`)) && document.querySelectorAll("[data-site-root] [data-kit][data-section]").length === window.__q.want.length + 2, undefined, { timeout: 10000 });
      break;
    } catch (e) {
      console.log("DRAW-RETRY", attempt, String(e).slice(0, 120));
      if (attempt >= 3) throw e;
    }
  }
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

// 계산 스타일·배치 — 렌더 문서와 정적 HTML에서 같은 함수(정적은 data-section·data-slot 제거 → id·class로 찾음)
const PROPS = ["display", "color", "backgroundColor", "fontSize", "fontWeight", "lineHeight", "gridTemplateColumns", "columnCount", "flexDirection", "paddingTop", "paddingLeft", "borderTopWidth", "borderTopColor", "borderTopLeftRadius", "opacity", "whiteSpace", "fontStyle", "marginTop"];
const STYLE = ([SEL, PROPS]) => {
  const res = { overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, innerWidth: window.innerWidth };
  for (const [k, s] of Object.entries(SEL)) {
    const root = document.querySelector(s);
    if (!root) continue;
    res[k] = [root, ...root.querySelectorAll("*")].filter((el) => el.tagName !== "SCRIPT").map((el) => { const b = el.getBoundingClientRect(); const c = getComputedStyle(el); return [el.tagName, el.className, Math.round(b.left), Math.round(b.width), Math.round(b.height), ...PROPS.map((p) => c[p])].join("|"); });
  }
  return res;
};
const LAYOUT2C = (SEL) => {
  const q = (s) => document.querySelector(s);
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(1), t: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), b: +b.bottom.toFixed(1), r: +b.right.toFixed(1) }; };
  const cs = (el, props) => (el ? Object.fromEntries(props.map((p) => [p, getComputedStyle(el)[p]])) : { missing: true });
  const rowOf = (els) => { const bs = els.map(r); return { boxes: bs, sameRow: new Set(bs.map((b) => b.t)).size === 1, stacked: bs.every((b, i) => i === 0 || b.t >= bs[i - 1].b - 0.5), sameH: new Set(bs.map((b) => b.h)).size === 1 }; };
  const res = { innerWidth: window.innerWidth, overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  const qt = q(SEL.qt);
  if (qt) {
    const lis = [...qt.querySelectorAll("li")];
    res.qt = { ...rowOf(lis), cols: getComputedStyle(qt.querySelector("ul")).gridTemplateColumns, authorAtBottom: lis.map((li) => { const cap = li.querySelector("figcaption"); const pad = parseFloat(getComputedStyle(li).paddingBottom) + parseFloat(getComputedStyle(li).borderBottomWidth); return cap ? +(li.getBoundingClientRect().bottom - pad - cap.getBoundingClientRect().bottom).toFixed(1) : null; }), quote: cs(qt.querySelector(".kit-quote-text"), ["fontSize", "fontStyle", "whiteSpace", "color"]), bq: cs(qt.querySelector("blockquote"), ["marginLeft", "marginTop"]), author: cs(qt.querySelector("figcaption"), ["fontWeight", "color", "fontSize"]), card: cs(lis[0], ["backgroundColor", "color"]) };
  }
  const pr = q(SEL.pr);
  if (pr) {
    const lis = [...pr.querySelectorAll("li")];
    const P = ["backgroundColor", "borderTopWidth", "borderTopColor", "borderLeftWidth", "borderLeftColor", "borderTopLeftRadius", "paddingTop", "paddingLeft", "boxShadow"];
    const T = ["fontSize", "fontWeight", "color", "lineHeight", "fontVariantNumeric"];
    const cards = lis.map((li) => cs(li, P));
    const prices = lis.map((li) => cs(li.querySelector(".kit-plan-price"), T));
    res.pr = { ...rowOf(lis), priceTexts: lis.map((li) => li.querySelector(".kit-plan-price")?.textContent), cardsEqual: JSON.stringify(cards[0]) === JSON.stringify(cards[1]), pricesEqual: JSON.stringify(prices[0]) === JSON.stringify(prices[1]), card: cards[0], price: prices[0], badges: pr.querySelectorAll("a, button, mark, strong, em").length };
  }
  const bk = q(SEL.bk);
  if (bk) {
    const text = bk.querySelector(".kit-contact-text"), form = bk.querySelector("form");
    const date = bk.querySelector('input[name="date"]'), time = bk.querySelector('input[name="time"]');
    const fields = [...bk.querySelectorAll("input, textarea")];
    res.bk = { twoCol: Math.abs(r(text).t - r(form).t) < 1 && r(form).l > r(text).r - 0.5, textForm: [r(text), r(form)], dateTime: [r(date), r(time)], dtSameRow: Math.abs(r(date).t - r(time).t) < 0.5 && r(time).l > r(date).r - 0.5, dtStacked: r(time).t >= r(date).b - 0.5, disabled: fields.map((f) => f.matches(":disabled")), fieldStyle: fields.map((f) => cs(f, ["color", "opacity", "webkitTextFillColor", "backgroundColor", "cursor"])), labels: [...bk.querySelectorAll("label")].map((l) => cs(l, ["color", "opacity"]).color), notice: cs(bk.querySelector(".kit-notice"), ["color", "opacity", "fontWeight"]), button: cs(bk.querySelector("button"), ["color", "backgroundColor", "opacity"]) };
  }
  const cb = q(SEL.cb);
  if (cb) {
    const text = cb.querySelector(".kit-band-text"), cta = cb.querySelector(".kit-band-cta"), wrap = cb.querySelector(".kit-band-wrap");
    const wr = r(wrap), pl = parseFloat(getComputedStyle(wrap).paddingLeft), pr2 = parseFloat(getComputedStyle(wrap).paddingRight);
    res.cb = { section: cs(cb, ["backgroundColor", "color", "borderTopLeftRadius"]), sectionW: r(cb).w, text: r(text), cta: r(cta), sameRow: r(cta).l >= r(text).r - 0.5 && r(cta).t < r(text).b && r(cta).b > r(text).t, ctaBelow: r(cta).t >= r(text).b - 0.5, ctaFull: Math.abs(r(cta).w - (wr.w - pl - pr2)) < 1, ctaStyle: cs(cta, ["backgroundColor", "color", "minHeight", "borderTopLeftRadius", "fontWeight"]), title: cs(cb.querySelector("h2"), ["color", "fontSize"]), body: cs(cb.querySelector(".kit-band-body"), ["color", "fontSize"]), href: cta.getAttribute("href") };
  }
  return res;
};

const COLORS = (sel) => {
  const P = window.__q.cur;
  const parse = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const roleOf = (c) => { const v = parse(c).slice(0, 3).join(","); const hit = Object.entries(P).find(([, p]) => parse(p).join(",") === v); return hit ? hit[0] : v === "255,255,255" ? "on-primary" : `?${v}`; };
  const faceOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) return s.backgroundColor; } return null; };
  const texts = [...document.querySelectorAll(`${sel} *`)].filter((el) => el.checkVisibility() && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const rows = texts.map((el) => { const s = getComputedStyle(el); const fg = s.color; const bg = faceOf(el) ?? "rgb(255, 255, 255)"; return { slot: el.dataset.slot ?? el.className, pair: `${roleOf(fg)}/${roleOf(bg)}`, ratio: Math.round(ratio(parse(fg), parse(bg)) * 100) / 100, opacity: s.opacity, alpha: parse(fg)[3] ?? 1 }; });
  // 링 = 실제 focus() 뒤 :focus-visible · outline 계산값(1b 하드닝 방식) · 바깥 면 = 부모의 불투명 면
  const ringOf = (el) => {
    el.focus();
    const s = getComputedStyle(el);
    const x = { t: el.textContent.trim().slice(0, 6), focused: document.activeElement === el, fv: el.matches(":focus-visible"), style: s.outlineStyle, width: parseFloat(s.outlineWidth), offset: parseFloat(s.outlineOffset), color: s.outlineColor };
    el.blur();
    const face = faceOf(el.parentElement);
    x.pair = `${roleOf(x.color)}/${face ? roleOf(face) : "?"}`;
    x.ratio = face ? Math.round(ratio(parse(x.color), parse(face)) * 100) / 100 : null;
    return x;
  };
  const rings = [...document.querySelectorAll(`${sel} a, ${sel} button:not(:disabled), ${sel} summary`)].filter((el) => el.checkVisibility()).map(ringOf);
  const focusables = [...document.querySelectorAll(`${sel} a[href], ${sel} button, ${sel} input, ${sel} textarea, ${sel} [tabindex]`)].filter((el) => !el.matches(":disabled")).length;
  return { rows, rings, focusables };
};
// C-1 on-primary/primary · C-1 뒤집기 primary/on-primary(CTA만) · C-2 ink/bg · C-3 ink/primary · C-4 ink/surface · C-5 muted/bg
const ALLOWED = new Set(["on-primary/primary", "primary/on-primary", "ink/bg", "ink/primary", "ink/surface", "muted/bg"]);
const RING_OK = new Set(["on-primary/primary", "ink/bg", "ink/surface", "ink/primary"]);
const judge = (c) => ({
  n: c.rows.length,
  bad: c.rows.filter((x) => !ALLOWED.has(x.pair) || x.ratio < 4.5 || x.opacity !== "1" || x.alpha !== 1 || (x.pair.startsWith("primary/") && x.slot !== "cta")),
  min: c.rows.length ? Math.min(...c.rows.map((x) => x.ratio)) : null,
  pairs: [...new Set(c.rows.map((x) => x.pair))],
  focusables: c.focusables,
  rings: c.rings.map((x) => `${x.t}:${x.pair}:${x.ratio}:fv=${x.fv}:${x.style}`),
  badRings: c.rings.filter((x) => !x.focused || !x.fv || x.style === "none" || !(x.width > 0) || !RING_OK.has(x.pair) || x.ratio === null || x.ratio < 3).map((x) => JSON.stringify(x)),
});

log("boot", await boot());
await setSize(1280);

// ⓪ KD-AC-07 · 08 · 06 — 12변형 합본
await draw("light");
log("headings-order", await page.evaluate(([SEL, KEYS]) => {
  const secs = KEYS.map((k) => document.querySelector(SEL[k]));
  return { docOrder: secs.every((s, i) => i === 0 || secs[i - 1].compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING), kit: secs.map((s) => s.hasAttribute("data-kit")), fallback: document.querySelectorAll("[data-fallback], [data-kit-marker]").length, per: Object.fromEntries(KEYS.map((k, i) => [k, { h2: secs[i].querySelectorAll("h2").length, h3: secs[i].querySelectorAll("h3").length, slots: [...secs[i].querySelectorAll("[data-slot]")].map((e) => e.dataset.slot).join(",") }])), cbHref: document.querySelector(`${SEL.cb} a`)?.getAttribute("href") };
}, [SEL, KEYS]));
const eqHtml = await snap("qb-eq");
log("static-scripts", await page.evaluate((html) => { const d = new DOMParser().parseFromString(html, "text/html"); const s = [...d.querySelectorAll("script")]; return { n: s.length, sameBytes: s.length === 1 && s[0].textContent === window.__q.STATIC_MENU_SCRIPT, onAttrs: [...d.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.name)).filter((n) => n.startsWith("on")).length, hrefHash: d.querySelectorAll('[href="#"]').length, forms: [...d.querySelectorAll("form")].map((f) => [f.getAttribute("action"), f.getAttribute("method")]), placeholders: d.querySelectorAll("[placeholder]").length }; }, eqHtml));

// ① 2c 배치 3폭 (KD-AC-17·18·20·21) + 12변형 계산 스타일(동등성 기준) — pricing 1번 '문의' · 2번 '99,000'
await draw("light", { slots: { pr: { plan1Price: "문의", plan2Price: "99,000" } } });
await snap("qb-eq2");
const live = {};
for (const w of W3) { await setSize(w); await settle(); log(`layout-${w}`, await page.evaluate(LAYOUT2C, SEL)); live[w] = await page.evaluate(STYLE, [SEL, PROPS]); }
// cta-band alt 톤도 같은 면
await draw("light", { tones: FLIP, slots: { pr: { plan1Price: "문의", plan2Price: "99,000" } } });
await setSize(1280); await settle();
log("cb-alt-tone", await page.evaluate((s) => ({ tone: document.querySelector(s).dataset.tone, bg: getComputedStyle(document.querySelector(s)).backgroundColor }), SEL.cb));

// ② 정적 HTML 계산 스타일 동등성 — 같은 문서(qb-eq2)를 4339에서, 12변형 모든 요소 · 3폭
await page.goto("http://127.0.0.1:4339/qb-eq2.html");
for (const w of W3) {
  await setSize(w); await settle();
  const st = await page.evaluate(STYLE, [SEL, PROPS]);
  const diff = {};
  for (const k of KEYS) { const a = live[w][k] ?? [], b = st[k] ?? []; const d = a.map((x, i) => (x === b[i] ? null : { live: x, static: b[i] })).filter(Boolean); if (d.length || a.length !== b.length) diff[k] = { n: [a.length, b.length], d: d.slice(0, 3) }; }
  log(`static-eq-${w}`, { same: Object.keys(diff).length === 0, elements: KEYS.reduce((n, k) => n + (st[k]?.length ?? 0), 0), overflowX: st.overflowX, innerWidth: st.innerWidth, diff });
}

// ③ KD-AC-20 정적 HTML 예약 폼 — Enter · 버튼 클릭 → 이동·요청 0 (4339 서버 로그 줄 수 + performance + location + submit 이벤트)
await page.evaluate(() => 0);
await boot();
await draw("light", { only: ["bk"], tones: ["base"] });
await snap("qb-11");
await page.goto("http://127.0.0.1:4339/qb-11.html");
await setSize(1280); await settle();
const logLines = async () => (await readFile(`${DIR}/logs/server-4339.txt`, "utf8")).split("\n").filter((l) => l.includes("GET") || l.includes("POST")).length;
const before = { server: await logLines(), page: await page.evaluate(() => { window.__sub = 0; document.addEventListener("submit", () => window.__sub++, true); return { href: location.href, res: performance.getEntriesByType("resource").length, nav: performance.getEntriesByType("navigation").length }; }) };
const pts = await page.evaluate(() => { const c = (el) => { el.scrollIntoView({ block: "center" }); const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }; return { input: c(document.querySelector('input[name="name"]')), button: c(document.querySelector('button[type="submit"]')), label: c(document.querySelector("label.kit-label")) }; });
await page.mouse.click(pts.input[0], pts.input[1]);
const focusAfterClick = await page.evaluate(() => document.activeElement.tagName);
for (const t of ["keyDown", "keyUp"]) await page.cdp("Input.dispatchKeyEvent", { type: t, key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, ...(t === "keyDown" ? { text: "\r" } : {}) });
await page.mouse.click(pts.button[0], pts.button[1]);
await page.mouse.click(pts.label[0], pts.label[1]);
for (const t of ["keyDown", "keyUp"]) await page.cdp("Input.dispatchKeyEvent", { type: t, key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, ...(t === "keyDown" ? { text: "\r" } : {}) });
await page.waitForTimeout(1200);
const after = { server: await logLines(), page: await page.evaluate(() => ({ href: location.href, res: performance.getEntriesByType("resource").length, nav: performance.getEntriesByType("navigation").length, submits: window.__sub, active: document.activeElement.tagName, fieldsetDisabled: document.querySelector("fieldset").disabled })) };
log("booking-static-submit", { before, after, focusAfterClick, moved: before.page.href !== after.page.href, newServerRequests: after.server - before.server, newResources: after.page.res - before.page.res });

// ④ KD-AC-05 색 조합 + 링 — light·dark × 톤(교대 + 뒤집기) × 3폭 · 12변형
await boot();
for (const profile of ["light", "dark"]) for (const tones of [ALT, FLIP]) {
  await draw(profile, { tones });
  for (const w of W3) {
    await setSize(w); await settle();
    const res = {};
    for (const [k, s] of Object.entries(SEL)) res[k] = judge(await page.evaluate(COLORS, s));
    log(`colors-${profile}-${tones[0]}-${w}`, { bad: Object.fromEntries(Object.entries(res).filter(([, v]) => v.bad.length || v.badRings.length).map(([k, v]) => [k, { bad: v.bad, badRings: v.badRings }])), pairs: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.pairs.join(" ")])), min: Math.min(...Object.values(res).map((v) => v.min ?? 99)), rings: res.cb.rings, focusables: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.focusables])) });
  }
  if (profile === "light") await snap(tones === ALT ? "qb-13" : "qb-13-flip");
  if (profile === "dark" && tones === ALT) { await draw("dark", { only: ["c2", "cm", "qt", "pr"], tones: ["base", "alt", "base", "alt"] }); await snap("qb-14"); }
}

// ⑤ KD-AC-02 / QB-15 상한 글자 + 글자 200% — 12변형 모든 글자 슬롯 상한
// (재개 보정) scrollOver = 보이는 요소의 내부 넘침. clip-path inset(50%)로 완전히 잘린 스크린리더 전용 요소(.kit-visually-hidden legend — baseline 2369a3e contact/form부터 존재)는 그릴 내용이 없어 제외하고 scrollOverRaw·clippedExcluded로 원시값을 함께 남긴다(logs/over-probe.txt 근거). 문서 overflowX(KD-AC-02 문자 그대로)는 그대로.
const OVER = (SEL) => {
  const vw = document.documentElement.clientWidth;
  const res = { overflowX: document.documentElement.scrollWidth - vw };
  const inter = (a, b) => !(a.right <= b.left + 0.5 || b.right <= a.left + 0.5 || a.bottom <= b.top + 0.5 || b.bottom <= a.top + 0.5);
  const overlaps = (els) => { const r = els.map((e) => e.getBoundingClientRect()); let n = 0; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (inter(r[i], r[j])) n++; return n; };
  for (const [k, s] of Object.entries(SEL)) {
    const root = document.querySelector(s);
    const all = [...root.querySelectorAll("*")].filter((el) => el.checkVisibility());
    res[k] = { wider: all.filter((el) => el.getBoundingClientRect().right > vw + 0.5 || el.getBoundingClientRect().left < -0.5).map((el) => el.className || el.tagName).slice(0, 5), ellipsis: all.filter((el) => { const st = getComputedStyle(el); return st.textOverflow === "ellipsis" || st.webkitLineClamp !== "none"; }).length, scrollOver: all.filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible" && getComputedStyle(el).clipPath !== "inset(50%)").length, scrollOverRaw: all.filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible").length, clippedExcluded: all.filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible" && getComputedStyle(el).clipPath === "inset(50%)").map((el) => ({ tag: el.tagName, cls: String(el.className), clipPath: getComputedStyle(el).clipPath, sw: el.scrollWidth, cw: el.clientWidth, text: el.textContent })), overlap: overlaps([...root.querySelectorAll(":scope li, :scope figure, :scope .kit-control, :scope .kit-band-text, :scope .kit-band-cta")].filter((el) => el.checkVisibility() && !el.parentElement.closest("li, figure"))) };
  }
  return res;
};
await draw("light", { long: true });
await snap("qb-15", { zoom: true });
await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
for (const w of W3) { await setSize(w); await settle(); const o = await page.evaluate(OVER, SEL); log(`long200-${w}`, { overflowX: o.overflowX, excluded: Object.fromEntries(KEYS.filter((k) => o[k].clippedExcluded.length).map((k) => [k, o[k].clippedExcluded])), bad: Object.fromEntries(KEYS.filter((k) => o[k].wider.length || o[k].ellipsis || o[k].scrollOver || o[k].overlap).map((k) => [k, o[k]])) }); }
await page.evaluate(() => { document.documentElement.style.fontSize = ""; });

await writeFile(`${DIR}/logs/qb.json`, JSON.stringify(out, null, 1));
// ⑥ 캡처용 정적 문서 — 변형별(header + 그 변형 + footer) · QB-12 링 = 실제 포커스 뷰포트 캡처(렌더 문서 최상위 페이지, scrollIntoView)
const CAP = { "qb-9": ["qt"], "qb-10": ["pr"], "qb-12": ["cb"] };
for (const [name, only] of Object.entries(CAP)) { await draw("light", { only, tones: ["base"], slots: { pr: { plan1Price: "문의", plan2Price: "99,000" } } }); await snap(name); }
await draw("light", { only: ["cb"], tones: ["base"] });
for (const w of W3) {
  await setSize(w); await settle();
  const ok = await page.evaluate((s) => { const a = document.querySelector(`${s} a`); a.scrollIntoView({ block: "center" }); a.focus(); return a.matches(":focus-visible"); }, SEL.cb);
  await settle();
  let shot = "fail";
  for (let i = 1; i <= 2 && shot === "fail"; i++) {
    try { await page.screenshot({ path: `${DIR}/shots/qb-12-ring-${w}.png` }); shot = `ok(try ${i})`; } catch (e) { console.log("SHOT-RETRY", w, i, String(e).slice(0, 100)); }
  }
  log(`ring-shot-${w}`, { focusVisible: ok, shot });
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/qb.json`, JSON.stringify(out, null, 1));
console.log("DONE");

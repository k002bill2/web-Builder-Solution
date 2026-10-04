// M2B-1b 브라우저 판정 [B]·[V] — `ego-browser nodejs < qb.mjs`. m2b-1a qb.mjs 방식: render.html을 최상위 페이지로 열고 페이지가 render{doc, kitTokens}를 스스로 보낸다.
// 문서 = sampleDoc의 s-header · s-hero · s-footer 자리만 바꾼 것. 캡처는 같은 문서의 정적 HTML(static/*.html) → shots.sh(Chrome headless, 뷰포트만).
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-1b/dev/active/m2b-1b";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace("m2b-1b qb");
const page = task.page("p1");
const H = { 1280: 900, 768: 1024, 390: 844 };
const setSize = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: H[width], deviceScaleFactor: 1, mobile: false });
const out = {};
const log = (k, v) => { out[k] = v; console.log("QB", k, JSON.stringify(v)); };
const settle = () => page.waitForTimeout(350);
const W3 = [1280, 768, 390];

await setSize(1280);
await page.goto("http://127.0.0.1:4337/render.html");
await page.cdp("Emulation.setFocusEmulationEnabled", { enabled: true }); // 배경 탭에서도 focus()가 :focus-visible을 맞추게(링 실측, COLORS ringOf)
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

// spec = { header, hero: { v, tone, off }, noHero, footer, footerTone, headerSlots, footerSlots, dropFallback }
const draw = async (profile, spec) => {
  await page.evaluate(([profile, spec]) => {
    const { sampleDoc, section, withSections, toks } = window.__q;
    const slots = (x, over) => (over ? { ...x, slots: { ...x.slots, ...over } } : x);
    const doc0 = sampleDoc();
    const sections = doc0.sections.flatMap((s) => {
      if (s.instanceId === "s-header" && spec.header) return [slots(section("header", spec.header, "s-header"), spec.headerSlots)];
      if (s.instanceId === "s-hero") {
        if (spec.noHero) return [];
        if (!spec.hero) return [s];
        let x = section("hero", spec.hero.v, "s-hero", { tone: spec.hero.tone ?? "alt" });
        if (spec.hero.off && x.slots.image) x = slots(x, { image: { ...x.slots.image, enabled: false } });
        return [x];
      }
      if (s.instanceId === "s-footer" && spec.footer) {
        const x = slots(section("footer", spec.footer, "s-footer", { tone: spec.footerTone ?? "alt" }), spec.footerSlots);
        return [spec.mapOff ? slots(x, { map: { ...x.slots.map, enabled: false } }) : x];
      }
      if (spec.dropFallback && s.type === "cta-band") return [];
      return [s];
    });
    window.__q.cur = toks[profile].palette;
    window.postMessage({ type: "render", doc: withSections(doc0, sections), kitTokens: toks[profile] }, "*");
  }, [profile, spec]);
  await settle();
};

// 정적 HTML 저장 — plain = 내보내기 그대로(QB-14) · cap = 캡처 전용 사본(시트 열기·footer로 스크롤 한 줄, 내보내기와 무관)
const snap = async (name, { open = false, foot = false } = {}) => {
  const html = await page.evaluate(() => {
    const css = [...document.styleSheets].map((s) => [...s.cssRules].map((r) => r.cssText).join("\n")).join("\n");
    return window.__q.buildStaticHtml({ markup: document.querySelector("[data-site-root]").outerHTML, css, title: "qb", description: "qb" });
  });
  await writeFile(`${DIR}/static/${name}.html`, html);
  if (open || foot) {
    const line = open ? 'document.getElementById("m-s-header").showPopover();' : 'document.getElementById("s-s-footer").scrollIntoView({block:"end"});';
    await writeFile(`${DIR}/static/${name}-cap.html`, html.replace("</body>", `<script>/* 캡처 전용 */${line}</script></body>`));
  }
};

// 글자 요소 × 가장 가까운 불투명 배경 → 역할 쌍 · 대비 (1a COLORS)
const COLORS = (sel) => {
  const P = window.__q.cur;
  const parse = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const roleOf = (c) => { const v = parse(c).slice(0, 3).join(","); const hit = Object.entries(P).find(([, p]) => parse(p).join(",") === v); return hit ? hit[0] : v === "255,255,255" ? "on-primary" : `?${v}`; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) return s.backgroundColor; } return "rgb(255, 255, 255)"; };
  const under = (suf) => sel.split(",").map((x) => `${x.trim()} ${suf}`).join(", "); // 쉼표 선택자 각 부분에 붙인다(".kit-bar, .kit-tier" + " *")
  const texts = [...document.querySelectorAll(under("*"))].filter((el) => el.checkVisibility() && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const rows = texts.map((el) => { const fg = getComputedStyle(el).color; const bg = bgOf(el); return { slot: el.dataset.slot ?? el.tagName, pair: `${roleOf(fg)}/${roleOf(bg)}`, ratio: Math.round(ratio(parse(fg), parse(bg)) * 100) / 100 }; });
  // 링 = 실제로 포커스해 :focus-visible 계산 outline-color를 읽는다(--kit-ring 미지정 시 CSS 폴백 --site-ink까지 반영). 링이 안 그려지면 "?none"으로 실패 처리
  const ringOf = (el) => { el.focus(); const s = getComputedStyle(el); const c = el.matches(":focus-visible") && s.outlineStyle !== "none" ? roleOf(s.outlineColor) : "?none"; el.blur(); return c; };
  const rings = [...document.querySelectorAll(`${under("button")}, ${under("a")}`)].filter((el) => el.checkVisibility()).map((el) => `${el.textContent.trim().slice(0, 4)}:${ringOf(el)}/${roleOf(bgOf(el))}`);
  return { rows, rings };
};
const ALLOWED = new Set(["on-primary/primary", "primary/on-primary", "ink/bg", "ink/surface", "muted/bg", "bg/ink"]);
const RING_OK = new Set(["on-primary/primary", "ink/bg", "ink/surface", "bg/ink", "ink/primary"]); // 링 = 그 면의 알아보는 경계(바깥 on-primary · 안쪽 간격 면). ink/primary = K1-1 CTA(primary 버튼) 링 — 면은 bar의 bg
const judge = (c) => ({ n: c.rows.length, bad: c.rows.filter((x) => !ALLOWED.has(x.pair) || x.ratio < 4.5), min: Math.min(...c.rows.map((x) => x.ratio)), pairs: [...new Set(c.rows.map((x) => x.pair))], rings: c.rings, badRings: c.rings.filter((r) => !RING_OK.has(r.split(":")[1])) });

// header 폭별 상태 (KB-AC-01·02·04)
const HSTATE = (v) => {
  const h = document.querySelector(`[data-section="header/${v}"]`);
  const vis = (el) => !!el && el.checkVisibility();
  const navVis = () => [...document.querySelectorAll("nav")].filter(vis).length;
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), right: +r.right.toFixed(1), w: +r.width.toFixed(1), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1) }; };
  const btn = h.querySelector(".kit-bar > button");
  const sheet = h.querySelector("[popover]");
  const tier = h.querySelector(".kit-tier");
  const closed = { btnVisible: vis(btn), btnDisplay: btn && getComputedStyle(btn).display, barNavVisible: vis(h.querySelector(".kit-bar nav")), barNav: h.querySelectorAll(".kit-bar nav").length, tierVisible: vis(tier), navVisible: navVis(), sheetOpen: sheet?.matches(":popover-open") ?? null };
  let open = null;
  if (vis(btn)) {
    btn.click();
    const kids = [...sheet.children].filter(vis).map((el) => el.tagName + (el.dataset.slot ? `[${el.dataset.slot}]` : el.querySelector("[data-slot]") ? `>${el.querySelector("[data-slot]").dataset.slot}` : ""));
    open = { isOpen: sheet.matches(":popover-open"), navVisible: navVis(), visibleChildren: kids, rect: rect(sheet), vw: document.documentElement.clientWidth };
    sheet.hidePopover();
  }
  return { closed, open, header: rect(h), position: getComputedStyle(h).position };
};

// 앵커 이동 뒤 본문 제목 위 끝 ≥ header 아래 끝 (KB-AC-06) — scrollIntoView = scroll-margin-top 적용
const ANCHORS = (doc) => {
  const d = doc ?? document;
  const header = d.querySelector("header");
  return ["s-s-about", "s-s-services", "s-s-faq", "s-s-contact"].map((id) => {
    const s = d.getElementById(id);
    if (!s) return null;
    s.scrollIntoView({ block: "start" });
    const hb = header.getBoundingClientRect().bottom;
    const t = s.querySelector("h2").getBoundingClientRect().top;
    return { id, h2Top: +t.toFixed(1), headerBottom: +hb.toFixed(1), ok: t >= hb - 0.5, smt: d.defaultView.getComputedStyle(s).scrollMarginTop };
  });
};

// ① QB-1·2 · KB-AC-01·02·04 · KB-AC-06 (light, 기본 슬롯)
for (const v of ["sticky-hamburger", "sticky-two-tier"]) {
  await draw("light", { header: v, dropFallback: true });
  if (v === "sticky-hamburger") { await snap("qb-1-hamburger", { open: true }); } else { await snap("qb-2-two-tier", { open: true }); }
  for (const w of W3) {
    await setSize(w); await settle();
    await page.evaluate(() => scrollTo(0, 0));
    log(`hstate-${v}-${w}`, await page.evaluate(HSTATE, v));
    log(`anchors-${v}-${w}`, await page.evaluate(ANCHORS));
    await page.evaluate(() => scrollTo(0, 0));
  }
}
// two-tier 여백 확대 대조: 같은 문서의 sticky-right-cta 여백
await draw("light", { dropFallback: true });
log("smt-right-cta", await page.evaluate(() => getComputedStyle(document.getElementById("s-s-about")).scrollMarginTop));

// ② QB-3·4 · KB-AC-08 transparent 위치·겹침 (hero center · fullbleed-left 이미지 · split alt · 첫 본문 about)
const CLEAR = [["center", { hero: { v: "center" } }], ["fullbleed", { hero: { v: "fullbleed-left" } }], ["split-alt", { hero: { v: "split", tone: "alt" } }], ["split-base", { hero: { v: "split", tone: "base" } }], ["none", { noHero: true }]];
for (const [k, spec] of CLEAR) {
  await draw("light", { header: "transparent", dropFallback: true, ...spec });
  if (k === "center") await snap("qb-3-transparent-center");
  if (k === "fullbleed") await snap("qb-4-transparent-fullbleed");
  for (const w of W3) {
    await setSize(w); await settle();
    await page.evaluate(() => scrollTo(0, 0));
    log(`clear-${k}-${w}`, await page.evaluate(() => {
      const h = document.querySelector('[data-section="header/transparent"]');
      const next = h.parentElement.querySelector("main > :first-child");
      const s = getComputedStyle(h);
      const hb = h.getBoundingClientRect().bottom, nt = next.getBoundingClientRect().top;
      return { position: s.position, surface: h.dataset.surface, bg: s.backgroundColor, nextBg: getComputedStyle(next).backgroundColor, borderBottom: `${s.borderBottomWidth} ${s.borderBottomStyle}`, headerBottom: +hb.toFixed(1), nextTop: +nt.toFixed(1), overlap: Math.max(0, hb - nt) };
    }));
  }
}

// ③ KB-AC-09 · 34 대비: 프로필 light·dark × 톤 base·alt × 6변형 × 1280·390 (+ transparent 면 3종 × 바/열린 시트 768·390)
const sheetColors = async (v) => page.evaluate(([v, COLORS_SRC]) => {
  const COLORS = eval(COLORS_SRC);
  const h = document.querySelector(`[data-section="header/${v}"]`);
  const btn = h.querySelector(".kit-bar > button");
  if (!btn || !btn.checkVisibility()) return null;
  btn.click();
  const r = COLORS(`[data-section="header/${v}"] .kit-sheet`);
  h.querySelector("[popover]").hidePopover();
  return r;
}, [v, `(${COLORS.toString()})`]);
for (const profile of ["light", "dark"]) for (const tone of ["base", "alt"]) {
  for (const v of ["sticky-hamburger", "sticky-two-tier"]) {
    await draw(profile, { header: v, hero: { v: "split", tone } });
    for (const w of [1280, 768, 390]) {
      await setSize(w); await settle();
      const sheet = await sheetColors(v);
      log(`colors-${profile}-${tone}-${v}-${w}`, { bar: judge(await page.evaluate(COLORS, `[data-section="header/${v}"] .kit-bar, [data-section="header/${v}"] .kit-tier`)), sheet: sheet && judge(sheet) });
    }
  }
  for (const [k, hero] of [["primary", { v: "center", tone }], ["surface", { v: "split", tone: "alt" }], ["bg", { v: "split", tone: "base" }]]) {
    await draw(profile, { header: "transparent", hero });
    for (const w of [1280, 768, 390]) {
      await setSize(w); await settle();
      const sheet = await sheetColors("transparent");
      log(`colors-${profile}-${tone}-transparent-${k}-${w}`, { surface: await page.evaluate(() => document.querySelector('[data-section="header/transparent"]').dataset.surface), bar: judge(await page.evaluate(COLORS, '[data-section="header/transparent"] .kit-bar')), sheet: sheet && judge(sheet) });
    }
  }
  for (const v of ["biz-extended-map", "minimal", "minimal-biz"]) {
    await draw(profile, { footer: v, footerTone: tone });
    for (const w of [1280, 390]) {
      await setSize(w); await settle();
      log(`colors-${profile}-${tone}-${v}-${w}`, judge(await page.evaluate(COLORS, `[data-section="footer/${v}"]`)));
    }
  }
}

// ④ QB-10 · KB-AC-24·25 지도 footer 배치 · QB-11 · KB-AC-26·29 미니멀 계산 스타일
const FBOX = (v) => {
  const f = document.querySelector(`[data-section="footer/${v}"]`);
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +(b.y + scrollY).toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), bottom: +(b.bottom + scrollY).toFixed(1) }; };
  const s = (el, props) => el ? Object.fromEntries(props.map((p) => [p, getComputedStyle(el)[p]])) : null;
  return {
    address: r(f.querySelector("address")), links: r(f.querySelector("ul")), figure: r(f.querySelector("figure")), copy: r(f.querySelector('[data-slot="copyright"]')),
    mapBorder: s(f.querySelector("figure"), ["borderTopColor", "borderTopWidth", "borderRadius"]),
    root: s(f, ["backgroundColor", "borderTopWidth", "borderTopStyle", "borderTopColor", "paddingTop"]),
    line: s(f.firstElementChild, ["display", "flexDirection", "justifyContent", "paddingTop", "paddingBottom"]),
    ul: s(f.querySelector("ul"), ["color", "fontWeight", "fontSize", "display", "justifyContent", "columnGap"]),
    lead: s(f.querySelector('[data-slot="copyright"], [data-slot="businessInfo"]'), ["color", "fontSize", "whiteSpace", "fontStyle"]),
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
};
await draw("light", { footer: "biz-extended-map", dropFallback: true });
await snap("qb-10-map", { foot: true });
for (const w of W3) { await setSize(w); await settle(); log(`map-${w}`, await page.evaluate(FBOX, "biz-extended-map")); }
await draw("light", { footer: "biz-extended-map", mapOff: true });
for (const w of [1280, 390]) { await setSize(w); await settle(); log(`map-off-${w}`, await page.evaluate(FBOX, "biz-extended-map")); }
for (const v of ["minimal", "minimal-biz"]) {
  await draw("light", { footer: v, dropFallback: true });
  await snap(`qb-11-${v}`, { foot: true });
  for (const w of W3) { await setSize(w); await settle(); log(`min-${v}-${w}`, await page.evaluate(FBOX, v)); }
}

// ⑤ KB-AC-31 상한 글자 + 글자 200% → 1280·768·390 가로 넘침 0 · 밖으로 나간 요소 0 · 말줄임 0 (header는 열린 시트도)
const LONG = {
  header: { brand: "가나다라마바사아자차카타파하거너더러머버서어저처", nav: Array.from({ length: 10 }, (_, i) => `메뉴항목${i}번`).join(" · ").slice(0, 80), utility: "로그인하기와회원가입 · 고객센터문의하기안내 · 주문배송조회".slice(0, 40) },
  "biz-extended-map": { businessInfo: "상호명이아주긴회사이름입니다 · 대표자 홍길동 · 사업자등록번호 123-45-67890 · 주소 서울특별시 어느구 어느로 123 어느빌딩 4층 · 통신판매업신고 2026-서울어느-0000 · 전화 02-000-0000 · 이메일 contact@example.invalid · 개인정보관리책임자 홍길동 · 호스팅 제공자".slice(0, 200), links: Array.from({ length: 8 }, (_, i) => `하단링크항목${i}`).join(" · ").slice(0, 80), copyright: "© 상호명이아주긴회사이름입니다 All rights reserved 2026 어느 회사의 저작권 문구입니다".slice(0, 60) },
  minimal: { links: Array.from({ length: 8 }, (_, i) => `하단링크항목${i}`).join(" · ").slice(0, 80), copyright: "© 상호명이아주긴회사이름입니다 All rights reserved 2026 어느 회사의 저작권 문구입니다".slice(0, 60) },
  "minimal-biz": { links: Array.from({ length: 8 }, (_, i) => `하단링크항목${i}`).join(" · ").slice(0, 80), businessInfo: "상호명이아주긴회사이름입니다 · 대표자 홍길동 · 사업자등록번호 123-45-67890 · 주소 서울특별시 어느구 어느로 123 어느빌딩 4층 · 전화번호".slice(0, 100) },
};
const OVER = (sel) => {
  const root = document.querySelector(sel);
  const vw = document.documentElement.clientWidth;
  const all = [...root.querySelectorAll("*")].filter((el) => el.checkVisibility());
  return { overflowX: document.documentElement.scrollWidth - vw, wider: all.filter((el) => el.getBoundingClientRect().right > vw + 0.5 || el.getBoundingClientRect().left < -0.5).map((el) => el.className || el.tagName), ellipsis: all.filter((el) => { const s = getComputedStyle(el); return s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none"; }).length };
};
for (const [type, v] of [["header", "sticky-hamburger"], ["header", "sticky-two-tier"], ["header", "transparent"], ["footer", "biz-extended-map"], ["footer", "minimal"], ["footer", "minimal-biz"]]) {
  const spec = type === "header" ? { header: v, headerSlots: Object.fromEntries(Object.entries(LONG.header).filter(([k]) => v === "sticky-two-tier" || k !== "utility")) } : { footer: v, footerSlots: LONG[v] };
  await draw("light", spec);
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const res = {};
  for (const w of W3) {
    await setSize(w); await settle();
    const sel = `[data-section="${type}/${v}"]`;
    const closed = await page.evaluate(OVER, sel);
    const open = type === "header" ? await page.evaluate((sel) => { const b = document.querySelector(`${sel} .kit-bar > button`); if (!b || !b.checkVisibility()) return null; b.click(); const p = document.querySelector(`${sel} [popover]`); const vw = document.documentElement.clientWidth; const r = [...p.querySelectorAll("*")].filter((el) => el.checkVisibility() && el.getBoundingClientRect().right > vw + 0.5).length; const sr = p.getBoundingClientRect(); p.hidePopover(); return { widerInSheet: r, sheetRight: +sr.right.toFixed(1), vw }; }, sel) : null;
    res[w] = { closed, open };
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  log(`long200-${v}`, res);
}

// ⑥ QB-13 다른 프로필(ink가 밝은 팔레트) 1280·390 — 6변형 성립 + 대비
for (const [type, v] of [["header", "sticky-hamburger"], ["header", "sticky-two-tier"], ["header", "transparent"], ["footer", "biz-extended-map"], ["footer", "minimal"], ["footer", "minimal-biz"]]) {
  await draw("bright", type === "header" ? { header: v, hero: v === "transparent" ? { v: "center" } : undefined, dropFallback: true } : { footer: v, dropFallback: true });
  await snap(`qb-13-${v}`, { foot: type === "footer" });
  for (const w of [1280, 390]) {
    await setSize(w); await settle();
    const sel = `[data-section="${type}/${v}"]`;
    const bar = judge(await page.evaluate(COLORS, sel));
    const sheet = type === "header" ? await sheetColors(v) : null;
    log(`qb13-${v}-${w}`, { bar, sheet: sheet && judge(sheet), overflowX: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) });
  }
}

// ⑦ KB-AC-35 [B] 정적 HTML — 같은 폭 iframe(srcdoc, 검사용)에서 계산 스타일 = 캔버스 · 앵커 이동 뒤 제목이 header에 안 가림 · script 1
const STYLE = (doc) => {
  const g = (el, props) => el ? Object.fromEntries(props.map((p) => [p, doc.defaultView.getComputedStyle(el)[p]])) : null;
  const h = doc.querySelector("header"), f = doc.querySelector("footer");
  return {
    header: g(h, ["position", "backgroundColor", "color", "borderBottomWidth", "borderBottomColor"]),
    tier: g(h.querySelector(".kit-tier"), ["display", "fontSize"]),
    barNav: g(h.querySelector(".kit-bar nav"), ["display"]),
    button: g(h.querySelector(".kit-bar > button"), ["display", "color", "backgroundColor", "borderTopColor"]),
    brand: g(h.querySelector(".kit-brand"), ["color"]),
    menuItem: g(h.querySelector(".kit-bar .kit-menu :is(a, span)"), ["color"]),
    about: g(doc.getElementById("s-s-about"), ["scrollMarginTop"]),
    footer: g(f, ["backgroundColor", "color", "borderTopWidth", "borderTopColor", "fontSize"]),
    footerTop: g(f.querySelector(".kit-footer-top, .kit-footer-line"), ["display", "gridTemplateColumns", "flexDirection"]),
    footerLead: g(f.querySelector(".kit-footer-copy, .kit-footer-info"), ["color", "whiteSpace"]),
    map: g(f.querySelector("figure"), ["borderTopColor", "borderRadius"]),
  };
};
const STATIC_DOCS = [
  ["hamburger", { header: "sticky-hamburger" }], ["two-tier", { header: "sticky-two-tier" }], ["two-tier-nonav", { header: "sticky-two-tier", headerSlots: { nav: "" } }],
  ["clear-primary", { header: "transparent", hero: { v: "center" } }], ["clear-surface", { header: "transparent", hero: { v: "split", tone: "alt" } }], ["clear-media", { header: "transparent" }], ["clear-edge", { header: "transparent", noHero: true }],
  ["map", { footer: "biz-extended-map" }], ["minimal", { footer: "minimal" }], ["minimal-biz", { footer: "minimal-biz" }],
];
for (const [k, spec] of STATIC_DOCS) {
  await draw("light", { ...spec, dropFallback: true });
  for (const w of W3) {
    await setSize(w); await settle();
    await page.evaluate(() => scrollTo(0, 0));
    const res = await page.evaluate(async ([w, STYLE_SRC, ANCHORS_SRC]) => {
      const STYLE = eval(STYLE_SRC), ANCHORS = eval(ANCHORS_SRC);
      const canvas = STYLE(document);
      const css = [...document.styleSheets].map((s) => [...s.cssRules].map((r) => r.cssText).join("\n")).join("\n");
      const html = window.__q.buildStaticHtml({ markup: document.querySelector("[data-site-root]").outerHTML, css, title: "t", description: "d" });
      const f = document.createElement("iframe");
      f.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:900px;border:0`;
      document.body.appendChild(f);
      await new Promise((ok) => { f.onload = ok; f.srcdoc = html; });
      const d = f.contentDocument;
      const stat = STYLE(d);
      const anchors = ANCHORS(d);
      const scripts = d.querySelectorAll("script").length;
      f.remove();
      const same = JSON.stringify(canvas) === JSON.stringify(stat);
      return { same, diff: same ? null : { canvas, stat }, anchorsOk: anchors.every((a) => !a || a.ok), anchors, scripts };
    }, [w, `(${STYLE.toString()})`, `(${ANCHORS.toString()})`]);
    log(`static-${k}-${w}`, res);
  }
}

await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/qb-b.json`, JSON.stringify(out, null, 1));
await task.finish({ keep: [] });

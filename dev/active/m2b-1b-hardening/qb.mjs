// M2B-1b-hardening P2·P3 판정 — 1b qb.mjs 복사(8c60a4b 원문) 개선. `ego-browser nodejs < qb.mjs`. render.html을 최상위 페이지로 열고 페이지가 render{doc, kitTokens}를 스스로 보낸다.
// 1b 판정 ①~⑦은 이번 범위 밖이라 뺐다(1b 증거 = dev/active/m2b-1b/logs 보존). 남긴 것: 설정·draw·snap·COLORS(링 판정 개선)·judge + 링 매트릭스·부정 표본·P3.
// 문서 = sampleDoc의 s-header · s-hero · s-footer 자리만 바꾼 것. 캡처는 같은 문서의 정적 HTML(static/*.html) → shots.sh(Chrome headless, 뷰포트만).
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-1b-hardening/dev/active/m2b-1b-hardening";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace("m2b-1b-hardening qb");
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
    low: { primary: "#0A5C36", surface: "#F4F0E8", ink: "#8A8A8A", muted: "#6E6E6E", bg: "#A8A8A8" }, // 부정 표본 전용 — 링 역할 ink/bg(허용)인데 대비 < 3
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
  // 링(개선, 2R D-P2-1·2) = 실제 focus() 뒤 :focus-visible · outlineStyle · outlineWidth > 0 확인 + 계산 outline-color.
  // 바깥 면 = outline이 그려지는 곳 = outline-offset(> 0) 바깥 = 부모의 실제 불투명 면(요소 자신의 fill 아님). 안쪽 간격도 같은 부모 면이 비친다.
  // offset ≤ 0이면 링이 요소 fill과도 맞닿으므로 그 쌍도 따로 판정한다. 면을 못 찾거나 색 파싱 실패·반투명 = 실패(fail-closed).
  const faceOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) return s.backgroundColor; } return null; };
  const ringOf = (el) => {
    el.focus();
    const s = getComputedStyle(el);
    const r = { t: el.textContent.trim().slice(0, 6), tag: el.tagName, focused: document.activeElement === el, fv: el.matches(":focus-visible"), style: s.outlineStyle, width: parseFloat(s.outlineWidth), offset: parseFloat(s.outlineOffset), color: s.outlineColor };
    el.blur();
    const rc = parse(r.color), face = faceOf(el.parentElement), own = faceOf(el);
    const okColor = rc.length >= 3 && (rc[3] === undefined || rc[3] === 1);
    r.ring = okColor ? roleOf(r.color) : `?parse(${r.color})`;
    r.face = face ? roleOf(face) : "?noface";
    r.ratio = okColor && face ? Math.round(ratio(rc, parse(face)) * 100) / 100 : null;
    r.own = own ? roleOf(own) : "?noface";
    r.ownRatio = okColor && own ? Math.round(ratio(rc, parse(own)) * 100) / 100 : null;
    r.pair = `${r.ring}/${r.face}`;
    return r;
  };
  const rings = [...document.querySelectorAll(`${under("button")}, ${under("a")}`)].filter((el) => el.checkVisibility()).map(ringOf);
  const anchors = [...document.querySelectorAll(under("a[href]"))].length;
  return { rows, rings, anchors };
};
const ALLOWED = new Set(["on-primary/primary", "primary/on-primary", "ink/bg", "ink/surface", "muted/bg", "bg/ink"]);
const RING_OK = new Set(["on-primary/primary", "ink/bg", "ink/surface", "bg/ink"]); // 링 색/바깥 면 역할 허용 쌍. 1b의 ink/primary(CTA 자기 fill을 면으로 오인)는 부모 면 판정으로 바뀌어 뺐다
const RING_MIN = 3; // 비텍스트 대비(WCAG 1.4.11) — 역할 허용 + 수치 둘 다
const ringBad = (r) => {
  const why = [];
  if (!r.focused) why.push("focus 실패");
  if (!r.fv) why.push(":focus-visible 아님");
  if (r.style === "none" || !(r.width > 0)) why.push(`링 없음(${r.style} ${r.width})`);
  if (!RING_OK.has(r.pair)) why.push(`역할 밖 ${r.pair}`);
  if (r.ratio === null || r.ratio < RING_MIN) why.push(`대비 ${r.ratio}`);
  if (!(r.offset > 0) && (r.ownRatio === null || r.ownRatio < RING_MIN)) why.push(`offset ${r.offset} · 자기 면 대비 ${r.ownRatio}`);
  return why;
};
const judge = (c) => ({ n: c.rows.length, bad: c.rows.filter((x) => !ALLOWED.has(x.pair) || x.ratio < 4.5), min: Math.min(...c.rows.map((x) => x.ratio)), pairs: [...new Set(c.rows.map((x) => x.pair))], anchors: c.anchors, ringN: c.rings.length, ringMin: c.rings.length ? Math.min(...c.rings.map((r) => r.ratio ?? 0)) : null, ringPairs: [...new Set(c.rings.map((r) => r.pair))], rings: c.rings.map((r) => `${r.t}:${r.pair}:${r.ratio}`), badRings: c.rings.map((r) => [r, ringBad(r)]).filter(([, w]) => w.length).map(([r, w]) => `${r.t}:${r.pair}:${r.ratio} — ${w.join("·")}`) });

// footer 탐침 — 복제본의 첫 하단 링크 항목을 a[href]로 바꿔 COLORS로 잰 뒤 복제본 제거. ring = 복제본에만 줄 --kit-ring(부정 표본용, 없으면 null)
const PROBE = ([sel, ring, COLORS_SRC]) => {
  const COLORS = eval(COLORS_SRC);
  const f = document.querySelector(sel);
  const c = f.cloneNode(true);
  c.removeAttribute("data-section"); c.removeAttribute("id"); c.setAttribute("data-probe-root", "");
  if (ring) c.style.setProperty("--kit-ring", ring);
  const li = c.querySelector('[data-slot="links"] li');
  const a = document.createElement("a"); a.href = "#s-s-about"; a.textContent = li.textContent; li.textContent = ""; li.appendChild(a);
  f.after(c);
  const r = COLORS("[data-probe-root]");
  c.remove();
  return r;
};

// 열린 시트 판정 — 1b ③ sheetColors 그대로
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

// ⓪ footer links에 넣을 실제 본문 제목(같은 글자 = a[href], 0.10) + 맞지 않는 글자 1개(span 대조)
await draw("light", {});
const titles = await page.evaluate(() => [...document.querySelectorAll("main h2")].map((h) => h.textContent.trim()));
const FOOT_LINKS = [...titles.slice(0, 3), "개인정보처리방침"].join(" · ");
log("footer-links-sample", { titles, FOOT_LINKS });

// ① P2 링 매트릭스: light·dark × 톤 base·alt × header 4(바 + 열린 시트) · transparent 면 3 · footer 4 × 1280·768·390
const HEADERS = ["sticky-right-cta", "sticky-hamburger", "sticky-two-tier"];
const FOOTERS = ["biz-extended", "biz-extended-map", "minimal", "minimal-biz"];
for (const profile of ["light", "dark"]) for (const tone of ["base", "alt"]) {
  for (const v of HEADERS) {
    await draw(profile, { header: v, hero: { v: "split", tone } });
    for (const w of W3) {
      await setSize(w); await settle();
      const sheet = await sheetColors(v);
      log(`ring-${profile}-${tone}-${v}-${w}`, { bar: judge(await page.evaluate(COLORS, `[data-section="header/${v}"] .kit-bar, [data-section="header/${v}"] .kit-tier`)), sheet: sheet && judge(sheet) });
    }
  }
  for (const [k, hero] of [["primary", { v: "center", tone }], ["surface", { v: "split", tone: "alt" }], ["bg", { v: "split", tone: "base" }]]) {
    await draw(profile, { header: "transparent", hero });
    for (const w of W3) {
      await setSize(w); await settle();
      const sheet = await sheetColors("transparent");
      log(`ring-${profile}-${tone}-transparent-${k}-${w}`, { surface: await page.evaluate(() => document.querySelector('[data-section="header/transparent"]').dataset.surface), bar: judge(await page.evaluate(COLORS, '[data-section="header/transparent"] .kit-bar')), sheet: sheet && judge(sheet) });
    }
  }
  for (const v of FOOTERS) {
    await draw(profile, { footer: v, footerTone: tone, footerSlots: { links: FOOT_LINKS } });
    for (const w of W3) {
      await setSize(w); await settle();
      const sel = `[data-section="footer/${v}"]`;
      const tags = await page.evaluate((sel) => [...document.querySelectorAll(`${sel} [data-slot="links"] li`)].map((li) => li.firstElementChild?.tagName ?? "TEXT"), sel);
      const foot = judge(await page.evaluate(COLORS, sel));
      // 탐침(probe) — footer 하단 링크는 SPEC상 글자 항목(m2a SPEC 122·463 MQ-2)이라 실제 a가 0이다. 판정 페이지 안에서만 첫 항목 글자를 a[href]로 감싸
      // "링크가 생기면"(SPEC 481)의 링 CSS 계약(면 위 --kit-ring)을 잰다. 운영 마크업에 없는 요소 = 실제 링크 측정 대체 아님.
      // React가 관리하는 DOM은 건드리지 않는다 — footer 복제본(같은 class·같은 부모 면)을 바로 뒤에 붙여 재고 지운다(다음 draw 오염 0)
      const probe = judge(await page.evaluate(PROBE, [sel, null, `(${COLORS.toString()})`]));
      log(`ring-${profile}-${tone}-${v}-${w}`, { linkTags: tags, foot, probe });
    }
  }
}

// ② 부정 표본(판정기가 FAIL을 내는지 — 기대 = FAIL). 렌더 코드 수정 없이 판정 페이지 안에서만 덮어쓴다
// N1 같은 색: header 바(면 bg)에 --kit-ring = bg → 링 bg/bg, 대비 1 (CTA는 자기 --kit-ring ink를 가져 정상 쌍으로 남는 것이 기대) — 잰 뒤 인라인 값 원복
await draw("light", { header: "sticky-right-cta" });
await setSize(1280); await settle();
await page.evaluate(() => document.querySelector('[data-section="header/sticky-right-cta"]').style.setProperty("--kit-ring", "var(--site-bg)"));
log("neg-same-color", judge(await page.evaluate(COLORS, '[data-section="header/sticky-right-cta"] .kit-bar')));
await page.evaluate(() => document.querySelector('[data-section="header/sticky-right-cta"]').style.removeProperty("--kit-ring"));
// N1f footer/biz-extended(면 ink) 복제본 탐침 + --kit-ring = ink → ink/ink
await draw("light", { footer: "biz-extended", footerSlots: { links: FOOT_LINKS } });
await setSize(1280); await settle();
log("neg-same-color-footer-probe", judge(await page.evaluate(PROBE, ['[data-section="footer/biz-extended"]', "var(--site-ink)", `(${COLORS.toString()})`])));
// N2 역할은 허용(ink/bg)인데 수치 < 3: 저대비 프로필 low의 header 바
await draw("low", { header: "sticky-right-cta" });
await setSize(1280); await settle();
log("neg-low-ratio", judge(await page.evaluate(COLORS, '[data-section="header/sticky-right-cta"] .kit-bar')));
// N3 1b 방식(자기 fill = 면)이었다면: CTA 링 ink를 자기 면 primary와 짝지었다 — 개선 판정이 부모 면을 쓰는지 대조 기록
await draw("light", { header: "sticky-right-cta" });
await setSize(1280); await settle();
log("cta-face-check", (await page.evaluate(COLORS, '[data-section="header/sticky-right-cta"] .kit-bar')).rings.filter((r) => r.tag === "A" && r.own === "primary"));

// ③ P3 two-tier nav 빈 값 + utility 있음 — 메뉴 버튼·시트 없음 · 보조 줄이 바 위 · DOM 순서 = 시각 순서 · 넘침 0 (승인 정본 = 바 위)
await draw("light", { header: "sticky-two-tier", headerSlots: { nav: "" }, dropFallback: true });
await snap("p3-two-tier-nonav");
for (const w of W3) {
  await setSize(w); await settle();
  await page.evaluate(() => scrollTo(0, 0));
  log(`p3-${w}`, await page.evaluate(() => {
    const h = document.querySelector('[data-section="header/sticky-two-tier"]');
    const vis = (el) => !!el && el.checkVisibility();
    const rect = (el) => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), bottom: +r.bottom.toFixed(1), right: +r.right.toFixed(1) }; };
    const tier = h.querySelector(".kit-tier"), bar = h.querySelector(".kit-bar"), brand = h.querySelector(".kit-brand");
    const vw = document.documentElement.clientWidth;
    return {
      utilityItems: [...h.querySelectorAll('[data-slot="utility"] li')].map((li) => li.textContent.trim()),
      navSlotEmpty: h.querySelectorAll('[data-slot="nav"]').length === 0, sheets: h.querySelectorAll(".kit-sheet, [popover]").length, buttons: h.querySelectorAll("button").length, navs: h.querySelectorAll("nav").length,
      tierVisible: vis(tier), dataAlways: tier?.hasAttribute("data-always"), brandVisible: vis(brand),
      tier: rect(tier), bar: rect(bar), header: rect(h),
      tierAboveBar: tier.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 0.5,
      domOrderTierFirst: !!(tier.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING),
      overflowX: document.documentElement.scrollWidth - vw,
      outside: [...h.querySelectorAll("*")].filter((el) => vis(el) && (el.getBoundingClientRect().right > vw + 0.5 || el.getBoundingClientRect().left < -0.5)).length,
      vw,
    };
  }));
}
// 캡처 1장(390 viewport) — ego screenshot 2회 시도(각 20초), 실패면 shots.sh(Chrome headless _w390 래퍼)로 대체
await setSize(390); await settle();
await page.evaluate(() => scrollTo(0, 0));
let shot = null;
for (let i = 1; i <= 2 && !shot; i++) {
  try { shot = await Promise.race([page.screenshot({ path: `${DIR}/shots/p3-two-tier-nonav-390-ego.png` }), new Promise((_, no) => setTimeout(() => no(new Error("timeout 20s")), 20000))]); }
  catch (e) { log(`p3-shot-try${i}`, String(e.message ?? e)); }
}
log("p3-shot", shot ? "ego ok" : "ego 실패 → shots.sh 대체");

await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/qb-h.json`, JSON.stringify(out, null, 1));
await task.finish({ keep: [] });

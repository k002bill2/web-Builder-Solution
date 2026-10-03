// M2A-2a K9 [B] 판정 — `ego-browser nodejs < k9b.mjs`. 렌더 문서(render.html)를 **최상위 페이지**로 열어(같은 출처라 평가 가능) 실제 폭 1280·1024·390에서 잰다.
// 메시지는 페이지 자신이 보낸다(top-level이라 window.parent === window → RenderApp 출처 검사 통과). 문서 = sampleDoc(A안과 같은 구성: header sticky-right-cta · hero fullbleed-left · 본문 폴백 5 · footer biz-extended).
// 편집기 안 캔버스(iframe, OOPIF)는 contentDocument가 막혀 평가할 수 없어 이 방식으로 판정하고, 앱 흐름 캡처는 shots.mjs(k9) 로 따로 남긴다.
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2a-2a/dev/active/m2a-2a";
const task = await taskSpace("m2a-2a k9b");
const page = task.page("p1");
const setSize = (width, height = 900) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
const out = {};
const log = (k, v) => { out[k] = v; console.log("K9", k, JSON.stringify(v)); };

await setSize(1280);
await page.goto("http://127.0.0.1:4337/render.html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
// 시험 프로필 2벌(게이트 "대비 AA" C-1~C-3 통과 확인 후 사용) — 팔레트 5역할 서로 다른 값(역할 역추적)
const ok = await page.evaluate(async () => {
  const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
  const { checkProfileContrast } = await import("/src/domain/profileContrast.ts");
  const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
  const P = {
    // bg는 흰색이 아니게(on-primary 흰색과 역할 구분) · dark = 어두운 카드라 C-3(ink/primary)까지 통과하는 값
    light: { primary: "#0A5C36", surface: "#F4F0E8", ink: "#1A1A1A", muted: "#6E6E6E", bg: "#FCFBF8" },
    dark: { primary: "#757575", surface: "#EFE9F3", ink: "#000000", muted: "#5F5F66", bg: "#FAFAF7" },
  };
  const rgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
  const toks = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, { ...base, card: { tone: k === "dark" ? "dark" : "light", style: "bordered-md" }, palette: Object.fromEntries(Object.entries(p).map(([r, h]) => [r, rgb(h)])) }]));
  const gate = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, checkProfileContrast(Object.entries(p).map(([role, hex]) => ({ role, hex })), k === "dark" ? "dark" : "light", "aa").map((c) => [c.id, Math.round(c.ratio * 100) / 100, c.pass])]));
  window.__k9 = { sampleDoc, toks };
  return gate;
});
log("gate-profiles", ok);

const draw = (profile, over) =>
  page.evaluate(([profile, over]) => {
    let doc = window.__k9.sampleDoc();
    if (over) doc = { ...doc, sections: doc.sections.map((s) => (over[s.instanceId] ? { ...s, slots: { ...s.slots, ...over[s.instanceId] } } : s)) };
    window.postMessage({ type: "render", doc, kitTokens: window.__k9.toks[profile] }, "*");
  }, [profile, over ?? null]);
const settle = () => page.waitForTimeout(400);

// 측정 도우미(페이지 안)
const MEASURE = () => {
  const vis = (el) => el.checkVisibility();
  const navs = [...document.querySelectorAll("nav")].filter(vis).length;
  const btn = [...document.querySelectorAll("header button")].find((b) => b.textContent === "메뉴");
  const sheet = document.querySelector("[popover]");
  const barCta = document.querySelector('[data-cta="bar"]');
  const sheetCta = document.querySelector('[data-cta="sheet"]');
  const bar = document.querySelector(".kit-bar");
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)]; };
  const hero = document.querySelector('[data-section="hero/fullbleed-left"]');
  const media = hero?.querySelector("[data-media]");
  const panel = hero?.querySelector(".kit-hero-panel");
  return {
    width: innerWidth,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    visibleNavs: navs,
    menuButton: btn && getComputedStyle(btn).display,
    sheetOpen: sheet?.matches(":popover-open") ?? null,
    sheetDisplay: sheet && getComputedStyle(sheet).display,
    barCta: barCta && { display: getComputedStyle(barCta).display, rightGap: Math.round(bar.getBoundingClientRect().right - barCta.getBoundingClientRect().right) },
    sheetCtaLast: sheetCta ? sheetCta === sheet.lastElementChild : null,
    hero: hero && { rect: r(hero), media: media && r(media), panel: panel && r(panel), h1BeforeMedia: !!media && !!(hero.querySelector("h1").compareDocumentPosition(media) & 4) },
    markers: [...document.querySelectorAll('[data-kit-marker="fallback"]')].map((m) => { const s = m.closest("[data-instance-id]").getBoundingClientRect(); const b = m.getBoundingClientRect(); return [m.closest("[data-instance-id]").dataset.instanceId, Math.round(b.x - s.x), Math.round(b.y - s.y), Math.round(b.width), Math.round(b.height)]; }),
  };
};
// 글자 요소 × 가장 가까운 불투명 배경 → 역할 쌍 · 대비
const COLORS = () => {
  const P = window.__k9.cur;
  const parse = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const roleOf = (c) => { const v = parse(c).slice(0, 3).join(","); const hit = Object.entries(P).find(([, p]) => parse(p).join(",") === v); return hit ? hit[0] : v === "255,255,255" ? "on-primary" : `?${v}`; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) return s.backgroundColor; } return "rgb(255, 255, 255)"; };
  const texts = [...document.querySelectorAll("[data-kit] *")].filter((el) => el.checkVisibility() && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  return texts.map((el) => { const s = getComputedStyle(el); const fg = s.color; const bg = bgOf(el); return { tag: el.tagName, text: el.textContent.trim().slice(0, 12), pair: `${roleOf(fg)}/${roleOf(bg)}`, ratio: Math.round(ratio(parse(fg), parse(bg)) * 100) / 100, opacity: s.opacity, ellipsis: s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none" }; });
};
const ALLOWED = new Set(["on-primary/primary", "primary/on-primary", "ink/bg", "bg/ink", "ink/primary", "ink/surface", "muted/bg"]);

for (const profile of ["light", "dark"]) {
  await page.evaluate((p) => { window.__k9.cur = window.__k9.toks[p].palette; }, profile);
  await draw(profile);
  await settle();
  for (const w of [1280, 390]) {
    await setSize(w);
    await settle();
    const rows = await page.evaluate(COLORS);
    const bad = rows.filter((r) => !ALLOWED.has(r.pair) || r.ratio < 4.5 || r.opacity !== "1");
    log(`colors-${profile}-${w}`, { n: rows.length, pairs: [...new Set(rows.map((r) => r.pair))], minRatio: Math.min(...rows.map((r) => r.ratio)), bad });
  }
}
// 폭별 구조(K-AC-10·13·20·21·15 표식 위치) + 캡처
await page.evaluate(() => { window.__k9.cur = window.__k9.toks.light.palette; });
await draw("light");
for (const w of [1280, 1024, 721, 390, 351]) {
  await setSize(w);
  await settle();
  log(`layout-${w}`, await page.evaluate(MEASURE));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${DIR}/shots/k9b-${w}-top.png` });
}
// K-AC-07: 뷰포트 높이를 늘려도 hero 높이 그대로
await setSize(1280, 900);
await settle();
const heroBox = () => page.evaluate(() => { const b = document.querySelector('[data-section="hero/fullbleed-left"]').getBoundingClientRect(); return [b.width, b.height, Math.round((b.height / b.width) * 10000) / 10000]; });
const h900 = await heroBox();
await setSize(1280, 2400);
await settle();
const h2400 = await heroBox();
log("K-AC-07 hero [w, h, h/w] 900→2400", [h900, h2400]);

// K-AC-12: 390 메뉴 시트 — 열기 · Tab → 닫기 · Esc → 닫힘 + 포커스 메뉴 버튼 · 시트 안 앵커 → 닫힘
await setSize(390);
await settle();
const OPEN = "css=header button.kit-menu-button:not(.kit-close)";
const state = () => page.evaluate(() => ({ open: document.querySelector("[popover]").matches(":popover-open"), active: document.activeElement === document.body ? "BODY" : document.activeElement?.textContent }));
await page.click(OPEN);
await settle();
const opened = await state();
await page.keyboard.press("Tab");
const afterTab = await state();
await page.screenshot({ path: `${DIR}/shots/k9b-390-sheet.png` });
await page.keyboard.press("Escape");
await settle();
const afterEsc = await state();
await page.click(OPEN);
await settle();
await page.click("css=[popover] nav a[href='#s-s-about']");
await settle();
const afterAnchor = await page.evaluate(() => ({ open: document.querySelector("[popover]").matches(":popover-open"), hash: location.hash }));
log("K-AC-12", { opened, afterTab, afterEsc, afterAnchor });
// K-AC-35: 시트를 연 채 390 → 1024 → 390
await page.click(OPEN);
await settle();
await setSize(1024);
await settle();
const wide = await page.evaluate(MEASURE);
await setSize(390);
await settle();
const narrow = await page.evaluate(MEASURE);
log("K-AC-35 open sheet 390→1024→390", { at1024: { visibleNavs: wide.visibleNavs, sheetOpen: wide.sheetOpen, sheetDisplay: wide.sheetDisplay, menuButton: wide.menuButton }, at390: { visibleNavs: narrow.visibleNavs, sheetOpen: narrow.sheetOpen, sheetDisplay: narrow.sheetDisplay } });
await page.keyboard.press("Escape");

// K-AC-02: 상한 글자 + 글자 200% → 가로 넘침 0 · 말줄임 0
const LONG = { "s-header": { brand: "가".repeat(24), nav: "소개 · 서비스 · 문의 · " + "긴메뉴항목".repeat(12), cta: "나".repeat(16) }, "s-hero": { title: "다".repeat(40), subtitle: "라".repeat(120), cta: "마".repeat(16) }, "s-footer": { businessInfo: "바".repeat(200), links: "사".repeat(80), copyright: "아".repeat(60) } };
await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
await draw("light", LONG);
for (const w of [1280, 390]) {
  await setSize(w);
  await settle();
  const m = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, ellipsis: [...document.querySelectorAll("[data-kit] *")].filter((el) => { const s = getComputedStyle(el); return s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none"; }).length }));
  log(`K-AC-02 long+200% @${w}`, m);
  await page.screenshot({ path: `${DIR}/shots/k9b-${w}-long200.png` });
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
const { writeFile } = await import("node:fs/promises");
await writeFile(`${DIR}/logs/k9b.json`, JSON.stringify(out, null, 1));
await task.finish({ keep: [] });

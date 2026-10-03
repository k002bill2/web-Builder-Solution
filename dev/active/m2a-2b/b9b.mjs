// M2A-2b B9·B10(b) [B] 판정 — `ego-browser nodejs < b9b.mjs`. M2A-2a k9b.mjs 방식: render.html을 **최상위 페이지**로 열고 페이지 자신이 render{doc, kitTokens}를 보낸다.
// 문서 = sampleDoc(header · hero · about · services · faq · contact · cta-band(폴백) · footer — 킷 7 + 폴백 1). 톤 뒤집은 문서로 본문 4변형의 base/alt 둘 다 본다.
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2a-2b/dev/active/m2a-2b";
const task = await taskSpace("m2a-2b b9b");
const page = task.page("p1");
const setSize = (width, height = 900) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
const out = {};
const log = (k, v) => { out[k] = v; console.log("B9", k, JSON.stringify(v)); };

await setSize(1280);
await page.goto("http://127.0.0.1:4337/render.html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
const gate = await page.evaluate(async () => {
  const { sampleDoc } = await import("/src/engine/testing/sampleDoc.ts");
  const { checkProfileContrast } = await import("/src/domain/profileContrast.ts");
  const base = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
  const P = {
    light: { primary: "#0A5C36", surface: "#F4F0E8", ink: "#1A1A1A", muted: "#6E6E6E", bg: "#FCFBF8" },
    dark: { primary: "#757575", surface: "#EFE9F3", ink: "#000000", muted: "#5F5F66", bg: "#FAFAF7" },
  };
  const rgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
  const toks = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, { ...base, card: { tone: k === "dark" ? "dark" : "light", style: "bordered-md" }, palette: Object.fromEntries(Object.entries(p).map(([r, h]) => [r, rgb(h)])) }]));
  const g = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, checkProfileContrast(Object.entries(p).map(([role, hex]) => ({ role, hex })), k === "dark" ? "dark" : "light", "aa").map((c) => [c.id, Math.round(c.ratio * 100) / 100, c.pass])]));
  window.__b9 = { sampleDoc, toks };
  return g;
});
log("gate-profiles", gate);

// doc 변형: flip = 본문 톤 뒤집기 · over = 슬롯 덮기 · ratio = mediaRatio
const draw = (profile, { flip = false, over = null, ratio = null, style = null } = {}) =>
  page.evaluate(([profile, flip, over, ratio, style]) => {
    let doc = window.__b9.sampleDoc();
    doc = { ...doc, sections: doc.sections.map((s) => {
      let x = over?.[s.instanceId] ? { ...s, slots: { ...s.slots, ...over[s.instanceId] } } : s;
      if (x.slots.image === "OFF") x = { ...x, slots: { ...x.slots, image: { ...s.slots.image, enabled: false } } };
      if (flip && ["about", "services", "faq", "contact"].includes(s.type)) x = { ...x, tone: s.tone === "alt" ? "base" : "alt" };
      return x;
    }) };
    let kitTokens = window.__b9.toks[profile];
    if (ratio) kitTokens = { ...kitTokens, mediaRatio: ratio };
    if (style) kitTokens = { ...kitTokens, card: { ...kitTokens.card, style } };
    window.__b9.cur = kitTokens.palette;
    window.postMessage({ type: "render", doc, kitTokens }, "*");
  }, [profile, flip, over, ratio, style]);
const settle = () => page.waitForTimeout(400);
const shot = async (path) => { for (let i = 0; i < 2; i++) { try { await page.screenshot({ path }); return; } catch (e) { console.log("SHOT-FAIL", path, String(e).slice(0, 80)); await page.waitForTimeout(1000); } } };

// K-AC-11·36: 킷 글자 요소 × 가장 가까운 불투명 배경 → 역할 쌍 · 대비 · 불투명도 · 말줄임
const COLORS = () => {
  const P = window.__b9.cur;
  const parse = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const roleOf = (c) => { const v = parse(c).slice(0, 3).join(","); const hit = Object.entries(P).find(([, p]) => parse(p).join(",") === v); return hit ? hit[0] : v === "255,255,255" ? "on-primary" : `?${v}`; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) return s.backgroundColor; } return "rgb(255, 255, 255)"; };
  const opacityChain = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
  const texts = [...document.querySelectorAll("[data-kit] *")].filter((el) => el.checkVisibility() && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  return texts.map((el) => { const s = getComputedStyle(el); const fg = s.color; const bg = bgOf(el); return { sec: el.closest("[data-section]").dataset.section.split("/")[0], tone: el.closest("[data-tone]")?.dataset.tone ?? "-", tag: el.tagName, text: el.textContent.trim().slice(0, 10), pair: `${roleOf(fg)}/${roleOf(bg)}`, ratio: Math.round(ratio(parse(fg), parse(bg)) * 100) / 100, alpha: parse(fg)[3] ?? 1, opacity: opacityChain(el) }; });
};
const PART = "tail"; // "all" | "tail"(K-AC-23 이미지 끔부터)
const ALLOWED = new Set(["on-primary/primary", "primary/on-primary", "ink/bg", "bg/ink", "ink/primary", "ink/surface", "muted/bg"]);
if (PART === "all") for (const profile of ["light", "dark"]) {
  for (const flip of [false, true]) {
    await draw(profile, { flip });
    await settle();
    for (const w of [1280, 390]) {
      await setSize(w);
      await settle();
      const rows = await page.evaluate(COLORS);
      const bad = rows.filter((r) => !ALLOWED.has(r.pair) || r.ratio < 4.5 || r.opacity !== 1 || r.alpha !== 1);
      const tones = [...new Set(rows.filter((r) => r.tone !== "-").map((r) => `${r.sec}:${r.tone}`))].sort();
      log(`colors-${profile}-${flip ? "flip" : "orig"}-${w}`, { n: rows.length, pairs: [...new Set(rows.map((r) => r.pair))], minRatio: Math.min(...rows.map((r) => r.ratio)), bodyTones: tones, bad });
    }
  }
}
// 카드 면 실측(K-AC-26 [B]): 카드 톤 × 섹션 톤
if (PART === "all") for (const profile of ["light", "dark"]) for (const flip of [false, true]) {
  await draw(profile, { flip });
  await setSize(1280);
  await settle();
  log(`K-AC-26 card face ${profile} ${flip ? "flip" : "orig"}`, await page.evaluate(() => {
    const P = window.__b9.cur; const parse = (c) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).join(",");
    const role = (c) => Object.entries(P).find(([, p]) => parse(p) === parse(c))?.[0] ?? c;
    const s = document.querySelector('[data-section="services/cards-3"]');
    return { sectionTone: s.dataset.tone, sectionFace: role(getComputedStyle(s).backgroundColor), cardFace: role(getComputedStyle(s.querySelector("li")).backgroundColor), cardText: role(getComputedStyle(s.querySelector("li h3")).color) };
  }));
}
// 배치(K-AC-23·25·30 · 10 · 27) — light orig
await draw("light");
const LAYOUT = () => {
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)]; };
  const about = document.querySelector('[data-section="about/story"]');
  const cards = [...document.querySelectorAll('[data-section="services/cards-3"] li')].map(r);
  const contact = document.querySelector('[data-section="contact/form"]');
  const fig = about.querySelector("figure");
  const media = fig?.firstElementChild;
  return {
    width: innerWidth,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    visibleNavs: [...document.querySelectorAll("nav")].filter((n) => n.checkVisibility()).length,
    about: { text: r(about.querySelector(".kit-about-text")), figure: fig && r(fig), mediaRatio: media && Math.round((media.getBoundingClientRect().width / media.getBoundingClientRect().height) * 1000) / 1000 },
    cards,
    contact: { text: r(contact.querySelector(".kit-contact-text")), form: r(contact.querySelector("form")) },
  };
};
if (PART === "all") for (const w of [1280, 1024, 768, 390]) {
  await setSize(w);
  await settle();
  const L = await page.evaluate(LAYOUT);
  const a = L.about, c = L.cards, k = L.contact;
  log(`layout-${w}`, {
    ...L,
    verdict: {
      aboutTwoCol: a.figure ? a.figure[0] > a.text[0] + a.text[2] - 1 : null,
      aboutTextAbove: a.figure ? a.text[1] + a.text[3] <= a.figure[1] : null,
      cardsSameRow: c.every((x) => x[1] === c[0][1]),
      cardsSameHeight: c.every((x) => x[3] === c[0][3]),
      cardsStacked: c[1][1] >= c[0][1] + c[0][3] && c[2][1] >= c[1][1] + c[1][3],
      contactTwoCol: k.form[0] >= k.text[0] + k.text[2],
      contactStacked: k.form[1] >= k.text[1] + k.text[3],
    },
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  if (w === 1280 || w === 390) {
    for (const sec of ["about/story", "services/cards-3", "faq/accordion", "contact/form"]) {
      await page.evaluate((sel) => document.querySelector(`[data-section="${sel}"]`).scrollIntoView({ block: "start" }), sec);
      await settle();
      await shot(`${DIR}/shots/b9b-${w}-${sec.split("/")[0]}.png`);
    }
  }
}
// K-AC-23 이미지 끔 → 1단 · K-AC-24 비율 3종 (1280·390)
const ABOUT_OFF = { "s-about": { image: "OFF" } };
await draw("light", { over: ABOUT_OFF });
await setSize(1280);
await settle();
log("K-AC-23 image off @1280", await page.evaluate(() => { const a = document.querySelector('[data-section="about/story"]'); const t = a.querySelector(".kit-about-text").getBoundingClientRect(); return { layout: a.dataset.layout, figures: a.querySelectorAll("figure").length, textW: Math.round(t.width), proseMaxPx: Math.round(parseFloat(getComputedStyle(a.querySelector(".kit-about-text")).maxWidth)) }; }));
for (const ratio of ["16:9", "4:5", "1:1"]) for (const w of [1280, 390]) {
  await draw("light", { ratio });
  await setSize(w);
  await settle();
  const got = await page.evaluate(() => { const m = document.querySelector('[data-section="about/story"] figure').firstElementChild.getBoundingClientRect(); return m.width / m.height; });
  const [x, y] = ratio.split(":").map(Number);
  log(`K-AC-24 ${ratio} @${w}`, { got: Math.round(got * 10000) / 10000, want: Math.round((x / y) * 10000) / 10000, within1pct: Math.abs(got / (x / y) - 1) <= 0.01 });
}
// 카드 모양 4종 · 1280 같은 행·높이
for (const style of ["bordered-lg", "bordered-md", "elevated", "flat"]) {
  await draw("light", { style });
  await setSize(1280);
  await settle();
  log(`K-AC-25 style ${style}`, await page.evaluate(() => { const li = [...document.querySelectorAll('[data-section="services/cards-3"] li')]; const b = li.map((e) => e.getBoundingClientRect()); const s = getComputedStyle(li[0]); return { sameRow: b.every((x) => x.y === b[0].y), sameH: b.every((x) => x.height === b[0].height), radius: s.borderTopLeftRadius, borderTop: s.borderTopWidth, borderLeft: s.borderLeftWidth, shadow: s.boxShadow !== "none", bg: s.backgroundColor }; }));
  await page.evaluate(() => document.querySelector('[data-section="services/cards-3"]').scrollIntoView({ block: "start" }));
  await shot(`${DIR}/shots/b9b-1280-cards-${style}.png`);
}
// K-AC-27: Enter/Space로 열고 닫기(스크립트 0)
await draw("light");
await setSize(1280);
await settle();
await page.evaluate(() => document.querySelector('[data-section="faq/accordion"] summary').focus());
const openState = () => page.evaluate(() => [...document.querySelectorAll('[data-section="faq/accordion"] details')].map((d) => d.open));
const s0 = await openState();
await page.keyboard.press("Enter");
await settle();
const s1 = await openState();
await page.keyboard.press("Space");
await settle();
const s2 = await openState();
await page.keyboard.press("Space");
await settle();
const s3 = await openState();
log("K-AC-27 keyboard", { initial: s0, afterEnter: s1, afterSpace: s2, afterSpace2: s3, focused: await page.evaluate(() => document.activeElement?.tagName) });
// K-AC-29 [B]: 비활성 폼 계산 스타일(흐리지 않음)
log("K-AC-29 disabled look", await page.evaluate(() => {
  const c = document.querySelector('[data-section="contact/form"]');
  const st = (el) => { const s = getComputedStyle(el); return { color: s.color, bg: s.backgroundColor, border: s.borderTopColor, opacity: s.opacity, cursor: s.cursor }; };
  return { input: st(c.querySelector("input[type=text]")), textarea: st(c.querySelector("textarea")), submit: st(c.querySelector("button")), disabledFieldset: c.querySelector("fieldset").disabled, palette: window.__b9.cur };
}));
// K-AC-15(축소 보기 재확인용): 1280 프레임에서 폴백 섹션 표식 사각형(섹션 기준) — 앱 흐름 칩 사각형(부모, 섹션 기준)과 비율을 곱해 비교한다(B10)
log("marker@1280", await page.evaluate(() => [...document.querySelectorAll('[data-kit-marker="fallback"]')].map((m) => { const s = m.closest("[data-instance-id]").getBoundingClientRect(); const b = m.getBoundingClientRect(); return [m.closest("[data-instance-id]").dataset.instanceId, Math.round(b.x - s.x), Math.round(b.y - s.y), Math.round(b.width), Math.round(b.height), Math.round(s.width)]; })));
// K-AC-02: 7변형 상한 글자 + 글자 200% → 가로 넘침 0 · 말줄임 0
const LONG = {
  "s-header": { brand: "가".repeat(24), nav: "소개 · 서비스 · 문의 · " + "긴메뉴항목".repeat(12), cta: "나".repeat(16) },
  "s-hero": { title: "다".repeat(40), subtitle: "라".repeat(120), cta: "마".repeat(16) },
  "s-about": { heading: "Aa".repeat(20), body: "https://example.invalid/" + "x".repeat(376) },
  "s-services": { heading: "자".repeat(40), intro: "차".repeat(160), card1Title: "W".repeat(30), card1Body: "타".repeat(120), card2Title: "파".repeat(30), card2Body: "1234567890".repeat(12), card3Title: "거".repeat(30), card3Body: "너".repeat(120) },
  "s-faq": { heading: "더".repeat(40), q1: "Q".repeat(80), a1: "머".repeat(300), q2: "버".repeat(80), a2: "서".repeat(300), q3: "어".repeat(80), a3: "저".repeat(300) },
  "s-contact": { heading: "처".repeat(40), intro: "커".repeat(160), submit: "터".repeat(16), consent: "퍼".repeat(100) },
  "s-footer": { businessInfo: "바".repeat(200), links: "사".repeat(80), copyright: "아".repeat(60) },
};
await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
await draw("light", { over: LONG });
for (const w of [1280, 390]) {
  await setSize(w);
  await settle();
  await page.evaluate(() => document.querySelectorAll('[data-section="faq/accordion"] details').forEach((d) => { d.open = true; }));
  await settle();
  const m = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, ellipsis: [...document.querySelectorAll("[data-kit] *")].filter((el) => { const s = getComputedStyle(el); return s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none"; }).length, wider: [...document.querySelectorAll("[data-kit] *")].filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5).map((el) => el.className || el.tagName).slice(0, 5) }));
  log(`K-AC-02 long+200% @${w}`, m);
  await page.evaluate(() => document.querySelector('[data-section="services/cards-3"]').scrollIntoView({ block: "start" }));
  await shot(`${DIR}/shots/b9b-${w}-long200.png`);
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
const { writeFile } = await import("node:fs/promises");
await writeFile(`${DIR}/logs/b9b-${PART}.json`, JSON.stringify(out, null, 1));
await task.finish({ keep: [] });

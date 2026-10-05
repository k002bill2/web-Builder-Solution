// M2B-2c 재개 — long200 재측정(보정 OVER). qb.mjs 2~76행(boot/draw) + 239~256행(보정 OVER·long200)을 sed로 그대로 잘라 붙임 — snap(qb-15 캡처) 1줄만 제외
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
await boot();
await draw("light", { long: true });
await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
for (const w of W3) { await setSize(w); await settle(); const o = await page.evaluate(OVER, SEL); log(`long200-${w}`, { overflowX: o.overflowX, excluded: Object.fromEntries(KEYS.filter((k) => o[k].clippedExcluded.length).map((k) => [k, o[k].clippedExcluded])), bad: Object.fromEntries(KEYS.filter((k) => o[k].wider.length || o[k].ellipsis || o[k].scrollOver || o[k].overlap).map((k) => [k, o[k]])) }); }
await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/long200-recheck.json`, JSON.stringify(out, null, 1));
console.log("DONE");

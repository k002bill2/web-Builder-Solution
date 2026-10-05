// M2B-2c 재개 — long200 bk scrollOver=1 원인 특정(qb.mjs 1~76행 boot/draw 그대로 + contact/form 비교 키 cf 추가). 판정 조건 = qb.mjs OVER와 같음: checkVisibility · scrollWidth > clientWidth + 1 · overflowX ≠ visible
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
const KEYS = ["at", "sl", "c2", "cm", "g3", "ms", "g2", "st", "qt", "pr", "bk", "cb", "cf"];
const PAIRS = { at: ["about", "text"], sl: ["services", "list"], c2: ["services", "cards-2"], cm: ["services", "cards-masonry"], g3: ["portfolio", "grid-3"], ms: ["portfolio", "masonry"], g2: ["portfolio", "grid-2"], st: ["statistics", "stats-3"], qt: ["testimonials", "quotes-2"], pr: ["pricing", "tiers-2"], bk: ["contact", "booking"], cb: ["cta-band", "banner"], cf: ["contact", "form"] };
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
const PROBE = (sels) => {
  const vw = document.documentElement.clientWidth;
  const res = { vw, rootFont: getComputedStyle(document.documentElement).fontSize };
  for (const s of sels) {
    const root = document.querySelector(s);
    const all = [...root.querySelectorAll("*")].filter((el) => el.checkVisibility());
    const desc = (el) => { const st = getComputedStyle(el); return { tag: el.tagName, cls: String(el.className), id: el.id, type: el.getAttribute("type"), name: el.getAttribute("name"), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight, ow: el.offsetWidth, ox: st.overflowX, oy: st.overflowY, value: (el.value ?? "").length, placeholder: el.getAttribute("placeholder"), appearance: st.appearance, rectW: Math.round(el.getBoundingClientRect().width * 10) / 10, children: el.children.length, html: el.outerHTML.slice(0, 220) }; };
    res[s] = {
      over: all.filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible").map(desc),
      controls: [...root.querySelectorAll("input, textarea, select, button")].map(desc),
    };
  }
  return res;
};
await boot();
const out2 = {};
for (const [label, only] of [["bk+cf", ["bk", "cf"]], ["all12+cf", KEYS]]) {
  for (const long of [true, false]) {
    await draw("light", { long, only, tones: only.map((_, i) => (i % 2 ? "alt" : "base")) });
    for (const fs of ["200%", ""]) {
      await page.evaluate((fs) => { document.documentElement.style.fontSize = fs; }, fs);
      for (const w of W3) {
        await setSize(w); await settle();
        const r = await page.evaluate(PROBE, ["#s-s-bk", "#s-s-cf"]);
        const key = `${label}-long${long ? 1 : 0}-fs${fs || "100%"}-${w}`;
        out2[key] = r;
        console.log("PROBE", key, JSON.stringify({ vw: r.vw, rootFont: r.rootFont, bkOver: r["#s-s-bk"].over, cfOver: r["#s-s-cf"].over }).slice(0, 3000));
      }
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  }
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/over-probe.json`, JSON.stringify(out2, null, 1));
console.log("DONE");

// M2A-2b 캔버스 캡처 — `ego-browser nodejs < shots.mjs`. 설정 shots.json {"prefix":"k0","widths":[1280,390]}. 127.0.0.1:4337(vite dev).
// f1.mjs(M2A-1b) 방식: 메모리 저장소라 첫 goto 뒤 클릭으로만 이동 · 폭 = CDP setDeviceMetricsOverride · iframe scrollIntoView 뒤 **뷰포트 캡처**(fullPage 금지 — OOPIF 합성 안 됨).
// 흐름: /catalog → 비교 3개 → Hero A 선택 → 프로필 확정 → 3안 → **A안**(hero fullbleed-left) → 편집 시작 → /studio.
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2a-2b/dev/active/m2a-2b";
const OUT = `${DIR}/shots`;
const { readFile } = await import("node:fs/promises");
const conf = JSON.parse(await readFile(`${DIR}/shots.json`, "utf8"));
const PREFIX = conf.prefix;
const task = await taskSpace(`m2a-2b ${PREFIX}`);
const page = task.page("p1");
const setWidth = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
const soft = async (label, fn, timeout = 15000) => {
  try {
    await page.waitForFunction(fn, undefined, { timeout });
    return true;
  } catch {
    console.log("TIMEOUT", label);
    return false;
  }
};

await setWidth(1280);
await page.goto("http://127.0.0.1:4337/catalog");
await page.evaluate(() => {
  window.__m = [];
  window.addEventListener("message", (e) => {
    const f = document.querySelector("iframe");
    if (!f || e.source !== f.contentWindow) return;
    const d = e.data ?? {};
    window.__m.push({ type: d.type, code: d.code, n: Array.isArray(d.rects) ? d.rects.length : 0 });
    if (d.type === "rects") window.__r = d.rects;
  });
});
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim().endsWith("비교 추가")), undefined, { timeout: 15000 });
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱", "동네 치과 클리닉"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
await page.click("loc=role:button[name='비교 보드 열기']");
await page.waitForFunction(() => location.pathname === "/compare" && [...document.querySelectorAll("button")].some((b) => /이 요소 선택/.test(b.textContent)), undefined, { timeout: 15000 });
await page.click("loc=css:button[aria-label='Hero 구성: A 모던 카페 브랜드의 요소 선택']");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^프로필 확정/.test(b.textContent.trim()) && b.getAttribute("aria-disabled") !== "true" && !b.disabled), undefined, { timeout: 15000 });
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^프로필 확정/.test(b.textContent.trim())).click());
await page.waitForFunction(() => /^\/profile\//.test(location.pathname) && [...document.querySelectorAll("button")].some((b) => /^3안 만들기/.test(b.textContent.trim())), undefined, { timeout: 15000 });
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^3안 만들기/.test(b.textContent.trim())).click());
await page.waitForFunction(() => document.querySelector("table caption")?.textContent === "3안 비교", undefined, { timeout: 20000 });
await page.click("loc=role:button[name='A안 선택']");
await page.waitForFunction(() => document.querySelector("button[aria-label='A안 선택']")?.getAttribute("aria-pressed") === "true", undefined, { timeout: 5000 });
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /편집 시작/.test(b.textContent)).click());
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.querySelector("#studio-canvas-heading"), undefined, { timeout: 15000 });
await soft("overlay chip @start", () => !!document.querySelector("[data-canvas-overlay] span.bg-primary"));

const state = () =>
  page.evaluate(() => {
    const f = document.querySelector("iframe");
    const r = f?.getBoundingClientRect();
    return {
      url: location.pathname,
      iframe: r && { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height },
      chip: document.querySelector("[data-canvas-overlay] span.bg-primary")?.textContent ?? null,
      chipRect: (() => { const c = document.querySelector("[data-canvas-overlay] span.bg-primary"); if (!c) return null; const b = c.getBoundingClientRect(); return { x: b.x - r.x, y: b.y - r.y, w: b.width, h: b.height }; })(),
      messages: window.__m.slice(-6),
      errors: window.__m.filter((m) => m.type === "error").map((m) => m.code),
      // B1: 렌더 문서 폭(헤더 섹션 사각형 폭 ≈ 1280이면 zoom이 OOPIF까지 닿아 lg 배치) · 바 nav 슬롯 보고 여부 · 오버레이 선택 상자 = iframe 원점 + 사각형 × 비율
      align: (() => {
        const rs = window.__r ?? [];
        const scale = r.width / (Number.parseFloat(f.style.width) || f.offsetWidth || r.width);
        const head = rs.find((x) => x[1] === null);
        const box = document.querySelector("[data-canvas-overlay] span.bg-primary")?.parentElement;
        const chipId = box && rs.filter((x) => x[1] === null).find((x) => Math.abs(r.x + x[2] * (r.width / f.offsetWidth) - box.getBoundingClientRect().x) < 2 && Math.abs(r.y + x[3] * (r.width / f.offsetWidth) - box.getBoundingClientRect().y) < 2);
        const b = box?.getBoundingClientRect();
        const k = r.width / f.offsetWidth;
        return {
          frameCssW: f.offsetWidth, shownW: r.width, scale: Number(k.toFixed(4)), caption: [...document.querySelectorAll("p")].map((p) => p.textContent).find((t) => /^축소 보기/.test(t)) ?? null,
          headerRectW: head && head[4], navSlot: rs.some((x) => x[1] === "nav"), ctaSlots: rs.filter((x) => x[1] === "cta").map((x) => [Math.round(x[2]), Math.round(x[4])]),
          box: b && [b.x, b.y, b.width, b.height].map((v) => Number(v.toFixed(1))),
          expected: chipId && [r.x + chipId[2] * k, r.y + chipId[3] * k, chipId[4] * k, chipId[5] * k].map((v) => Number(v.toFixed(1))),
          hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      })(),
    };
  });

for (const w of conf.widths) {
  await setWidth(w);
  await page.waitForTimeout(1500);
  await soft(`overlay chip @${w}`, () => !!document.querySelector("[data-canvas-overlay] span.bg-primary"), 8000);
  await page.evaluate(() => document.querySelector("iframe")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(800);
  console.log("STATE", w, JSON.stringify(await state()));
  console.log("SHOT", await page.screenshot({ path: `${OUT}/${PREFIX}-${w}-top.png` }));
  // 아래쪽(footer) — iframe 끝을 뷰포트 아래에 맞춘다
  await page.evaluate(() => document.querySelector("iframe")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(600);
  console.log("SHOT", await page.screenshot({ path: `${OUT}/${PREFIX}-${w}-bottom.png` }));
}
if (conf.extra) {
  const extra = new Function("page", "OUT", "PREFIX", "task", `return (async () => { ${conf.extra} })()`);
  await extra(page, OUT, PREFIX, task);
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });

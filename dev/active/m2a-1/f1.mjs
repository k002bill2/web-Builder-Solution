// M2A-1b F1 진단 — `ego-browser nodejs < f1.mjs`. 127.0.0.1:4337(vite dev). 메모리 저장소라 첫 goto 뒤 클릭으로만 이동(r5.mjs 흐름).
// 폭(실제 뷰포트 = CDP setDeviceMetricsOverride)마다: iframe 사각형·계산 스타일, 부모가 받은 ready/rects 수·마지막 rects 범위, iframe 높이, 뷰포트 캡처(iframe을 화면 안으로 스크롤).
const OUT = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2a-1/dev/active/m2a-1/shots";
const { readFile } = await import("node:fs/promises");
const conf = JSON.parse(await readFile(`${OUT}/../f1.json`, "utf8"));
const PREFIX = conf.prefix;
const task = await taskSpace(`m2a-1b ${PREFIX}`);
const page = task.page("p1");
const setWidth = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
const soft = async (label, fn, timeout = 15000) => {
  try {
    await page.waitForFunction(fn, undefined, { timeout });
    return true;
  } catch (e) {
    console.log("TIMEOUT", label);
    return false;
  }
};

await setWidth(1280);
await page.goto("http://127.0.0.1:4337/catalog");
// 부모가 받은 렌더 문서 메시지 기록(iframe에서 온 것만)
await page.evaluate(() => {
  window.__f1 = [];
  window.addEventListener("message", (e) => {
    const f = document.querySelector("iframe");
    if (!f || e.source !== f.contentWindow) return;
    const d = e.data ?? {};
    const rects = Array.isArray(d.rects) ? d.rects : [];
    window.__f1.push({ t: Math.round(performance.now()), type: d.type, n: rects.length, maxBottom: rects.reduce((m, r) => Math.max(m, r[3] + r[5]), 0), maxRight: rects.reduce((m, r) => Math.max(m, r[2] + r[4]), 0) });
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
await page.click("loc=role:button[name='B안 선택']");
await page.waitForFunction(() => document.querySelector("button[aria-label='B안 선택']")?.getAttribute("aria-pressed") === "true", undefined, { timeout: 5000 });
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /편집 시작/.test(b.textContent)).click());
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.querySelector("#studio-canvas-heading"), undefined, { timeout: 15000 });
await soft("overlay chip @1280 start", () => !!document.querySelector("[data-canvas-overlay] span.bg-primary"));

const state = () =>
  page.evaluate(() => {
    const f = document.querySelector("iframe");
    if (!f) return { iframe: null };
    const r = f.getBoundingClientRect();
    const cs = (el) => { const s = getComputedStyle(el); return { zoom: s.zoom, transform: s.transform, visibility: s.visibility, display: s.display, opacity: s.opacity, width: s.width, height: s.height }; };
    const msgs = window.__f1 ?? [];
    const rectsMsgs = msgs.filter((m) => m.type === "rects");
    const last = rectsMsgs[rectsMsgs.length - 1];
    const view = [...document.querySelectorAll("button[aria-pressed='true'], [role=radio][aria-checked='true'], [role=tab][aria-selected='true']")].map((b) => b.textContent.trim()).filter(Boolean);
    return {
      url: location.pathname,
      innerWidth: window.innerWidth,
      iframeRect: { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height },
      iframeStyleHeight: f.style.height,
      iframeComputed: cs(f),
      wrapperComputed: cs(f.parentElement),
      wrapperStyle: f.parentElement.getAttribute("style"),
      areaWidth: f.parentElement.parentElement.getBoundingClientRect().width,
      ready: msgs.filter((m) => m.type === "ready").length,
      rects: rectsMsgs.length,
      errors: msgs.filter((m) => m.type === "error").length,
      lastRects: last ?? null,
      selectedChip: document.querySelector("[data-canvas-overlay] span.bg-primary")?.textContent ?? null,
      pressed: view,
      caption: [...document.querySelectorAll("p")].map((p) => p.textContent).find((t) => /축소 보기/.test(t)) ?? null,
    };
  });

const results = [];
for (const w of conf.widths) {
  await setWidth(w);
  await page.waitForTimeout(1200);
  await soft(`overlay chip @${w}`, () => !!document.querySelector("[data-canvas-overlay] span.bg-primary"), 8000);
  await page.evaluate(() => document.querySelector("iframe")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(800);
  const s = await state();
  const path = await page.screenshot({ path: `${OUT}/${PREFIX}-${w}.png` });
  results.push({ width: w, ...s, shot: path });
  console.log("STATE", w, JSON.stringify(s));
}
// 대조군: 마지막 폭 그대로 r5와 같은 fullPage 캡처 — iframe이 첫 뷰포트(900) 아래에 있을 때 OOPIF 내용이 찍히는지
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
const last = conf.widths[conf.widths.length - 1];
console.log("fullPage control", last, await page.screenshot({ path: `${OUT}/${PREFIX}-${last}-fullpage.png`, fullPage: true }));
// 렌더 문서 대상(OOPIF) 목록 — 프레임 안이 실제로 그렸는지 시맨틱 스냅샷으로 확인
const targets = await task.cdp("Target.getTargets", {});
console.log("targets", JSON.stringify(targets.targetInfos.filter((t) => /render\.html/.test(t.url)).map((t) => ({ type: t.type, url: t.url }))));
const snap = await page.snapshot({ scope: "full_page" });
const text = typeof snap === "string" ? snap : JSON.stringify(snap, null, 1);
const at = text.search(/iframe/i);
console.log("snapshot iframe", JSON.stringify({ hasIframe: at >= 0, frameTextHead: at < 0 ? "" : text.slice(at, at + 600) }));
console.log("messages", JSON.stringify(await page.evaluate(() => window.__f1.slice(-12))));
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });

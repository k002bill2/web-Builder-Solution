// R5 보조: fullPage 캡처에서 390 iframe 내용이 비어 보여, iframe을 화면 안으로 스크롤한 뷰포트 캡처로 다시 확인(r5.mjs 앞부분 그대로)
// M2A-1 R5 캔버스 캡처 + E-AC-49 확인(프레임 안은 CDP isolated world) — shots.json 작성 뒤 `ego-browser nodejs < shots.mjs`. 127.0.0.1:4337(vite dev). 메모리 저장소라 첫 goto 뒤 클릭으로만 이동.
// catalog → compare(Hero A) → 프로필 확정 v1 → 3안 만들기 → B안 편집 시작 → /studio → 폭별 캡처(캔버스 영역 + 전체)
const OUT = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2a-1/dev/active/m2a-1/shots";
// ego-browser nodejs는 셸 환경변수를 넘기지 않는다 — 설정 파일 shots.json({prefix, widths})로 받는다
const { readFile } = await import("node:fs/promises");
const conf = JSON.parse(await readFile(`${OUT}/../shots.json`, "utf8"));
const PREFIX = conf.prefix;
const WIDTHS = conf.widths;
const { mkdir } = await import("node:fs/promises");
await mkdir(OUT, { recursive: true });
const task = await taskSpace(`m2a-1 ${PREFIX}`);
console.log({ spaceId: task.spaceId });
const page = task.page("p1");
const setWidth = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });

await setWidth(1280);
await page.goto("http://127.0.0.1:4337/catalog");
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
// 렌더 문서가 사각형을 보내 오버레이 칩이 그려질 때까지
await page.waitForFunction(() => !!document.querySelector("[data-canvas-overlay] span.bg-primary"), undefined, { timeout: 15000 });
await page.waitForTimeout(500);
for (const w of [390, 1280]) {
  await setWidth(w);
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector("iframe").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => { const f = document.querySelector("iframe"); const r = f.getBoundingClientRect(); return { top: r.top, width: r.width, height: r.height, wrapper: f.parentElement.style.width }; });
  const path = await page.screenshot({ path: `${OUT}/r5-${w}-canvas-viewport.png` });
  console.log("viewport", w, JSON.stringify(info), path);
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });

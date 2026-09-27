// EDITOR-A3-2 캔버스 캡처 — `SHOT_PREFIX=v0 SHOT_WIDTHS=1280 ego-browser nodejs < shots.mjs`. 127.0.0.1:4337(vite dev). 메모리 저장소라 첫 goto 뒤 클릭으로만 이동.
// catalog → compare(Hero A) → 프로필 확정 v1 → 3안 만들기 → B안 편집 시작 → /studio → 폭별 캡처(캔버스 영역 + 전체)
const OUT = "/Users/younghwankang/orca/workspaces/web-builder-solution/editor-a3-2/dev/active/editor-a3-2/shots";
const PREFIX = process.env.SHOT_PREFIX ?? "v0";
const WIDTHS = (process.env.SHOT_WIDTHS ?? "1280").split(",").map(Number);
const { mkdir } = await import("node:fs/promises");
await mkdir(OUT, { recursive: true });
const task = await taskSpace(`editor-a3-2 ${PREFIX}`);
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
await page.waitForTimeout(800);
const info = await page.evaluate(() => ({
  path: location.pathname,
  notice: [...document.querySelectorAll("[role=status]")].map((n) => n.textContent.trim()).filter(Boolean),
  sections: [...document.querySelectorAll("[data-instance-id]")].map((n) => n.getAttribute("data-instance-id")),
  canvasVars: getComputedStyle(document.querySelector("[data-instance-id]")?.parentElement ?? document.body).getPropertyValue("--canvas-primary"),
}));
console.log(info);
for (const w of WIDTHS) {
  await setWidth(w);
  await page.waitForTimeout(500);
  const path = await page.screenshot({ path: `${OUT}/${PREFIX}-${w}.png`, fullPage: true });
  console.log({ w, path });
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });

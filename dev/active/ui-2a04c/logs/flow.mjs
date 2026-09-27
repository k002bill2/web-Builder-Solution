// UI-2A04C 브라우저 흐름 — `ego-browser nodejs < flow.mjs`. 127.0.0.1:4337 (vite dev, strictPort). 메모리 저장소라 새로고침 금지.
// catalog → compare(Hero A) → 프로필 확정 v1 → 3안 만들기(생성 중 캡처) → 3안 → B안 선택 → 1280/768/390/320 캡처·수치 → 편집 시작 → /studio
const OUT = "/Users/younghwankang/orca/workspaces/web-builder-solution/ui-2a04c/dev/active/ui-2a04c/shots";
const { writeFile, mkdir } = await import("node:fs/promises");
await mkdir(OUT, { recursive: true });
const task = await taskSpace("ui-2a04c QA");
console.log({ spaceId: task.spaceId });
const page = task.page("p1");
const setWidth = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
const out = { steps: [] };
const step = (s) => { out.steps.push(s); console.log(s); };

await setWidth(1280);
await page.goto("http://127.0.0.1:4337/catalog");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim().endsWith("비교 추가")), undefined, { timeout: 15000 });
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱", "동네 치과 클리닉"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
step("catalog: 3개 비교 추가");
await page.click("loc=role:button[name='비교 보드 열기']");
await page.waitForFunction(() => location.pathname === "/compare" && [...document.querySelectorAll("button")].some((b) => /이 요소 선택/.test(b.textContent)), undefined, { timeout: 15000 });
step("compare: 보드 열림");
await page.click("loc=css:button[aria-label='Hero 구성: A 모던 카페 브랜드의 요소 선택']");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^프로필 확정/.test(b.textContent.trim()) && b.getAttribute("aria-disabled") !== "true" && !b.disabled), undefined, { timeout: 15000 });
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^프로필 확정/.test(b.textContent.trim())).click());
await page.waitForFunction(() => location.pathname === "/profile/profile-1" && [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "3안 만들기 (v1)"), undefined, { timeout: 15000 });
step("profile: v1 확정 → /profile/profile-1, '3안 만들기 (v1)' 보임");
await shot("1280-01-before");

await page.click("loc=role:button[name='3안 만들기 (v1)']", { label: "3안 만들기 클릭" });
await page.waitForFunction(() => document.body.textContent.includes("만드는 중 · "), undefined, { timeout: 5000 });
const during = await page.evaluate(() => ({
  busy: [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "만드는 중…")?.getAttribute("aria-busy"),
  slots: [...document.querySelectorAll("ul[aria-label='3안'] > li")].map((li) => li.textContent.trim().slice(0, 30)),
  status: document.querySelector("[role=status][aria-label='프로필 알림']")?.textContent,
}));
step({ during });
await shot("1280-02-generating");
await page.waitForFunction(() => document.querySelector("table caption")?.textContent === "3안 비교", undefined, { timeout: 15000 });
step({ done: await page.evaluate(() => document.querySelector("[role=status][aria-label='프로필 알림']")?.textContent) });
await shot("1280-03-generated");

await page.click("loc=role:button[name='B안 선택']", { label: "B안 선택" });
await page.waitForFunction(() => document.querySelector("button[aria-label='B안 선택']")?.getAttribute("aria-pressed") === "true", undefined, { timeout: 5000 });
step("B안 선택 → aria-pressed=true");

const measure = () =>
  page.evaluate(() => {
    const region = document.querySelector("section[aria-labelledby='profile-candidates']");
    const ul = region.querySelector("ul[aria-label='3안']");
    const table = region.querySelector("table");
    const layout = region.parentElement;
    const focusables = [...region.querySelectorAll("button, a[href], summary")].map((el) => el.getAttribute("aria-label") || el.textContent.trim().slice(0, 24));
    const clipped = [...region.querySelectorAll("*")].filter((el) => el.children.length === 0 && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== "visible").length;
    return {
      width: innerWidth,
      overflowX: document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth,
      layoutColumns: getComputedStyle(layout).gridTemplateColumns.split(" ").length,
      cardColumns: getComputedStyle(ul).gridTemplateColumns.split(" ").length,
      tableShown: table ? getComputedStyle(table.parentElement).display !== "none" : false,
      tableOverflow: table ? table.parentElement.scrollWidth - table.parentElement.clientWidth : null,
      clipped,
      focusables,
      pressed: region.querySelector("button[aria-pressed='true']")?.getAttribute("aria-label"),
      editButton: [...region.querySelectorAll("button")].find((b) => /편집 시작/.test(b.textContent))?.textContent.trim(),
      editDisabled: [...region.querySelectorAll("button")].find((b) => /편집 시작/.test(b.textContent))?.getAttribute("aria-disabled"),
      previewCaption: region.textContent.includes("구조 미리보기"),
      editNotice: region.textContent.includes("편집기는 다음 단계(2a-05)"),
    };
  });

out.widths = {};
for (const w of [1280, 1024, 768, 390, 320]) {
  await setWidth(w);
  await page.waitForTimeout(300);
  out.widths[w] = await measure();
  console.log(w, JSON.stringify(out.widths[w]));
  await page.evaluate(() => document.querySelector("section[aria-labelledby='profile-candidates']").scrollIntoView());
  await shot(`${w}-04-selected`);
}

// 키보드: 3안 만들기 뒤 Tab 순서 표본(1280) — 카드별 선택·섹션 순서 보기·전체 로그 → 편집 시작
await setWidth(1280);
await page.focus("loc=role:button[name='A안 선택']");
const tabs = [];
for (let i = 0; i < 12; i += 1) {
  await page.keyboard.press("Tab");
  tabs.push(await page.evaluate(() => { const el = document.activeElement; return (el.getAttribute("aria-label") || el.textContent.trim()).slice(0, 24) + (el.matches(":focus-visible") ? " [ring]" : ""); }));
}
out.tabOrder = tabs;
console.log({ tabs });

await page.click("loc=role:button[name='B안으로 편집 시작']", { label: "편집 시작" });
await page.waitForURL((u) => new URL(u).pathname === "/studio", { timeout: 10000 }).catch(() => {});
step({ studio: await page.evaluate(() => ({ path: location.pathname, h1: document.querySelector("h1")?.textContent, screen: document.body.textContent.includes("시안 2a-05") })) });
await shot("1280-05-studio");
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${OUT}/flow.json`, JSON.stringify(out, null, 2));
await task.finish({ keep: [] });
console.log("done");

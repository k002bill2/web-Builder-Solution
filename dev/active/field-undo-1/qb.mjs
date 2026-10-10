// FIELD-UNDO-1 FU-QB-1 — `ego-browser nodejs < qb.mjs`. 127.0.0.1:4355(vite preview). 메모리 저장소라 첫 goto 뒤 클릭으로만 이동.
const OUT = "/Users/younghwankang/orca/workspaces/web-builder-solution/field-undo-1/dev/active/field-undo-1/shots";
const { stat } = await import("node:fs/promises");
const task = await taskSpace("field-undo-1 qb");
console.log({ spaceId: task.spaceId });
const page = task.page("p1");
const setWidth = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
const out = [];
try {
  await setWidth(1280);
  await page.goto("http://127.0.0.1:4355/catalog");
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim().endsWith("비교 추가")), undefined, { timeout: 15000 });
  const names = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => (b.getAttribute("aria-label") || b.textContent).trim()).filter((t) => t.endsWith("비교 추가")).slice(0, 3));
  for (const n of names) await page.click(`loc=role:button[name='${n}']`);
  await page.click("loc=role:button[name='비교 보드 열기']");
  await page.waitForFunction(() => location.pathname === "/compare" && [...document.querySelectorAll("button")].some((b) => /이 요소 선택|요소 선택/.test(b.getAttribute("aria-label") || b.textContent)), undefined, { timeout: 15000 });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^Hero 구성: A .*요소 선택$/.test(b.getAttribute("aria-label") || ""))?.click());
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^프로필 확정/.test(b.textContent.trim()) && b.getAttribute("aria-disabled") !== "true" && !b.disabled), undefined, { timeout: 15000 });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^프로필 확정/.test(b.textContent.trim())).click());
  await page.waitForFunction(() => /^\/profile\//.test(location.pathname) && [...document.querySelectorAll("button")].some((b) => /^3안 만들기/.test(b.textContent.trim())), undefined, { timeout: 15000 });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^3안 만들기/.test(b.textContent.trim())).click());
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /편집 시작/.test(b.textContent)), undefined, { timeout: 20000 });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /편집 시작/.test(b.textContent)).click());
  await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.querySelector("#studio-canvas-heading"), undefined, { timeout: 15000 });
  await page.waitForTimeout(800);
  for (const w of [1280, 1024, 390]) {
    await setWidth(w);
    await page.waitForTimeout(500);
    if (w === 390) await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].find((t) => t.textContent.trim() === "편집")?.click());
    await page.waitForTimeout(300);
    const id = await page.evaluate(() => [...document.querySelectorAll("input[type=text]")].find((i) => i.id.startsWith("field-"))?.id);
    const before = await page.evaluate((i) => document.getElementById(i).value, id);
    await page.fill(`loc=css:#${id}`, `봄 신메뉴 출시 ${w}`);
    // 칸 밖 클릭(섹션 목록 머리 · 탭 배치는 편집 패널 머리) = blur → 묶음 닫힘
    await page.evaluate(() => (document.getElementById("studio-sections-heading") ?? document.getElementById("studio-edit-heading"))?.focus());
    await page.waitForTimeout(200);
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "더보기" || b.getAttribute("aria-label") === "더보기")?.click());
    await page.waitForTimeout(300);
    const menu = await page.evaluate(() => [...document.querySelectorAll("[role=menuitem]")].map((m) => m.textContent.trim()));
    await page.press("Escape");
    await page.evaluate(() => document.getElementById("studio-sections-heading")?.focus() ?? document.body.focus());
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(400);
    const after = await page.evaluate((i) => document.getElementById(i)?.value, id);
    const notice = await page.evaluate(() => document.querySelector("[role=status][aria-label='편집 알림']")?.textContent.trim());
    const path = `${OUT}/qb1-${w}.png`;
    await page.screenshot({ path });
    const bytes = (await stat(path)).size;
    out.push({ w, id, before, after, restored: before === after, notice, menu, path, bytes });
  }
} catch (e) {
  out.push({ error: String(e) });
}
console.log(JSON.stringify(out, null, 1));
await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase("design-studio"); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });
console.log(await listTaskSpaces?.());

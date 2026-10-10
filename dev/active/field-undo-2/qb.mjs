// FIELD-UNDO-2 Ego — `ego-browser nodejs < qb.mjs` · 127.0.0.1:4357(vite preview). 경로 = field-undo-1/qb-flow.mjs(앱 안 클릭만 — 메모리 store 새로고침 함정)
// 1280: Portfolio 첫 이미지 슬롯 고르기(B안 Hero에는 이미지 슬롯 없음 — 실측)(자체 생성 단색 PNG) → 섹션 줄 클릭 → Ctrl+Z = 이미지 빠짐 → Shift+Ctrl+Z = 같은 이미지 → 대체텍스트 입력 → 줄 클릭 → Ctrl+Z = 텍스트만 원복
const OUT = "/Users/younghwankang/orca/workspaces/web-builder-solution/field-undo-2/dev/active/field-undo-2/shots";
const FILE = "/tmp/fu2-scratch/solid-teal.png";
const { writeFileSync, mkdirSync } = await import("node:fs");
mkdirSync(OUT, { recursive: true });
const task = await taskSpace("field-undo-2 qb");
const page = task.page("p1");
const log = { spaceId: task.spaceId };
const btn = (re) => page.evaluate((src) => [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click() ?? "missing", re);
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
const ready = await page.evaluate(() => /^\/studio\//.test(location.pathname)).catch(() => false);
if (!ready) {
await page.goto("http://127.0.0.1:4357/catalog");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim().endsWith("비교 추가")), undefined, { timeout: 15000 });
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 10000 });
await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: B 프리미엄 헤어살롱']");
await page.waitForTimeout(400);
await btn("^프로필 확정");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^3안 만들기/.test(b.textContent.trim())), undefined, { timeout: 15000 });
await btn("^3안 만들기");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim() === "B안 선택"), undefined, { timeout: 20000 });
await page.click("loc=role:button[name='B안 선택']");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "B안으로 편집 시작"), undefined, { timeout: 10000 });
await btn("^B안으로 편집 시작$");
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !!document.getElementById("field-hero-1-title"), undefined, { timeout: 15000 });
}
log.path = await page.evaluate(() => location.pathname);

const shotV = async (name) => {
  const { w, h } = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  const r = await page.cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  const buf = Buffer.from(r.data, "base64");
  const p = `${OUT}/${name}.png`;
  writeFileSync(p, buf);
  return { p, w, h, bytes: buf.length, png: buf.subarray(1, 4).toString() === "PNG" };
};
const notice = () => page.evaluate(() => document.querySelector("[role=status][aria-label='편집 알림']")?.textContent.trim());
const row = async (id) => {
  await page.evaluate((i) => document.querySelector(`[data-row-id='${i}']`).scrollIntoView({ block: "center" }), id);
  await page.click(`loc=css:[data-row-id='${id}']`);
  await page.waitForTimeout(300);
};
// 패널 상태: 미리보기 img 수 · 결과 메타 캡션 · 대체텍스트 값
const panel = () =>
  page.evaluate(() => {
    const d = [...document.querySelectorAll("details")].find((x) => x.querySelector("summary")?.textContent.includes("이미지 편집"));
    if (!d) return null;
    const slot = d.querySelector("section");
    const alt = slot.querySelector("input[id$='-alt']");
    return { imgs: slot.querySelectorAll("img").length, meta: [...slot.querySelectorAll("p")].map((p) => p.textContent.trim()).find((t) => /×/.test(t)) ?? null, alt: alt?.value ?? null, altId: alt?.id ?? null };
  });

await row("portfolio-1");
await page.evaluate(() => {
  const d = [...document.querySelectorAll("details")].find((x) => x.querySelector("summary")?.textContent.includes("이미지 편집"));
  d.open = true;
  d.dispatchEvent(new Event("toggle"));
});
await page.waitForFunction(() => !!document.querySelector("input[type=file][data-testid^='image-file-']"), undefined, { timeout: 10000 });
log.fileInput = await page.evaluate(() => document.querySelector("input[type=file][data-testid^='image-file-']").dataset.testid);
log.before = await panel();
await page.setInputFiles(`input[type=file][data-testid='${log.fileInput}']`, [FILE]);
await page.waitForFunction(() => [...document.querySelectorAll("details section img")].length > 0, undefined, { timeout: 15000 });
await page.waitForTimeout(300);
log.picked = await panel();
await row("portfolio-1");
await page.keyboard.press("Control+z");
await page.waitForTimeout(600);
log.undoPick = { notice: await notice(), panel: await panel() };
log.shotUndo = await shotV("fu2-undo-pick-1280");
await page.keyboard.press("Control+Shift+z");
await page.waitForTimeout(600);
log.redoPick = { notice: await notice(), panel: await panel() };
log.sameImage = log.redoPick.panel?.meta === log.picked?.meta && log.redoPick.panel?.imgs === 1;
const altSel = `loc=css:#${log.picked.altId}`;
await page.click(altSel);
await page.fill(altSel, "청록 단색 테스트 이미지");
await page.waitForTimeout(150);
log.altTyped = await panel();
await row("portfolio-1");
await page.keyboard.press("Control+z");
await page.waitForTimeout(600);
log.undoAlt = { notice: await notice(), panel: await panel() };
log.altRestored = log.undoAlt.panel?.alt === log.picked?.alt && log.undoAlt.panel?.imgs === 1;
log.shotAlt = await shotV("fu2-undo-alt-1280");
console.log(JSON.stringify(log, null, 1));

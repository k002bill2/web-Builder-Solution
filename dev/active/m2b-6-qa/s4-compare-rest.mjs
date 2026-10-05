// S4 E2E 이어서(앱 안 클릭만) — 1안씩·폭 전환 · 이 안 선택 status · Esc 포커스 복귀 · 편집 시작 → /studio 캔버스 · 내보내기 버튼 목록
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-6-qa/dev/active/m2b-6-qa";
const { writeFile, readFile } = await import("node:fs/promises");
const task = await taskSpace(68);
const page = task.page("p1");
const out = JSON.parse(await readFile(`${DIR}/logs/s4-compare-open.json`, "utf8"));
const log = (k, v) => { out[k] = v; console.log("E", k, JSON.stringify(v).slice(0, 1200)); };
const frames = () => page.evaluate(() => ({ n: document.querySelectorAll("dialog iframe").length, fr: [...document.querySelectorAll("dialog iframe")].map((f) => ({ style: f.parentElement.getAttribute("style"), colW: Math.round(f.parentElement.parentElement.getBoundingClientRect().width) })), status: [...document.querySelectorAll("dialog [role=status], dialog [role=alert]")].map((s) => s.textContent.trim()), pressed: [...document.querySelectorAll("dialog button[aria-pressed]")].map((b) => b.textContent.trim() + "=" + b.getAttribute("aria-pressed")), overflowX: document.scrollingElement.scrollWidth - document.documentElement.clientWidth }));
for (const [w, h] of []) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await page.waitForTimeout(2500);
  log(`frames @${w}`, await frames());
}
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.waitForTimeout(1500);
await page.click('dialog button:has-text("모바일")'); await page.waitForTimeout(2500);
log("모바일 폭 @1280", await frames());
await page.click('dialog button:has-text("데스크톱")'); await page.waitForTimeout(2000);
log("데스크톱 폭 @1280", await frames());
await page.click('dialog button[aria-label="B안 선택"]');
await page.waitForFunction(() => /B안/.test([...document.querySelectorAll("dialog [role=status]")].map((s) => s.textContent).join("")), undefined, { timeout: 10000 }).catch(() => {});
log("이 안 선택 B", await frames());
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
log("Esc 후", await page.evaluate(() => ({ dialogOpen: !!document.querySelector("dialog[open]"), active: `${document.activeElement.tagName}|${document.activeElement.textContent.trim().slice(0, 30)}`, pageStatus: [...document.querySelectorAll("[role=status]")].map((s) => s.textContent.trim()).filter(Boolean).slice(0, 4), selectedCards: [...document.querySelectorAll("button[aria-pressed=true]")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 30)) })));
await page.click("loc=role:button[name='편집 시작']");
await page.waitForURL(/\/studio\//, { timeout: 20000 });
await page.waitForTimeout(3000);
log("studio", await page.evaluate(() => ({ url: location.pathname, iframes: [...document.querySelectorAll("iframe")].map((f) => f.title + "|" + f.getAttribute("sandbox")), buttons: [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 28)).filter(Boolean), notices: [...document.querySelectorAll("[role=status],[role=alert]")].map((s) => s.textContent.trim()).filter(Boolean) })));
await writeFile(`${DIR}/logs/s4-compare-open.json`, JSON.stringify(out, null, 1));

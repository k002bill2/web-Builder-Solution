// B-ER-07 재현 스크립트: RATE·FILE 인자(스크립트 첫 줄에서 치환). 이미지 고르기 직후 스냅샷 미리보기 → 변환 완료 대기 → 상태 기록.
const RATE = Number(globalThis.RATE ?? 6), FILE = globalThis.FILE ?? "noise-12mp.jpg", TAG = globalThis.TAG ?? "x";
const { shotV } = await import("/Users/younghwankang/orca/workspaces/web-builder-solution/qfix-qa/dev/active/qfix-qa/lib.mjs");
const F = "/Users/younghwankang/orca/workspaces/web-builder-solution/qfix-qa/dev/active/qfix-qa/fixtures";
const page = (await taskSpace(4)).page("p1");
const PAUSED = "스냅샷을 보는 동안 준비된 이미지는 넣지 않았습니다";
const state = () => page.evaluate(() => ({
  live: [...document.querySelectorAll('[role=status],[role=alert],[aria-live]')].map(e => e.textContent.trim()).filter(Boolean),
  hero: [...document.querySelectorAll("details")].find(d => d.textContent.includes("이미지 편집"))?.innerText.split("\n").filter(Boolean).slice(1, 5).join(" / ") ?? null,
  cap: document.body.innerText.match(/다시 골라야 하는 이미지[^\n]*/)?.[0] ?? "(캡션 잃은 이미지 문구 없음)",
  preview: [...document.querySelectorAll("button")].some(b => b.textContent.includes("이 스냅샷으로 복원")),
  body: document.body.innerText.includes("스냅샷을 보는 동안 준비된 이미지는 넣지 않았습니다"),
}));
const log = [];
const t = (() => { const s = Date.now(); return () => Date.now() - s; })();
await page.click('button:has-text("Hero스플릿")', { label: "Hero 섹션" });
await page.waitForTimeout(300);
await page.evaluate(() => { [...document.querySelectorAll("details")].find(d => d.textContent.includes("이미지 편집")).open = true; });
log.push({ at: "before", ...(await state()) });
await page.cdp("Emulation.setCPUThrottlingRate", { rate: RATE });
const t0 = t();
await page.setInputFiles('details[open] input[type=file]', [`${F}/${FILE}`]);
log.push({ at: `picked +${t() - t0}ms`, ...(await state()) });
await page.click("#studio-snapshot", { label: "스냅샷 열기" });
await page.click('dialog[open] button[aria-label="R5 이미지A 미리보기"]', { label: "R5 미리보기" });
log.push({ at: `preview +${t() - t0}ms`, ...(await state()) });
let done = null;
for (let i = 0; i < 240; i++) {
  await page.waitForTimeout(500);
  const s = await state();
  if (s.body || s.live.some(x => /이미지를 넣었습니다|이미지를 바꿨습니다|준비하지 못했습니다|넣지 않았습니다/.test(x))) { done = { at: `settled +${t() - t0}ms`, ...s }; break; }
  if (i % 10 === 0) log.push({ at: `poll +${t() - t0}ms`, ...s });
}
log.push(done ?? { at: `timeout +${t() - t0}ms`, ...(await state()) });
await page.cdp("Emulation.setCPUThrottlingRate", { rate: 1 });
console.log(await shotV(page, `ber07-${TAG}-settled`));
await page.click('button:has-text("편집으로 돌아가기")', { label: "편집으로 돌아가기" });
await page.waitForTimeout(1200);
await page.click('button:has-text("Hero스플릿")', { label: "Hero 섹션" });
await page.waitForTimeout(300);
await page.evaluate(() => { [...document.querySelectorAll("details")].find(d => d.textContent.includes("이미지 편집")).open = true; });
await page.waitForTimeout(300);
log.push({ at: "after back", ...(await state()), alt: await page.evaluate(() => document.getElementById("image-hero-1-image-alt")?.value) });
console.log(await shotV(page, `ber07-${TAG}-after`));
console.log(JSON.stringify({ RATE, FILE, log }, null, 1));

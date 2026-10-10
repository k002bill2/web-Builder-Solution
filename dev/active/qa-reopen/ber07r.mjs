// B-ER-07 재현(qfix-qa/ber07.mjs 사본 축약): RATE 환경변수. 고르기 직후 스냅샷 미리보기 → 정착 대기 → 편집 복귀 상태
const RATE = Number(process.env.RATE || 6), TAG = `r${RATE}`;
const { shotV } = await import("/Users/younghwankang/orca/workspaces/web-builder-solution/qa-reopen/dev/active/qa-reopen/lib.mjs");
const FILE = "/Users/younghwankang/orca/workspaces/web-builder-solution/qa-reopen/dev/active/qa-reopen/fixtures/hi-35mp.jpg";
const page = (await taskSpace(3)).page("p1");
const state = () => page.evaluate(() => {
  const d = [...document.querySelectorAll("details")].find(d => d.textContent.includes("이미지 편집"));
  return {
    live: [...document.querySelectorAll('[role=status],[role=alert],[aria-live]')].map(e => e.textContent.trim()).filter(t => t && !/테마|정적 HTML|PNG/.test(t)),
    hero: d ? d.innerText.split("\n").filter(Boolean).slice(0, 6).join(" / ") : "(이미지 편집 닫힘/없음)",
    preview: document.body.innerText.includes("편집은 멈췄습니다"),
    pausedMsg: document.body.innerText.includes("스냅샷을 보는 동안 준비된 이미지는 넣지 않았습니다"),
  };
});
const log = [];
const s0 = Date.now(), t = () => Date.now() - s0;
log.push({ at: "before", ...(await state()) });
await page.cdp("Emulation.setCPUThrottlingRate", { rate: RATE });
await page.setInputFiles('details[open] input[type=file]', [FILE]);
log.push({ at: `picked +${t()}ms`, ...(await state()) });
await page.click("#studio-snapshot", { label: "스냅샷 열기" });
await page.click('dialog[open] button:has-text("미리보기")', { label: "스냅샷 미리보기" });
log.push({ at: `preview +${t()}ms`, ...(await state()) });
let done = null;
for (let i = 0; i < 120; i++) {
  await page.waitForTimeout(500);
  const s = await state();
  if (s.pausedMsg || s.live.some(x => /이미지를 넣었습니다|이미지를 바꿨습니다|준비하지 못했습니다|넣지 않았습니다|쓸 수 있습니다/.test(x))) { done = { at: `settled +${t()}ms`, ...s }; break; }
  if (i % 6 === 0) log.push({ at: `poll +${t()}ms`, ...s });
}
log.push(done ?? { at: `timeout +${t()}ms`, ...(await state()) });
await page.cdp("Emulation.setCPUThrottlingRate", { rate: 1 });
console.log(await shotV(page, `ber07-${TAG}-settled`));
await page.click('button:has-text("편집으로 돌아가기")', { label: "편집으로 돌아가기" }).catch(e => log.push({ err: e.message }));
await page.waitForTimeout(1500);
await page.click('button:has-text("Hero스플릿")', { label: "Hero 섹션" }).catch(() => {});
await page.waitForTimeout(400);
if (!(await page.evaluate(() => [...document.querySelectorAll("details")].find(d => d.textContent.includes("이미지 편집"))?.open))) await page.click('summary:has-text("이미지 편집")', { label: "이미지 편집" }).catch(() => {});
await page.waitForTimeout(600);
log.push({ at: "after back", ...(await state()), alt: await page.evaluate(() => document.getElementById("image-hero-1-image-alt")?.value) });
console.log(await shotV(page, `ber07-${TAG}-after`));
console.log(JSON.stringify({ RATE, FILE: "hi-35mp.jpg 7000x5000 4,882,057B", log }, null, 1));

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
const { writeFile } = await import("node:fs/promises");
// 렌더 문서는 sandbox 불투명 출처라 별도 프로세스 프레임(OOPIF) — 부모 contentDocument는 null. 프레임 안은 시맨틱 스냅샷(iframe 내용 포함)과 Target 목록으로 본다
const targets = await task.cdp("Target.getTargets", {});
console.log("targets", JSON.stringify(targets.targetInfos.filter((t) => /render\.html/.test(t.url)).map((t) => ({ type: t.type, url: t.url }))));
const snap = async (name) => {
  const s = await page.snapshot({ scope: "full_page" });
  const text = typeof s === "string" ? s : JSON.stringify(s, null, 1);
  await writeFile(`${OUT}/../logs/${PREFIX}-${name}-snapshot.txt`, text);
  return text;
};
const frameState = async (name) => {
  const text = await snap(name);
  const at = text.search(/iframe/i);
  const frameText = at < 0 ? "" : text.slice(at);
  return { hasIframe: at >= 0, marks: (frameText.match(/구조 미리보기/g) ?? []).length, length: text.length };
};
console.log("frame", JSON.stringify(await frameState("ready")));
// 권장 초과 만들기 — 편집 패널 첫 글자 필드에 긴 값
const made = await page.evaluate(() => {
  const field = document.querySelector("section[aria-labelledby] textarea, [role=region] input[type=text], input[type=text]");
  const region = [...document.querySelectorAll("section")].find((s) => /^편집 · /.test(s.querySelector("h2")?.textContent ?? ""));
  const input = region?.querySelector("input[type=text], input:not([type])") ?? field;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, "가".repeat(34));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return input.getAttribute("aria-label") ?? input.id;
});
await page.waitForTimeout(800);
const parent = await page.evaluate(() => {
  const region = [...document.querySelectorAll("section")].find((s) => /^편집 · /.test(s.querySelector("h2")?.textContent ?? ""));
  const input = region.querySelector("input[type=text], input:not([type])");
  const ids = (input.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
  return {
    describedby: ids,
    resolved: ids.map((id) => !!document.getElementById(id)),
    sentence: document.getElementById(ids[0])?.textContent,
    sentenceInCanvas: !!document.getElementById(ids[0])?.closest("[aria-labelledby=studio-canvas-heading]"),
    rings: [...document.querySelectorAll("[data-canvas-overlay] [aria-hidden=true]")].map((el) => el.className.includes("outline") ? "ring" : "select"),
    badge: document.querySelector("[data-issue-badge]")?.textContent,
    iframes: [...document.querySelectorAll("iframe")].map((f) => [f.getAttribute("src"), f.getAttribute("sandbox"), f.contentDocument === null]),
  };
});
console.log("parent", JSON.stringify(parent));
console.log("frame after issue", JSON.stringify(await frameState("issue")));
await page.evaluate(() => document.querySelector("h1")?.focus());
await page.evaluate(() => document.querySelector("[data-issue-badge]")?.click());
await page.waitForTimeout(300);
console.log("badge focus", JSON.stringify(await page.evaluate(() => ({ active: document.activeElement?.tagName, describedby: document.activeElement?.getAttribute("aria-describedby") }))));
for (const w of WIDTHS) {
  await setWidth(w);
  await page.waitForTimeout(800);
  const path = await page.screenshot({ path: `${OUT}/${PREFIX}-${w}.png`, fullPage: true });
  console.log({ w, path });
}
// 미리보기 폭 → iframe 뷰포트(1280에서 모바일 선택)
await setWidth(1280);
await page.evaluate(() => [...document.querySelectorAll("label")].find((l) => l.textContent.trim() === "모바일")?.click());
await page.waitForTimeout(800);
console.log("mobile view", JSON.stringify(await page.evaluate(() => { const f = document.querySelector("iframe"); return { iframeWidth: f.getBoundingClientRect().width, clientWidth: f.clientWidth, wrapper: f.parentElement.style.width }; })));
await page.screenshot({ path: `${OUT}/${PREFIX}-1280-mobile-view.png`, fullPage: true });
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });

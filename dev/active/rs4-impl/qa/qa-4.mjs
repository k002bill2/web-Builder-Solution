// RS4 QA 4 — B안으로 새로 시작(put 실패 주입 중) → R-E4 문형 → AC-09: 신뢰 입력(CDP 마우스) 1회 → 새로고침 → beforeunload 다이얼로그 이벤트 → 수락(떠나기) → IDB = 이전 문서(A안 v1)만 · 미확인 표시 0
const task = await taskSpace(1);
const page = task.page("p1");
const SHOTS = "/Users/younghwankang/orca/workspaces/web-builder-solution/rs4-impl/dev/active/rs4-impl/qa/shots";
await page.evaluate(() => [...document.querySelectorAll("dialog[open] button")].find((b) => b.textContent.trim() === "B안으로 새로 시작").click());
await page.waitForTimeout(2500);
const re4 = await page.evaluate(() => ({
  dialog: document.querySelector("dialog[open]")?.innerText ?? null,
  alerts: [...document.querySelectorAll('[role="alert"]')].map((n) => n.innerText.trim()).filter(Boolean),
  path: location.pathname,
}));
console.log("== R-E4", JSON.stringify(re4, null, 1));
await page.screenshot({ path: `${SHOTS}/05-restart-unconfirmed-1280.png` });
// 대화상자가 열려 있으면 닫지 않는다(기억은 탭 모듈에 있음). 신뢰 입력 1회 — 제목 근처 빈 곳
await page.cdp("Page.enable", {});
await page.events();
await page.cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: 1200, y: 880, button: "left", clickCount: 1 });
await page.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: 1200, y: 880, button: "left", clickCount: 1 });
await page.evaluate(() => void setTimeout(() => location.reload(), 50));
await page.waitForTimeout(1500);
const ev = (await page.events()).filter((e) => /javascriptDialog/i.test(e.method ?? e.name ?? JSON.stringify(e)));
console.log("== dialog events", JSON.stringify(ev).slice(0, 600));
console.log("== info", JSON.stringify(await page.info()).slice(0, 600));

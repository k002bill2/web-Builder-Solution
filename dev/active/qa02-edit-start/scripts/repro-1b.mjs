// QA02 repro-1b — repro-1과 같은 TaskSpace(대화상자 열린 상태)에서 "B안으로 새로 시작" 클릭 → /studio 이동 확인
const task = await taskSpace("qa02-edit-start repro-1");
const page = task.page("p1");
const log = (k, v) => console.log(k, JSON.stringify(v).slice(0, 1500));
const observe = () => page.evaluate(() => ({ path: location.pathname, dialogOpen: [...document.querySelectorAll("dialog[open]")].map((d) => d.innerText.slice(0, 200)), alerts: [...document.querySelectorAll("[role=alert],[role=status]")].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 5), errors: window.__qa ?? null }));
log("before", await observe());
log("dialog buttons", await page.evaluate(() => [...document.querySelectorAll("dialog[open] button")].map((b) => JSON.stringify(b.textContent))));
await page.click("loc=role:button[name='B안으로 새로 시작']");
await page.waitForTimeout(1000); log("after 1s", await observe());
await page.waitForTimeout(2000); log("after 3s", await observe());

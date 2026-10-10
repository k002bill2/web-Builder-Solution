// RS-AC-15 재시도 ① — 모던 카페 브랜드로 프로필 확정 → 대비 요약 읽기
const task = await taskSpace("restart-impl resume-1 qa rs15");
console.log({ spaceId: task.spaceId });
const page = task.page("p1");
const btn = (re) => page.evaluate((src) => void [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim()))?.click(), re);
const has = (re) => page.waitForFunction((src) => [...document.querySelectorAll("button")].some((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).trim())), re, { timeout: 20000 });
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4359/catalog");
await has("비교 추가$");
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "비교 보드").click());
await page.waitForFunction(() => location.pathname === "/compare", undefined, { timeout: 10000 });
console.log(await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => (b.getAttribute("aria-label") || b.textContent).trim()).filter((t) => /전부 선택/.test(t))));
await page.click("loc=role:button[name='이 레퍼런스로 전부 선택: A 모던 카페 브랜드']");
await page.waitForTimeout(400);
await btn("^프로필 확정");
await has("^3안 만들기");
console.log(await page.evaluate(() => ({ contrast: [...document.querySelectorAll("summary, button")].map((b) => b.textContent.trim()).filter((t) => /대비|통과|미달/.test(t)), links: [...document.querySelectorAll("a")].map((a) => a.textContent.trim() + "→" + a.getAttribute("href")).filter((t) => /profile|v\d/.test(t)) })));

// EXPORT-SYNC-QA — 필드 실행 취소 표본(field-undo-1 qb.mjs 축약, 1280): 필드 입력 → blur → Control+z → 값 복귀
const page = (await taskSpace(16)).page("p1");
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^Hero/.test(b.textContent.trim()))?.click());
await page.waitForTimeout(800);
const id = await page.evaluate(() => document.getElementById("field-hero-1-title") ? "field-hero-1-title" : [...document.querySelectorAll("input[type=text]")].find((i) => i.id.startsWith("field-"))?.id);
console.log({ id });
const before = await page.evaluate((i) => document.getElementById(i).value, id);
await page.fill(`loc=css:#${id}`, "봄 신메뉴 출시 QA");
await page.evaluate(() => (document.getElementById("studio-sections-heading") ?? document.getElementById("studio-edit-heading"))?.focus());
await page.waitForTimeout(800);
const typed = await page.evaluate((i) => document.getElementById(i).value, id);
await page.keyboard.press("Control+z");
await page.waitForTimeout(800);
const undone = await page.evaluate((i) => document.getElementById(i).value, id);
const live = await page.evaluate(() => [...document.querySelectorAll("[role=status]")].map((s) => s.textContent.trim()).filter((t) => /취소|되돌/.test(t)));
console.log(JSON.stringify({ port: await page.evaluate(() => location.port), id, before, typed, undone, restored: undone === before, live }));

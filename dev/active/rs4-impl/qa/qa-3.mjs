// RS4 QA 3 — /projects → 프로필 보기 → B안 선택 → put 실패 주입 → B안으로 편집 시작 → 대화상자 → 새로 시작 → R-E4
const task = await taskSpace(1);
const page = task.page("p1");
const has = (re) => page.waitForFunction((src) => [...document.querySelectorAll("button")].some((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).replace(/\s+/g, " ").trim())), re, { timeout: 20000 });
const btn = (re) => page.evaluate((src) => { const el = [...document.querySelectorAll("button")].find((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).replace(/\s+/g, " ").trim())); if (!el) return "missing:" + src; el.click(); return "ok"; }, re);
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => /프로필 보기$/.test(a.getAttribute("aria-label") || "")).click());
await page.waitForFunction(() => /^\/profile\//.test(location.pathname), undefined, { timeout: 10000 });
await has("^B안 선택$");
console.log(await btn("^B안 선택$"));
await has("^B안으로 편집 시작$");
await page.evaluate(() => (window.__failPut = true));
console.log(await btn("^B안으로 편집 시작$"));
await page.waitForSelector("dialog[open]", { timeout: 15000 });
console.log(await page.evaluate(() => ({ dialog: document.querySelector("dialog[open]").innerText, buttons: [...document.querySelectorAll("dialog[open] button")].map((b) => b.textContent.trim()) })));

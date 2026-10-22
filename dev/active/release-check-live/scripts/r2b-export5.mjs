// R2b 재개 2 — r2b-export4에서 새로 시작 대화상자가 안 뜸(바로 편집기 진입 추정). 대화상자 단계는 선택적으로 두고 SEO → 정적 zip
const task = await taskSpace("release-check-live r2b-2");
const page = task.page("p1");
const log = (k, v) => console.log(k, JSON.stringify(v).slice(0, 1500));
const btn = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll("button")].find((b) => new RegExp(src).test(b.textContent.trim())); if (!b) return "missing"; b.click(); return "clicked"; }, re);
const has = (re, timeout = 30000) => page.waitForFunction((src) => [...document.querySelectorAll("button")].some((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).trim())), re, { timeout });
const ui = () => page.evaluate(() => ({ btn: [...document.querySelectorAll("button,a")].map((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 40) + (b.getAttribute("aria-disabled") === "true" || b.disabled ? "[disabled]" : "")).filter((t) => /내보내기|차단/.test(t)), gate: (document.body.innerText.match(/차단 \d+건[^\n]*/) || [""])[0] }));
log("path0", await page.evaluate(() => location.pathname)); if (await page.evaluate(() => !!document.querySelector("dialog[open]"))) log("restart", await btn("^B안으로 새로 시작$"));
await page.waitForFunction(() => /^\/studio\//.test(location.pathname) && !document.querySelector("dialog[open]"), undefined, { timeout: 30000 });
await page.waitForTimeout(2000);
log("B v2 gate", await ui());
await page.click("loc=role:button[name='첫 차단으로 이동']").catch((e) => log("no gate jump", String(e).slice(0, 120)));
await page.waitForTimeout(500);
await page.fill("loc=role:textbox[name*='제목']", "모던 카페").catch((e) => log("title err", String(e).slice(0, 150)));
await page.fill("loc=role:textbox[name*='설명']", "스페셜티 커피와 디저트를 제공하는 모던 카페입니다.").catch((e) => log("desc err", String(e).slice(0, 150)));
await page.waitForTimeout(2500);
log("gate after SEO", await ui());
log("path", await page.evaluate(() => location.pathname));
const dl = page.waitForEvent("download", { timeout: 60000 });
log("click zip", await btn("^정적 사이트\\(zip\\) 내보내기"));
try { const d = await dl; log("download", { url: d.url().slice(0, 40), suggested: d.suggestedFilename() }); await d.saveAs("/var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T//r2b-zip/export.zip"); log("saved", "/var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T//r2b-zip/export.zip"); }
catch (e) { log("dlErr", String(e)); }
await page.waitForTimeout(1000);
log("after", await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert]")].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 5)));

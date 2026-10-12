// EXPORT-SYNC-QA — preview 결과 내려받기 · 새로 시작 → 스냅샷 '새로 시작 전' 복원 표본(restart-impl qa-7 경로)
const D = "/Users/younghwankang/orca/workspaces/web-builder-solution/export-sync-qa/dev/active/export-sync-qa";
const { writeFile, stat } = await import("node:fs/promises");
const page = (await taskSpace(16)).page("p1");
const out = {}; const log = (k, v) => { out[k] = v; console.log("X", k, JSON.stringify(v).slice(0, 1500)); };
const dl = page.waitForEvent("download", { timeout: 30000 });
await page.click("loc=role:link[name='내려받기']");
try { const d = await dl; const p = `${D}/exports/site-4367.html`; await d.saveAs(p); log("download", { name: d.suggestedFilename(), bytes: (await stat(p)).size }); } catch (e) { log("download FAIL", String(e).slice(0, 200)); }
const click = (re) => page.evaluate((src) => void [...document.querySelectorAll("button")].find((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).trim())).click(), re);
const head = () => page.evaluate(() => ({ header: [...document.querySelectorAll("header *")].map((e) => e.textContent.trim()).filter((t) => /안 · 프로필 v\d/.test(t) && t.length < 40)[0], gate: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter((t) => /^대비 AA|^SEO/.test(t)) }));
log("before restore", await head());
await click("^스냅샷$");
await page.waitForSelector("dialog[open]", { timeout: 10000 });
log("snapshot list", await page.evaluate(() => document.querySelector("dialog[open]").innerText.split("\n").filter((l) => /새로 시작 전|내보내기 전|자동/.test(l)).slice(0, 8)));
await click("^새로 시작 전 미리보기$");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "이 스냅샷으로 복원"), undefined, { timeout: 10000 });
await click("^이 스냅샷으로 복원$");
await page.waitForFunction(() => /복원했습니다/.test(document.body.innerText), undefined, { timeout: 10000 });
await page.waitForTimeout(2500);
log("after restore", { ...(await head()), notice: await page.evaluate(() => [...document.querySelectorAll("[role=status]")].map((n) => n.textContent.trim()).filter((t) => /복원/.test(t))) });
const p = `${D}/shots/restored-4367.png`; await page.screenshot({ path: p }); log("shot", `${p} ${(await stat(p)).size}B`);
await writeFile(`${D}/logs/qa-restore-4367.json`, JSON.stringify(out, null, 1));

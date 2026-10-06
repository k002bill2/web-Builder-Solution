const S = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-e1/dev/active/m2c-e1/shots/";
const page = (await taskSpace(81)).page("p1");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some(b => b.textContent.includes("PNG 내려받기") && !b.getAttribute("aria-disabled")), undefined, { timeout: 20000 });
await page.evaluate(() => { window.__ev = []; if (!window.__evOn) { window.__evOn = 1; window.addEventListener("studio:editor", (e) => window.__ev.push(JSON.stringify(e.detail))); } });
console.log("SERVER preview(build) 4337 · PATH", TAG, await page.evaluate(() => location.pathname));
console.log("F2", await page.evaluate(() => (document.body.innerText.match(/[^\n]*시안 \(F2\)[^\n]*/g) || []).join(" / ")));
const dl = page.waitForEvent("download", { timeout: 20000 });
await page.click("loc=role:button[name*=\"PNG 내려받기\"]", { label: "PNG " + TAG });
const d = await dl.catch((e) => { console.log("NO DOWNLOAD", e.message); return null; });
if (d) { console.log("FILE", d.suggestedFilename()); await d.saveAs(`${S}prev-${TAG}.png`); }
await page.waitForTimeout(1500);
console.log("EVENTS", JSON.stringify(await page.evaluate(() => window.__ev)));
console.log("STATUS", await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert]")].map(e => e.innerText.trim()).filter(Boolean).join(" ## ")));
await page.evaluate(() => [...document.querySelectorAll("h2,h3")].find(h => h.textContent.trim() === "이미지로 저장")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}prev-${TAG}-notice.png` });

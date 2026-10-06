// M2C-REQA 3 — T-5: Hero 필드(펼침 상태만 읽기) + PNG 재시도 2회(문구 지시대로) + 콘솔 오류 수집
const S = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa/shots/";
const page = (await taskSpace(80)).page("p1");
const st = await page.evaluate(() => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); return d.open; });
if (!st) await page.click("text=이미지 편집 (1)", { label: "expand Hero panel" });
await page.waitForTimeout(700);
console.log("HERO", await page.evaluate(() => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); d.scrollIntoView({ block: "start" }); return `section=${document.querySelector("h2,h3")?.textContent} open=${d.open} ` + d.innerText.replace(/\n+/g, " | ").slice(0, 260); }));
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}t5-field-Hero.png` });
await page.evaluate(() => { window.__err = []; window.addEventListener("error", e => window.__err.push(String(e.message))); window.addEventListener("unhandledrejection", e => window.__err.push("rej:" + String(e.reason?.message || e.reason))); const oe = console.error; console.error = (...a) => { window.__err.push("ce:" + a.map(String).join(" ").slice(0, 300)); oe(...a); }; });
for (const k of [1, 2]) {
  await page.click("loc=role:button[name*=\"PNG 내려받기\"]", { label: "PNG retry " + k });
  let last = "";
  for (let i = 0; i < 25; i++) { await page.waitForTimeout(1000); const t = await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert]")].map(e => e.innerText.trim()).filter(Boolean).join(" ## ")); if (t !== last) { console.log(`TRY${k} T+${i + 1}`, t.slice(0, 300)); last = t; } }
}
console.log("ERRORS", JSON.stringify(await page.evaluate(() => window.__err)));

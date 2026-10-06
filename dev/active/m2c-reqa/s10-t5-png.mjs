// M2C-REQA 3 — T-5: Hero 필드 문구 + PNG 내려받기 개수 문구(앱 안 클릭)
const S = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa/shots/";
const page = (await taskSpace(80)).page("p1");
await page.click(`loc=role:button[name*="Hero"]`, { label: "section Hero" });
await page.waitForTimeout(1000);
await page.click("text=이미지 편집 (1)", { label: "expand Hero panel" });
await page.waitForTimeout(700);
console.log("HERO", await page.evaluate(() => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); d.scrollIntoView({ block: "start" }); return `open=${d.open} ` + d.innerText.replace(/\n+/g, " | ").slice(0, 300); }));
await page.waitForTimeout(500);
await page.screenshot({ path: `${S}t5-field-Hero.png` });
const before = await page.evaluate(() => document.body.innerText);
await page.click("loc=role:button[name*=\"PNG 내려받기\"]", { label: "PNG download" });
const seen = new Set();
for (let i = 0; i < 16; i++) {
  await page.waitForTimeout(1000);
  const t = await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert],[role=dialog]")].map(e => e.innerText.replace(/\n+/g, " | ").trim()).filter(Boolean).join(" ## "));
  if (t && !seen.has(t)) { seen.add(t); console.log("T+" + (i + 1), t.slice(0, 500)); }
}
const after = await page.evaluate(() => document.body.innerText);
const lines = after.split("\n").filter(l => l.trim() && !before.includes(l));
console.log("NEW LINES", JSON.stringify(lines.slice(0, 15)));
await page.evaluate(() => [...document.querySelectorAll("h2,h3")].find(h => h.textContent.trim() === "이미지로 저장")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}t5-png-notice.png` });

const page = (await taskSpace(37)).page("p1");
const F = "/tmp/m4a-qa-live/fx/";
const det = () => page.evaluate(() => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); return d ? `open=${d.open} | ` + d.innerText.replace(/\n+/g, " | ").slice(0, 300) : "패널없음"; });
const openPanel = async () => { await page.evaluate(() => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); if (d) d.open = true; }); await page.waitForTimeout(400); };
for (const [sec, file, alt] of [["Hero", "hero-1200x800.png", "카페 내부 전경"], ["About", "about-800x800.png", "바리스타가 커피를 내리는 모습"]]) {
  const cands = await page.evaluate((s) => [...document.querySelectorAll("button")].filter(b => (b.getAttribute("aria-label") ?? b.textContent).trim().startsWith(s)).map(b => (b.getAttribute("aria-label") ?? b.textContent).trim().slice(0, 50)), sec);
  console.log(sec, "cands", cands);
  await page.evaluate((s) => [...document.querySelectorAll("button")].find(b => (b.getAttribute("aria-label") ?? b.textContent).trim().startsWith(s))?.click(), sec);
  await page.waitForTimeout(1200);
  await openPanel();
  console.log(sec, "panel", await det());
  await page.setInputFiles("loc=css:details[open] input[type=file]", [F + file]);
  await page.waitForTimeout(3000);
  await page.fill("loc=css:details[open] input[type=text]", alt).catch(e => console.log("alt err", String(e).slice(0, 200)));
  await page.waitForTimeout(1200);
  console.log(sec, "after", await det());
}
console.log("gate", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("button")].filter(b => /차단|내보내기|PNG/.test(b.textContent)).map(b => `${b.textContent.trim().slice(0, 30)}:dis=${b.disabled || b.getAttribute("aria-disabled")}`))));
await page.screenshot({ path: "/tmp/m4a-qa-live/out/r02-editor-1280.png" });

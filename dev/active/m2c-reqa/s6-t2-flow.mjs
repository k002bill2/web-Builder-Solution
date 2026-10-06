// M2C-REQA 4 — T-2·P3 실화면(앱 안 클릭만, space 80/p1, 편집기 /studio/project-1 · 1280에서 시작)
const S = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa/shots/";
const F = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa/fixtures/";
const page = (await taskSpace(80)).page("p1");
const panel = (tag) => page.evaluate((tag) => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); const alt = d.querySelector("input[type=text]"); const ae = document.activeElement; return `${tag}: open=${d.open} status="${d.querySelector("[role=status]")?.textContent}" meta=${(/\d+ × \d+ · \S+ \S+/.exec(d.innerText) || ["없음"])[0]} alt="${alt?.value}" altDis=${alt?.getAttribute("aria-disabled")} deco=${d.querySelector("input[type=checkbox]")?.checked} btns=${[...d.querySelectorAll("button")].map(x => x.textContent.trim()).filter(Boolean).join("/")} focus=${ae?.tagName}|${(ae?.getAttribute("aria-label") || ae?.textContent?.trim() || "").slice(0, 20)}`; }, tag);
const open = await page.evaluate(() => [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")).open);
if (!open) await page.click("text=이미지 편집 (1)", { label: "expand image panel" });
await page.waitForTimeout(600);
console.log(await panel("OPEN"));
console.log("HELP", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")).innerText)));
await page.setInputFiles("loc=css:details[open] input[type=file]", [F + "f11-land-3x2.jpg"]);
await page.waitForTimeout(2500);
console.log(await panel("PICK1"));
await page.fill("loc=css:details[open] input[type=text]", "가로 패턴 그래픽");
await page.waitForTimeout(300);
console.log(await panel("ALT"));
await page.click("text=장식 이미지 — 대체텍스트 없이 둡니다", { label: "decorative on" });
await page.waitForTimeout(400);
console.log(await panel("DECO"));
await page.evaluate(() => [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")).scrollIntoView({ block: "start" }));
await page.screenshot({ path: `${S}t2-1280-before-replace.png` });
// 바꾸기 — 같은 파일 입력에 다른 이미지
await page.setInputFiles("loc=css:details[open] input[type=file]", [F + "f12-port-2x3.jpg"]);
await page.waitForTimeout(2500);
console.log(await panel("REPLACE"));
await page.screenshot({ path: `${S}t2-1280-after-replace.png` });
// 지우기 — 키보드 Enter
await page.evaluate(() => [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "이미지 지우기").focus());
await page.keyboard.press("Enter");
await page.waitForTimeout(1500);
console.log(await panel("CLEAR-ENTER"));
await page.screenshot({ path: `${S}t2-1280-after-clear.png` });
// 다시 넣고 폭 변경 펼침 유지
await page.setInputFiles("loc=css:details[open] input[type=file]", [F + "f11-land-3x2.jpg"]);
await page.waitForTimeout(2500);
for (const w of [768, 390, 1280]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: w === 390 ? 844 : w === 768 ? 1024 : 900, deviceScaleFactor: 1, mobile: false });
  await page.waitForTimeout(1200);
  const st = await page.evaluate(() => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); const tab = document.querySelector("[role=tab][aria-selected=true]"); return `details.open=${d.open} visible=${!!d.offsetParent} selectedTab=${tab?.textContent.trim() ?? "탭없음"} ox=${document.documentElement.scrollWidth - innerWidth}`; });
  console.log("WIDTH", w, st);
  await page.evaluate(() => [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")).scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${S}t2-width-${w}.png` });
}
console.log(await panel("END"));

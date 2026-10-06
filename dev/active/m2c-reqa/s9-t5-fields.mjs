// M2C-REQA 3 — T-5: 복귀 뒤 필드 문구(Hero·About) + 캔버스 + 내보내기 버튼 상태/문구
const S = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa/shots/";
const page = (await taskSpace(80)).page("p1");
const field = (tag) => page.evaluate((tag) => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); d.open = true; return `${tag}: ` + d.innerText.replace(/\n+/g, " | ").slice(0, 380); }, tag);
for (const [name, label] of [["Hero", "Hero"], ["About", "About"]]) {
  await page.click(`loc=role:button[name*="${label}"]`, { label: "section " + name });
  await page.waitForTimeout(1200);
  await page.click("loc=css:details summary >> text=이미지 편집", { label: "expand " + name }).catch(() => {});
  await page.waitForTimeout(500);
  console.log(await field(name));
  await page.evaluate(() => [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")).scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${S}t5-field-${name}.png` });
}
console.log("EXPORT", JSON.stringify(await page.evaluate(() => { const sec = [...document.querySelectorAll("h2,h3")].find(h => h.textContent.trim() === "내보내기")?.closest("section,div"); return { btns: [...document.querySelectorAll("button")].filter(b => /내보내기|PNG/.test(b.textContent)).map(b => `${b.textContent.trim().slice(0, 30)}:dis=${b.disabled}:aria=${b.getAttribute("aria-disabled")}:desc=${(b.getAttribute("aria-describedby") || "").split(" ").map(id => document.getElementById(id)?.textContent.trim().slice(0, 120)).join(" / ")}`), text: sec?.innerText.replace(/\n+/g, " | ").slice(0, 600) }; }), null, 1));

// M2C-REQA 3 — T-5 QB-10 새 경로(앱 안 클릭만). 시작 = 편집기 1280, Hero에 이미지 1장 들어간 상태.
const S = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa/shots/";
const F = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa/fixtures/";
const page = (await taskSpace(80)).page("p1");
const det = () => page.evaluate(() => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); return d ? d.innerText.replace(/\n+/g, " | ").slice(0, 400) : "패널없음"; });
// 768 편집 탭에서 펼침 확인
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
await page.waitForTimeout(1000);
await page.click("loc=role:tab[name='편집']", { label: "edit tab 768" });
await page.waitForTimeout(800);
console.log("768 edit tab", await page.evaluate(() => { const d = [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")); d.scrollIntoView({ block: "start" }); return `open=${d.open} visible=${!!d.offsetParent}`; }));
await page.waitForTimeout(800);
await page.screenshot({ path: `${S}t2-768-edit-tab-open.png` });
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.waitForTimeout(1200);
// 두 번째 이미지 — About
await page.click("loc=role:button[name*="About"]", { label: "About section" }).catch(async () => page.click("text=이야기 + 이미지", { label: "About section2" }));
await page.waitForTimeout(1200);
const o = await page.evaluate(() => [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집"))?.open);
console.log("About panel open", o);
if (o === false) await page.click("loc=css:details summary >> text=이미지 편집", { label: "expand" }).catch(() => page.evaluate(() => [...document.querySelectorAll("details")].find(x => x.querySelector("summary")?.textContent.includes("이미지 편집")).open = true));
await page.waitForTimeout(500);
await page.setInputFiles("loc=css:details[open] input[type=file]", [F + "f12-port-2x3.jpg"]);
await page.waitForTimeout(2500);
await page.fill("loc=css:details[open] input[type=text]", "세로 패턴 그래픽");
console.log("ABOUT", await det());
console.log("GATE-before", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("button")].filter(b => /차단|내보내기|PNG/.test(b.textContent)).map(b => `${b.textContent.trim().slice(0, 30)}:dis=${b.disabled || b.getAttribute("aria-disabled")}`))));
await page.evaluate(() => document.querySelector("iframe").scrollIntoView({ block: "start" }));
await page.waitForTimeout(1000);
await page.screenshot({ path: `${S}t5-before-leave.png` });
// 툴바 "프로젝트"
const links = await page.evaluate(() => [...document.querySelectorAll("a[href],button")].filter(e => e.offsetParent && /프로젝트/.test(e.textContent + (e.getAttribute("aria-label") || ""))).map(e => `${e.tagName}:${e.getAttribute("href")}:${(e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 30)}`));
console.log("PROJECT LINKS", JSON.stringify(links));

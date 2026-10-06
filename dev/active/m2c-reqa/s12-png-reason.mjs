// M2C-REQA 3 — PNG 실패 사유 코드(앱 이벤트 "studio:editor" 청취만, 코드 수정 0)
const page = (await taskSpace(80)).page("p1");
await page.evaluate(() => { window.__ev = []; window.addEventListener("studio:editor", (e) => window.__ev.push(JSON.stringify(e.detail))); });
await page.click("loc=role:button[name*=\"PNG 내려받기\"]", { label: "PNG try 4" });
await page.waitForTimeout(8000);
console.log("EVENTS", JSON.stringify(await page.evaluate(() => window.__ev)));
console.log("ALERT", await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert]")].map(e => e.innerText.trim()).filter(Boolean).join(" ## ")));
console.log("PREVIEW", await page.evaluate(() => [...document.querySelectorAll("[role=radio]")].map(r => r.textContent.trim() + ":" + r.getAttribute("aria-checked")).join(" ")));

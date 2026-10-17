const page = (await taskSpace(37)).page("p2");
console.log("alerts", await page.evaluate(() => document.querySelectorAll("[role=alert]").length));
const t0 = Date.now();
await page.click("loc=role:button[name='다시 시도']", { label: "retry export" });
await page.waitForFunction(() => [...document.querySelectorAll("[role=status]")].some(s => /만들었습니다/.test(s.textContent)), undefined, { timeout: 60000 }).catch(e => console.log("wait err", String(e).slice(0, 100)));
console.log("retry ms", Date.now() - t0, JSON.stringify(await page.evaluate(() => ({
  status: [...document.querySelectorAll("[role=status]")].map(s => s.textContent.trim()).filter(t => /만들었/.test(t)).map(t => t.slice(0, 140)),
  alert: [...document.querySelectorAll("[role=alert]")].map(s => s.textContent.trim()).filter(Boolean),
  focus: `${document.activeElement?.tagName}:${(document.activeElement?.textContent ?? "").trim().slice(0, 30)}`,
}))));

const page = (await taskSpace(37)).page("p2");
await page.cdp("Network.enable", {});
await page.cdp("Network.setBlockedURLs", { urls: [] });
const r = await page.fetch("/assets/exportFlow-DOcCQkYC.js", { timeout: 10000 }).catch(e => ({ err: String(e).slice(0, 120) }));
console.log("fetch chunk", r.status ?? r.err, r.ok);
const imp = await page.evaluate(async () => { try { await import("/assets/exportFlow-DOcCQkYC.js"); return "import ok"; } catch (e) { return "import fail: " + String(e).slice(0, 120); } });
console.log(imp);
console.log("alerts nonempty", await page.evaluate(() => [...document.querySelectorAll("[role=alert]")].filter(a => a.textContent.trim()).length));
const t0 = Date.now();
await page.click("loc=role:button[name='다시 시도']", { label: "retry export 2" });
await page.waitForFunction(() => [...document.querySelectorAll("[role=status]")].some(s => /만들었습니다/.test(s.textContent)), undefined, { timeout: 30000 }).catch(e => console.log("wait err", String(e).slice(0, 80)));
console.log("retry2 ms", Date.now() - t0, JSON.stringify(await page.evaluate(() => ({
  status: [...document.querySelectorAll("[role=status]")].map(s => s.textContent.trim()).filter(t => /만들었/.test(t)).map(t => t.slice(0, 100)),
  alert: [...document.querySelectorAll("[role=alert]")].map(s => s.textContent.trim()).filter(Boolean),
}))));

// 상세 긴 문자열 넘침 원인 분리: 태그만 / h1만 주입
const task = await taskSpace("visual-v2-apply longtext detail");
const page = task.page("p1");
const LONG = "가".repeat(30) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const out = [];
for (const w of [1280, 320]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
  for (const target of ["tag", "h1"]) {
    await page.goto("http://127.0.0.1:4345/references/" + "x");
    await page.goto("http://127.0.0.1:4345/catalog");
    await page.waitForSelector("article");
    await page.click("loc=css:article h3 a >> nth=0");
    await page.waitForURL(/references\//);
    await page.waitForTimeout(300);
    const r = await page.evaluate(({ LONG, target }) => {
      const el = target === "tag" ? [...document.querySelectorAll("span")].find((s) => s.textContent.trim() === "신뢰") : document.querySelector("h1");
      el.textContent = LONG;
      const cs = getComputedStyle(el);
      const culprit = [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(-1)[0];
      return { target, overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, whiteSpace: cs.whiteSpace, cls: el.className, culprit: culprit ? culprit.tagName + "." + String(culprit.className).slice(0, 80) : null };
    }, { LONG, target });
    out.push({ w, ...r });
  }
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
console.log(JSON.stringify(out, null, 1));
await task.finish({ keep: [] });

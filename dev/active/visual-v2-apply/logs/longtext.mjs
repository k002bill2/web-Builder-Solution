// 긴 문자열(공백 없는 90자) 주입 뒤 넘침·2줄 잘림·체크 행 높이 측정 (VISUAL-V2-APPLY 브리프 실행/수용)
const task = await taskSpace("visual-v2-apply longtext");
const page = task.page("p1");
const LONG = "가".repeat(30) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const out = [];
for (const w of [1280, 768, 390, 320]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.goto("http://127.0.0.1:4345/catalog");
  await page.waitForSelector("article");
  const cat = await page.evaluate((LONG) => {
    const a = document.querySelector("article h3 a");
    a.textContent = LONG;
    const lbl = document.querySelector('input[type=checkbox]')?.closest("label");
    const span = lbl && [...lbl.querySelectorAll("span")].find((s) => !s.getAttribute("aria-hidden"));
    if (span) span.textContent = LONG;
    const lh = parseFloat(getComputedStyle(a).lineHeight);
    return {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      titleLines: Math.round(a.getBoundingClientRect().height / lh),
      titleClamp: getComputedStyle(a).webkitLineClamp,
      checkRowH: lbl ? Math.round(lbl.getBoundingClientRect().height) : null,
      checkRowOverflow: lbl ? lbl.scrollWidth - lbl.clientWidth : null,
    };
  }, LONG);
  await page.click("loc=css:article h3 a >> nth=0");
  await page.waitForURL(/references\//);
  await page.waitForTimeout(300);
  const det = await page.evaluate((LONG) => {
    const tag = [...document.querySelectorAll("span")].find((s) => s.textContent.trim() === "신뢰");
    if (tag) tag.textContent = LONG;
    const h1 = document.querySelector("h1"); h1.textContent = LONG;
    return { overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, tagFound: !!tag };
  }, LONG);
  out.push({ w, catalog: cat, detail: det });
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
console.log(JSON.stringify(out));
await task.finish({ keep: [] });

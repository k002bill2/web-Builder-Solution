const task = await taskSpace(37);
const page = task.page("p2");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
for (const url of ["file:///tmp/m4a-qa-live/site/zip/index.html", "file:///tmp/m4a-qa-live/site/single.html"]) {
  await page.goto(url);
  await page.waitForLoadState("load");
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 3000))]);
    return {
      href: location.href.slice(0, 60),
      imgs: [...document.images].map(i => `${i.getAttribute("src").slice(0, 26)}:${i.complete && i.naturalWidth > 0 ? i.naturalWidth + "x" + i.naturalHeight : "FAIL"}`),
      fonts: [...document.fonts].map(f => `${f.family}/${f.weight}:${f.status}`),
      chk: { w400: document.fonts.check('400 16px Pretendard'), w700: document.fonts.check('700 16px Pretendard') },
      res: performance.getEntriesByType("resource").map(r => r.name.slice(-40)),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  console.log("L6", JSON.stringify(r));
  await page.screenshot({ path: `/tmp/m4a-qa-live/out/L6-${url.includes("single") ? "single" : "zip"}-1280.png` });
}

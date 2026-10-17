const task = await taskSpace(37);
const pages = await task.pages();
console.log("pages", pages.map(p => p.label));
const page = pages.find(p => p.label === "p2") ?? await task.newPage();
console.log("using", page.label);
const probe = () => page.evaluate(async () => {
  await document.fonts.ready;
  const imgs = [...document.images].map(i => `${i.getAttribute("src").slice(0, 30)}:${i.complete && i.naturalWidth > 0 ? i.naturalWidth + "x" + i.naturalHeight : "FAIL"}`);
  const fonts = [...document.fonts].map(f => `${f.family}/${f.weight}:${f.status}`);
  const chk = { w400: document.fonts.check('400 16px Pretendard'), w700: document.fonts.check('700 16px Pretendard') };
  const ff = getComputedStyle(document.body).fontFamily.slice(0, 60);
  const res = performance.getEntriesByType("resource").map(r => r.name.replace(location.origin, "") .slice(0, 80));
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return { imgs, fonts, chk, ff, res, overflow, scripts: document.scripts.length };
});
for (const url of ["http://127.0.0.1:4396/zip/index.html", "http://127.0.0.1:4396/single.html"]) {
  for (const w of [1280, 390]) {
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: w === 390 ? 844 : 900, deviceScaleFactor: 1, mobile: w === 390 });
    await page.goto(url);
    await page.waitForLoadState("load");
    await page.waitForTimeout(800);
    // lazy 이미지 로드 위해 끝까지 스크롤
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(800);
    const r = await probe();
    console.log("L4", url.split("/").slice(-2).join("/"), w, JSON.stringify(r).slice(0, 1400));
    await page.screenshot({ path: `/tmp/m4a-qa-live/out/L4-${url.includes("single") ? "single" : "zip"}-${w}.png` });
  }
}

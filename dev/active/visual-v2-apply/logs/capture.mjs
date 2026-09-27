// 사용: PHASE=before|after ego-browser nodejs < capture.mjs  (4345 서버 필요, 외부 접근 없음)
const phase = process.env.PHASE || "before";
const root = "/Users/younghwankang/orca/workspaces/web-builder-solution/visual-v2-apply/dev/active/visual-v2-apply";
const fs = await import("node:fs/promises");
const task = await taskSpace(`visual-v2-apply ${phase}`);
const page = task.page("p1");
const base = "http://127.0.0.1:4345";
const metrics = [];
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const measure = (name) => page.evaluate((name) => {
  const px = (el) => el ? Math.round(el.getBoundingClientRect().height) : null;
  const q = (s) => document.querySelector(s);
  const btns = [...document.querySelectorAll("button")];
  return {
    name,
    bodyFont: getComputedStyle(document.body).fontSize,
    navFont: q('nav[aria-label="주 메뉴"]') ? getComputedStyle(q('nav[aria-label="주 메뉴"]')).fontSize : null,
    searchH: px(q("input")?.closest("label")),
    checkbox: px(q('input[type=checkbox]')?.nextElementSibling),
    minButtonH: btns.length ? Math.min(...btns.filter(b=>b.offsetParent).map((b) => b.getBoundingClientRect().height)) : null,
    maxButtonH: btns.length ? Math.max(...btns.filter(b=>b.offsetParent).map((b) => b.getBoundingClientRect().height)) : null,
    cardTitle: q("article h2, article h3") ? getComputedStyle(q("article h2, article h3")).fontSize + "/" + getComputedStyle(q("article h2, article h3")).fontWeight : null,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}, name);
for (const w of [1280, 390, 768, 320]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
  const shot = w === 1280 || w === 390;
  await page.goto(`${base}/catalog`);
  await page.waitForSelector("article");
  metrics.push({ w, ...(await measure("catalog")) });
  if (shot) await page.screenshot({ path: `${root}/shots/${phase}-catalog-${w}.png` });
  // 상세: 첫 카드 제목 링크 (클라이언트 이동)
  await page.click("article h2 a, article h3 a >> nth=0").catch(async () => page.click("loc=css:article a >> nth=0"));
  await page.waitForURL(/references\//);
  await page.waitForTimeout(300);
  metrics.push({ w, ...(await measure("detail")) });
  if (shot) await page.screenshot({ path: `${root}/shots/${phase}-detail-${w}.png`, fullPage: true });
  await page.evaluate(() => history.back());
  await page.waitForSelector("article");
  // 비교 3개 담기
  for (let i = 0; i < 3; i++) {
    await page.evaluate((i) => { const b = [...document.querySelectorAll("article button")].filter((b) => /비교 추가/.test(b.textContent)); b[0]?.click(); }, i);
  }
  await page.evaluate(() => { const a = [...document.querySelectorAll("a")].find((a) => a.getAttribute("href") === "/compare"); a?.click(); });
  await page.waitForURL(/compare/);
  await page.waitForTimeout(300);
  // 첫 선택 버튼 누르기
  const picked = await page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-pressed]")].find((b) => b.offsetParent); if (!b) return null; b.click(); return { name: b.getAttribute("aria-label"), pressed: b.getAttribute("aria-pressed") }; });
  await page.waitForTimeout(200);
  const pickState = await page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-pressed=true]")].find((b) => b.offsetParent); return b ? { pressed: "true", text: b.textContent.trim(), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width) } : null; });
  metrics.push({ w, ...(await measure("compare")), picked, pickState });
  if (shot) await page.screenshot({ path: `${root}/shots/${phase}-compare-${w}.png`, fullPage: true });
  await page.evaluate(() => { const a = [...document.querySelectorAll("a")].find((a) => a.getAttribute("href") === "/profile"); a?.click(); });
  await page.waitForURL(/profile/);
  await page.waitForTimeout(300);
  metrics.push({ w, ...(await measure("profile")) });
  if (shot) await page.screenshot({ path: `${root}/shots/${phase}-profile-${w}.png`, fullPage: true });
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await fs.writeFile(`${root}/logs/metrics-${phase}.json`, JSON.stringify(metrics, null, 1));
console.log(JSON.stringify(metrics));
await task.finish({ keep: [] });

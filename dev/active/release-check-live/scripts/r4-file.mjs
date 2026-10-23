// R4 file:// 실측 — R4 생성기 zip(ditto -xk $TMPDIR/r4-site)을 file://로 열어 1280 → 390 CSP·이미지·폰트·메뉴·양성 대조.
const DIR = process.env.TMPDIR.replace(/\/+$/, "") + "/r4-site";
const fs = await import("node:fs");
const html = fs.readFileSync(DIR + "/index.html", "utf8");
fs.writeFileSync(DIR + "/index-pos.html", html.replace("</head>", "<script>window.__ran=1</script></head>"));
const task = await taskSpace("release-check-live r4 file");
const page = task.page("p1");
await page.cdp("Page.enable", {});
await page.cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.__v=[];document.addEventListener('securitypolicyviolation',function(e){window.__v.push(e.violatedDirective+' '+e.blockedURI)});" });
const res = {};
const measure = async (w) => {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.goto("file://" + DIR + "/index.html");
  await page.waitForTimeout(1500);
  await page.evaluate(async () => { for (let y = 0; y <= document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } window.scrollTo(0, document.documentElement.scrollHeight); await new Promise((r) => setTimeout(r, 800)); });
  return page.evaluate(async () => { await document.fonts.ready; const imgs = [...document.images];
    return { url: location.href, innerWidth: innerWidth, cspMeta: document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').length, violations: window.__v.slice(),
      imgs: imgs.filter((i) => i.complete && i.naturalWidth > 0).length + "/" + imgs.length, fontsStatus: document.fonts.status,
      faces: [...document.fonts].map((f) => f.family + " " + f.weight + " " + f.status), check700: document.fonts.check('700 16px "Pretendard"'), check400: document.fonts.check('400 16px "Pretendard"') }; });
};
try {
  res.w1280 = await measure(1280);
  res.w390 = await measure(390);
  await page.evaluate(() => window.scrollTo(0, 0));
  res.menu = { before: await page.evaluate(() => ({ open: document.querySelectorAll(":popover-open").length, hash: location.hash })) };
  await page.click(".kit-menu-button:not(.kit-close)");
  await page.waitForTimeout(400);
  res.menu.afterOpen = await page.evaluate(() => ({ open: document.querySelectorAll(":popover-open").length, anchor: document.querySelector(":popover-open a[href^='#']")?.getAttribute("href") }));
  await page.click(":popover-open a[href='" + res.menu.afterOpen.anchor + "']");
  await page.waitForTimeout(600);
  res.menu.afterAnchor = await page.evaluate(() => ({ open: document.querySelectorAll(":popover-open").length, hash: location.hash, targetExists: !!document.querySelector(location.hash), violations: window.__v.slice() }));
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.goto("file://" + DIR + "/index-pos.html");
  await page.waitForTimeout(1200);
  res.positive = await page.evaluate(() => ({ url: location.href, violations: window.__v.slice(), ran: window.__ran === 1 }));
} catch (e) { res.err = String(e && e.stack || e).slice(0, 800); }
console.log(JSON.stringify(res, null, 1));
try { await task.finish({ keep: [] }); console.log("finish ok"); } catch (e) { console.log("finish err " + e.message); }

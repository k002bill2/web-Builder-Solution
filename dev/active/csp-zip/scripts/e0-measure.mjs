// E0 실측 공용 — ego-browser nodejs 로 import. 대상 URL 목록을 받아 1280 로드 판정 + 390 메뉴 시나리오 + 양성 대조(인라인 script 주입)
export async function measure(task, targets) {
  const page = task.page("p1");
  await page.cdp("Page.enable", {});
  await page.cdp("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.__v=[];document.addEventListener("securitypolicyviolation",function(e){window.__v.push({d:e.effectiveDirective,u:e.blockedURI,s:(e.sample||"").slice(0,40)})});`,
  });
  const results = [];
  for (const { name, url } of targets) {
    const r = { name, url };
    // 1280 로드
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.goto(url);
    await page.waitForLoadState();
    await page.waitForFunction(() => document.fonts.status === "loaded" && [...document.images].every((i) => i.complete), undefined, { timeout: 15000 }).catch(() => (r.waitTimeout = true));
    r.load1280 = await page.evaluate(() => ({
      csp: document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').length,
      images: [...document.images].map((i) => ({ src: i.getAttribute("src").slice(0, 40), ok: i.complete && i.naturalWidth > 0 })),
      fonts: [...document.fonts].map((f) => `${f.family}/${f.weight}:${f.status}`),
      fontCheck: document.fonts.check('700 16px "Pretendard"') && [...document.fonts].some((f) => f.status === "loaded"),
      bodyFont: getComputedStyle(document.querySelector("[data-kit]") || document.body).fontFamily.slice(0, 40),
      violations: window.__v.slice(),
    }));
    // 390 메뉴 시나리오
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await page.goto(url);
    await page.waitForLoadState();
    await page.waitForFunction(() => document.fonts.status === "loaded", undefined, { timeout: 15000 }).catch(() => {});
    const sheetId = await page.evaluate(() => document.querySelector("[popover]")?.id ?? null);
    r.menu = { sheetId };
    if (sheetId) {
      await page.click(`button.kit-menu-button[popovertarget="${sheetId}"]:not(.kit-close)`, { label: "open menu sheet" });
      r.menu.openAfterClick = await page.evaluate((id) => document.getElementById(id).matches(":popover-open"), sheetId);
      const href = await page.evaluate((id) => document.getElementById(id).querySelector('a[href^="#"]')?.getAttribute("href") ?? null, sheetId);
      r.menu.anchor = href;
      if (href) {
        await page.click(`#${sheetId} a[href="${href}"] >> nth=0`, { label: "tap menu anchor" });
        await page.waitForTimeout(300);
        r.menu.after = await page.evaluate((id) => ({ open: document.getElementById(id).matches(":popover-open"), hash: location.hash, scrollY: Math.round(scrollY) }), sheetId);
      }
    }
    r.violationsMenu = await page.evaluate(() => window.__v.slice());
    // 양성 대조: 해시 밖 인라인 script 주입 → CSP 있으면 위반 1 + 미실행
    r.positiveControl = await page.evaluate(async () => {
      const before = window.__v.length;
      const s = document.createElement("script");
      s.textContent = "window.__pc=1";
      document.head.append(s);
      await new Promise((ok) => setTimeout(ok, 200));
      return { executed: window.__pc === 1, newViolations: window.__v.slice(before) };
    });
    await page.cdp("Emulation.clearDeviceMetricsOverride", {});
    results.push(r);
  }
  return results;
}

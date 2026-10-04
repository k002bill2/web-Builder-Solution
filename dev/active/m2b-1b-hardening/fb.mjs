// M2B-1b-hardening P1 — popover 폴백 브라우저 판정. 실행: { echo 'const PHASE="base";'; cat fb.mjs; } | ego-browser nodejs  (PHASE = base(수정 전 CSS) | fix(수정 뒤))
// 1) 4337 render.html에서 header 4변형 문서를 그려 정적 HTML(내보내기 그대로) = 원본(지원 경로)과 모의 미지원 사본을 static/에 쓴다.
// 2) 4339에서 각 문서를 최상위 페이지로 열어 1280·768·390 상태를 잰다.
// 모의 미지원(로컬 시험 사본만, 운영 마크업·CSS 불변): CSS의 `:popover-open`을 엔진이 모르는 `:x-mock-no-popover`로 바꿔 Chromium 파서가 스스로
//   그 선택자 목록 전체를 버리고 `@supports selector(:popover-open)`=false · `not`=true가 되게 한다 + 마크업 사본에서 popover·popovertarget* 속성 제거(UA 닫힘 숨김 규칙 해제).
//   = "selector()는 알고 popover는 모르는 엔진" 모의일 뿐, 실제 구형 UA 실측이 아니다.
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-1b-hardening/dev/active/m2b-1b-hardening";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(`m2b-1b-hardening fb ${PHASE}`);
const page = task.page("p1");
const H = { 1280: 900, 768: 1024, 390: 844 };
const W3 = [1280, 768, 390];
const setSize = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: H[width], deviceScaleFactor: 1, mobile: false });
const out = { phase: PHASE, at: new Date().toISOString() };
const log = (k, v) => { out[k] = v; console.log("FB", k, JSON.stringify(v)); };
const settle = () => page.waitForTimeout(350);
const VARIANTS = ["sticky-right-cta", "sticky-hamburger", "sticky-two-tier", "transparent"];
const MOCK = ":x-mock-no-popover";

await setSize(1280);
await page.goto("http://127.0.0.1:4337/render.html");
await page.waitForFunction(() => !!document.getElementById("root"), undefined, { timeout: 15000 });
await page.evaluate(async () => {
  const { sampleDoc, section, withSections } = await import("/src/engine/testing/sampleDoc.ts");
  const { buildStaticHtml } = await import("/src/features/studio/staticHtml/staticMarkup.ts");
  const kitTokens = (await import("/src/render/testing/sampleKitTokens.ts")).SAMPLE_KIT_TOKENS;
  window.__f = { sampleDoc, section, withSections, buildStaticHtml, kitTokens };
});
const build = async (v) => {
  await page.evaluate((v) => {
    const { sampleDoc, section, withSections, kitTokens } = window.__f;
    const d = sampleDoc();
    const sections = d.sections.filter((s) => s.type !== "cta-band").map((s) => (s.instanceId === "s-header" ? section("header", v, "s-header") : s));
    window.postMessage({ type: "render", doc: withSections(d, sections), kitTokens }, "*");
  }, v);
  await settle();
  return page.evaluate(() => {
    const css = [...document.styleSheets].map((s) => [...s.cssRules].map((r) => r.cssText).join("\n")).join("\n");
    return window.__f.buildStaticHtml({ markup: document.querySelector("[data-site-root]").outerHTML, css, title: "fb", description: "fb" });
  });
};

// 모의 변환 — 내역을 로그에 남긴다
const mock = (html) => {
  const count = (re) => (html.match(re) ?? []).length;
  const tr = { popoverOpenTokens: count(/:popover-open/g), supportsSelector: count(/selector\(:popover-open\)/g), popoverAttr: count(/\spopover="[^"]*"/g), popoverTargetAttr: count(/\spopovertarget(?:action)?="[^"]*"/g) };
  const next = html.replace(/:popover-open/g, MOCK).replace(/\spopover="[^"]*"/g, "").replace(/\spopovertarget(?:action)?="[^"]*"/g, "");
  return { next, tr };
};

const files = [];
for (const v of VARIANTS) {
  const html = await build(v);
  const { next, tr } = mock(html);
  await writeFile(`${DIR}/static/fb-${PHASE}-${v}.html`, html);
  await writeFile(`${DIR}/static/fb-${PHASE}-${v}-mock.html`, next);
  log(`transform-${v}`, tr);
  files.push(v);
}

// 상태 판정 — 같은 함수로 원본·모의 모두 잰다(정적 HTML은 data-slot을 지우므로 nav li · .kit-utility 클래스로 센다)
const STATE = () => {
  const h = document.querySelector("header");
  const vis = (el) => !!el && el.checkVisibility();
  const sheet = h.querySelector(".kit-sheet");
  const navItems = [...new Set([...h.querySelectorAll("nav li")].map((li) => li.textContent.trim()))];
  const visNavItems = [...new Set([...h.querySelectorAll("nav li")].filter(vis).map((li) => li.textContent.trim()))];
  const links = [...h.querySelectorAll("a[href]")].filter(vis);
  const focusable = links.filter((a) => { a.focus(); const ok = document.activeElement === a; a.blur(); return ok; }).length;
  const countRules = (list) => [...list].reduce((n, r) => n + 1 + (r.cssRules ? countRules(r.cssRules) : 0), 0);
  return {
    supportsPopoverOpen: CSS.supports("selector(:popover-open)"), supportsMock: CSS.supports("selector(:x-mock-no-popover)"), htmlPopoverApi: typeof HTMLElement.prototype.showPopover,
    popoverEls: document.querySelectorAll("[popover]").length, cssRules: countRules(document.styleSheets[0].cssRules),
    menuButtons: [...h.querySelectorAll(".kit-menu-button")].filter(vis).map((b) => b.textContent.trim()),
    navVisible: [...document.querySelectorAll("nav")].filter(vis).length,
    sheetVisible: vis(sheet), sheetPosition: sheet && getComputedStyle(sheet).position, sheetDisplay: sheet && getComputedStyle(sheet).display,
    navItems: navItems.length, visNavItems: visNavItems.length, allNavReachable: navItems.every((t) => visNavItems.includes(t)),
    links: links.length, focusableLinks: focusable,
    utilityVisible: [...h.querySelectorAll(".kit-utility")].filter(vis).length, utilityTotal: h.querySelectorAll(".kit-utility").length,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    headerH: Math.round(h.getBoundingClientRect().height),
  };
};

await page.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
for (const v of files) {
  for (const kind of ["orig", "mock"]) {
    await page.goto(`http://127.0.0.1:4339/fb-${PHASE}-${v}${kind === "mock" ? "-mock" : ""}.html`);
    for (const w of W3) {
      await setSize(w); await settle();
      await page.evaluate(() => scrollTo(0, 0));
      const s = await page.evaluate(STATE);
      let native = null;
      if (kind === "orig" && s.menuButtons.includes("메뉴")) {
        // 지원 경로 회귀: 열기 → Esc 닫힘 · 포커스 복귀 → 다시 열기 → 시트 안 앵커 누름(r4.12 고정 스크립트) 닫힘
        const open1 = await page.evaluate(() => { const b = [...document.querySelectorAll("header .kit-menu-button")].find((x) => x.checkVisibility() && x.textContent.trim() === "메뉴"); b.focus(); b.click(); return document.querySelector(".kit-sheet").matches(":popover-open"); });
        await page.keyboard.press("Escape"); await settle();
        const esc = await page.evaluate(() => ({ closed: !document.querySelector(".kit-sheet").matches(":popover-open"), focusBack: document.activeElement?.textContent.trim() === "메뉴" && document.activeElement.classList.contains("kit-menu-button") }));
        const anchor = await page.evaluate(() => { const b = [...document.querySelectorAll("header .kit-menu-button")].find((x) => x.checkVisibility() && x.textContent.trim() === "메뉴"); b.click(); const p = document.querySelector(".kit-sheet"); const opened = p.matches(":popover-open"); const a = [...p.querySelectorAll('a[href^="#"]')].find((x) => x.checkVisibility()); a.click(); return { opened, href: a.getAttribute("href"), closed: !p.matches(":popover-open") }; });
        native = { open1, esc, anchor };
        await page.evaluate(() => scrollTo(0, 0));
      }
      log(`${kind}-${v}-${w}`, { ...s, native });
    }
  }
}
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/fb-${PHASE}.json`, JSON.stringify(out, null, 1));
await task.finish({ keep: [] });

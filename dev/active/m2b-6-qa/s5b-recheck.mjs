// S5 재확인 — 열린 시트 opacity가 시간 경과로 1이 되는지(전환 정지 = 환경 여부) · 감소 설정 시 열림 즉시 1 · 모션 endTime 최댓값 · CTA 링 캡처 2회차
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-6-qa/dev/active/m2b-6-qa";
const { writeFile, readFile } = await import("node:fs/promises");
const task = await taskSpace(68);
const page = task.page("p1");
const out = JSON.parse(await readFile(`${DIR}/logs/s5-carry.json`, "utf8"));
const log = (k, v) => { out[k] = v; console.log("C", k, JSON.stringify(v).slice(0, 700)); };
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4339/header--sticky-hamburger.html");
await page.waitForTimeout(600);
await page.click("header .kit-menu-button:not(.kit-close)");
const seq = [];
for (const ms of [100, 400, 1500, 3000]) { await page.waitForTimeout(ms - (seq.at(-1)?.ms ?? 0)); seq.push({ ms, ...(await page.evaluate(() => { const s = document.querySelector(".kit-sheet"); const c = getComputedStyle(s); return { open: s.matches(":popover-open"), op: c.opacity, tf: c.transform, anims: s.getAnimations().map((a) => `${a.transitionProperty ?? a.animationName}:${a.playState}:${Math.round(a.currentTime ?? -1)}`) }; })) }); }
log("sheet open timeline (motion on)", seq);
await page.keyboard.press("Escape");
await page.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await page.goto("http://127.0.0.1:4339/header--sticky-hamburger.html");
await page.waitForTimeout(400);
await page.click("header .kit-menu-button:not(.kit-close)");
await page.waitForTimeout(50);
log("sheet open reduce +50ms", await page.evaluate(() => { const s = document.querySelector(".kit-sheet"); return { open: s.matches(":popover-open"), op: getComputedStyle(s).opacity }; }));
await page.cdp("Emulation.setEmulatedMedia", { features: [] });
// 모션 종료 시각 상한(계산 타이밍) — L2 문서
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://127.0.0.1:4339/_motion-L2.html");
log("motion endTime max(ms) 1280", await page.evaluate(() => document.getAnimations().map((a) => Math.round(a.effect.getComputedTiming().endTime)).sort((x, y) => y - x).slice(0, 4)));
// CTA 링 캡처 2회차
await page.goto("http://127.0.0.1:4339/cta-band--banner.html");
await page.waitForTimeout(500);
await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
try { await page.screenshot({ path: `${DIR}/logs/cta-tab-ring-1280.png` }); log("CTA shot 2", "ok"); } catch (e) { log("CTA shot 2", "FAIL " + String(e).slice(0, 100)); }
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await writeFile(`${DIR}/logs/s5-carry.json`, JSON.stringify(out, null, 1));

// S4 E2E — 비교 대화상자 열기(1280): 열기 직후 프레임 축소 타임라인 · 열 수 · 축소율 · status · 버튼 목록 · Tab 순서 · 캡처 시도
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-6-qa/dev/active/m2b-6-qa";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(68);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("E", k, JSON.stringify(v).slice(0, 1500)); };
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.waitForTimeout(500);
await page.evaluate(() => {
  window.__tl = []; const t0 = performance.now();
  const probe = () => { const d = document.querySelector("dialog[open]"); if (d) { const fr = [...d.querySelectorAll("iframe")].map((f) => { const w = f.parentElement; const col = f.closest("section, li, article") ?? w.parentElement; return { fw: Math.round(f.getBoundingClientRect().width), zoom: w.style.zoom || getComputedStyle(w).zoom, colW: Math.round(col.getBoundingClientRect().width), vis: getComputedStyle(f).visibility, op: getComputedStyle(w).opacity }; }); window.__tl.push({ t: Math.round(performance.now() - t0), fr }); } };
  const mo = new MutationObserver(probe); mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "open"] });
  window.__stop = () => mo.disconnect();
});
await page.click("loc=role:button[name='3안 실제 화면으로 비교']");
await page.waitForFunction(() => document.querySelector("dialog[open]"), undefined, { timeout: 15000 });
await page.waitForFunction(() => (document.querySelector("dialog [role=status]")?.textContent ?? "") !== "", undefined, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);
log("open timeline(first 8 + last)", await page.evaluate(() => { window.__stop(); const tl = window.__tl; return [...tl.slice(0, 8), tl.at(-1), { count: tl.length }]; }));
log("dialog", await page.evaluate(() => { const d = document.querySelector("dialog[open]"); const r = d.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), title: d.querySelector("h2,h1")?.textContent, status: [...d.querySelectorAll("[role=status],[role=alert]")].map((s) => s.textContent.trim()), iframes: d.querySelectorAll("iframe").length, sandbox: [...d.querySelectorAll("iframe")].map((f) => f.getAttribute("sandbox")), inert: [...d.querySelectorAll("iframe")].map((f) => !!f.closest("[inert]")), buttons: [...d.querySelectorAll("button")].map((b) => (b.getAttribute("aria-label") ?? "") + "|" + b.textContent.trim().slice(0, 25) + (b.getAttribute("aria-pressed") ? "|pressed=" + b.getAttribute("aria-pressed") : "")), overflowX: document.scrollingElement.scrollWidth - window.innerWidth, colHeads: [...d.querySelectorAll("h3")].map((h) => h.textContent.trim()) }; }));
// Tab 순서(대화상자 안) — 실제 키
const order = [];
for (let i = 0; i < 14; i++) { await page.keyboard.press("Tab"); order.push(await page.evaluate(() => { const a = document.activeElement; return `${a.tagName}${a.tabIndex === 0 && a.tagName === "DIV" ? "[scroll tabindex0]" : ""}|${(a.getAttribute("aria-label") ?? a.textContent).trim().slice(0, 22)}|inDialog=${!!a.closest("dialog")}`; })); }
log("Tab order", order);
for (let i = 1; i <= 2; i++) { try { await page.screenshot({ path: `${DIR}/logs/compare-1280-cdp.png` }); log("shot" + i, "ok"); break; } catch (e) { log("shot" + i, "FAIL " + String(e).slice(0, 90)); } }
await writeFile(`${DIR}/logs/s4-compare-open.json`, JSON.stringify(out, null, 1));

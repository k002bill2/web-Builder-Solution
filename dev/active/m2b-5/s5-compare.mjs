// M2B-5 S5 [B] — `ego-browser nodejs < s5-compare.mjs`. 4337 = vite preview(S4 dist). 앱 안 클릭만(새로고침·goto 0) — 이미 /profile/profile-1(보드 확정 직후)에 있다는 전제.
// B1 1280 3열 실렌더 · B2 Tab/inert·Esc 복귀 · B3 4폭 축소율·가로 넘침 · B4 status AX · B5 프레임 안 모션 · B6 선택 성공 status
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-5/dev/active/m2b-5";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(67);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("B", k, JSON.stringify(v).slice(0, 900)); };
const H = { 1280: 900, 1024: 768, 768: 1024, 390: 844 };
const setSize = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: H[width], deviceScaleFactor: 1, mobile: false });
const clickText = (t) => page.evaluate((t) => { const b = [...document.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent.trim()) === t || b.textContent.trim() === t); if (!b) throw new Error("no " + t); b.click(); }, t);
const statusAX = async () => {
  const { nodes } = await page.cdp("Accessibility.getFullAXTree", {});
  return nodes.filter((n) => n.role?.value === "status" || n.role?.value === "alert").map((n) => ({ role: n.role.value, name: n.name?.value, ignored: n.ignored }));
};
const statusText = () => page.evaluate(() => document.querySelector("dialog [role=status]")?.textContent ?? null);
const measure = () => page.evaluate(() => {
  const d = document.querySelector("dialog");
  const frames = [...d.querySelectorAll("iframe")];
  return {
    open: d.open, columns: d.querySelectorAll("section h3").length, iframes: frames.length,
    frames: frames.map((f) => { const z = f.parentElement; return { title: f.title, zoom: z.style.zoom || "1", frameW: z.getBoundingClientRect().width, colW: Math.round(z.closest("section").getBoundingClientRect().width), height: f.style.height, inert: !!f.closest("[inert]"), sandbox: f.getAttribute("sandbox") }; }),
    lines: [...d.querySelectorAll("section p")].map((p) => p.textContent).filter((t) => /축소|그리는|그렸|못했/.test(t)),
    dialogOverflow: d.scrollWidth - d.clientWidth, docOverflow: document.scrollingElement.scrollWidth - innerWidth, vw: innerWidth,
  };
});
const tabs = (n) => page.evaluate(() => document.querySelector('dialog [role="radio"][tabindex="0"]').focus()).then(async () => {
  const seq = [];
  for (let i = 0; i < n; i++) {
    seq.push(await page.evaluate(() => { const a = document.activeElement; return `${a.tagName}${a.getAttribute("role") ? "[" + a.getAttribute("role") + "]" : ""}:${(a.getAttribute("aria-label") ?? a.textContent).trim().slice(0, 24)}`; }));
    await page.keyboard.press("Tab");
  }
  return seq;
});
const motion = async () => {
  const { frameTree } = await page.cdp("Page.getFrameTree", {});
  const res = [];
  for (const child of frameTree.childFrames ?? []) {
    const { executionContextId } = await page.cdp("Page.createIsolatedWorld", { frameId: child.frame.id, worldName: "s5" });
    const { result } = await page.cdp("Runtime.evaluate", { contextId: executionContextId, returnByValue: true, expression: `({ url: location.pathname, play: document.querySelectorAll("[data-motion-play]").length, anims: document.getAnimations().length, running: document.getAnimations().filter(a => a.playState === "running").length, kit: document.querySelectorAll("[data-kit]").length })` });
    res.push(result.value);
  }
  return res;
};

await setSize(1280);
const shot = async (path) => { try { await page.screenshot({ path }); return path; } catch (e) { return `screenshot 실패: ${e.message}`; } };
const zoomed = () => page.waitForFunction(() => [...document.querySelectorAll("dialog iframe")].every((f) => f.parentElement.style.zoom || f.parentElement.closest("section").getBoundingClientRect().width >= f.parentElement.getBoundingClientRect().width), undefined, { timeout: 10000 }).then(() => "ok", (e) => "zoom 대기 실패: " + e.message);
if (await page.evaluate(() => !!document.querySelector("dialog[open]"))) { log("resume", "대화상자가 이미 열림 → Esc로 닫고 다시 연다(앱 안 조작)"); await page.keyboard.press("Escape"); await page.waitForTimeout(300); }
else { await clickText("3안 만들기 (v1)"); }
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "3안 실제 화면으로 비교"), undefined, { timeout: 30000 });
await clickText("3안 실제 화면으로 비교");
await page.waitForFunction(() => document.querySelector("dialog[open]"), undefined, { timeout: 15000 });
log("open-focus", await page.evaluate(() => `${document.activeElement.getAttribute("role")}:${document.activeElement.textContent}`));
await page.waitForFunction(() => (document.querySelector("dialog [role=status]")?.textContent ?? "") !== "", undefined, { timeout: 20000 });
log("B4 status@1280 dom", await statusText());
log("B4 status@1280 AX", await statusAX());
log("zoom wait 1280", await zoomed());
log("B1/B3 1280", await measure());
log("shot", await shot(`${DIR}/shots/b1-1280-desktop.png`));
log("B5 motion (reduce off)", await motion());
await page.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
log("B5 motion (reduce on)", await motion());
await page.cdp("Emulation.setEmulatedMedia", { features: [] });
log("B2 Tab 1280", await tabs(12));
for (const w of [1024, 768, 390]) {
  await setSize(w);
  await page.waitForTimeout(1500);
  log(`zoom wait ${w}`, await zoomed());
  log(`B3 ${w}`, await measure());
  log("shot", await shot(`${DIR}/shots/b3-${w}-desktop.png`));
}
log("B2 Tab 390", await tabs(10));
await clickText("모바일");
await page.waitForTimeout(1200);
log("B3 390 mobile frame", await measure());
log("shot", await shot(`${DIR}/shots/b3-390-mobile.png`));
await setSize(1280);
await page.waitForTimeout(2000);
log("B3 1280 mobile frame", await measure());
log("shot", await shot(`${DIR}/shots/b3-1280-mobile.png`));
await clickText("데스크톱");
await clickText("B안 선택");
await page.waitForFunction(() => document.querySelector("dialog [role=status]")?.textContent === "B안을 선택했습니다", undefined, { timeout: 10000 });
log("B6 select success dom", await statusText());
log("B6 select success AX", await statusAX());
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
log("B2 Esc", await page.evaluate(() => ({ dialog: !!document.querySelector("dialog"), iframes: document.querySelectorAll("iframe").length, focus: document.activeElement.textContent.trim(), cardSelected: document.querySelector('ul[aria-label="3안"] button[aria-pressed="true"]')?.getAttribute("aria-label") })));
await writeFile(`${DIR}/logs/s5-browser.json`, JSON.stringify(out, null, 1));

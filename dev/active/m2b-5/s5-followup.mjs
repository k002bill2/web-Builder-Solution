// S5 보강 — AX status 자식 글자 · 프레임(불투명 출처 OOPIF) 모션 · 스크린샷(cdp 직접). 앱 안 클릭만.
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-5/dev/active/m2b-5";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(67);
const page = task.page("p1");
const out = {};
const log = (k, v) => { out[k] = v; console.log("B", k, JSON.stringify(v).slice(0, 900)); };
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "3안 실제 화면으로 비교").click());
await page.waitForFunction(() => (document.querySelector("dialog [role=status]")?.textContent ?? "") !== "", undefined, { timeout: 20000 });
await page.waitForTimeout(1500);
const { nodes } = await page.cdp("Accessibility.getFullAXTree", {});
const byId = new Map(nodes.map((n) => [n.nodeId, n]));
const text = (n) => [n.name?.value ?? "", ...(n.childIds ?? []).map((id) => byId.get(id)).filter(Boolean).map(text)].join("");
log("B4 AX status/alert 글자", nodes.filter((n) => ["status", "alert"].includes(n.role?.value)).map((n) => ({ role: n.role.value, text: text(n), ignored: n.ignored })));
log("B2 AX iframe 노출", nodes.filter((n) => ["Iframe", "iframe"].includes(n.role?.value)).map((n) => ({ name: n.name?.value, ignored: n.ignored, reasons: (n.ignoredReasons ?? []).map((r) => r.name) })));
try {
  const { targetInfos } = await task.cdp("Target.getTargets", {});
  const frames = targetInfos.filter((t) => t.type === "iframe");
  log("OOPIF targets", frames.map((t) => t.url));
  const res = [];
  for (const t of frames) {
    const { sessionId } = await task.cdp("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const r = await task.cdp("Runtime.evaluate", { returnByValue: true, expression: `({ play: document.querySelectorAll("[data-motion-play]").length, anims: document.getAnimations().length, kit: document.querySelectorAll("[data-kit]").length, reduce: matchMedia("(prefers-reduced-motion: reduce)").matches })` }, { sessionId });
    res.push(r.result.value);
  }
  log("B5 프레임 안 모션", res);
} catch (e) { log("B5 프레임 접근 실패", String(e.message ?? e)); }
for (const w of [1280, 390]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: w === 1280 ? 900 : 844, deviceScaleFactor: 1, mobile: false });
  await page.waitForTimeout(1500);
  try {
    const { data } = await page.cdp("Page.captureScreenshot", { format: "jpeg", quality: 60, clip: { x: 0, y: 0, width: w, height: w === 1280 ? 900 : 844, scale: 1 } }, { timeout: 60000 });
    await writeFile(`${DIR}/shots/b-${w}.jpg`, Buffer.from(data, "base64"));
    log(`shot ${w}`, "ok");
  } catch (e) { log(`shot ${w}`, String(e.message ?? e)); }
}
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.keyboard.press("Escape");
await writeFile(`${DIR}/logs/s5-followup.json`, JSON.stringify(out, null, 1));

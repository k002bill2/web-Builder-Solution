// 05d OOPIF 측정 — d05-ego.mjs 뒤 같은 탭. page 세션 Target.setAutoAttach(flatten:false) → render.html 자식 세션에 Target.sendMessageToTarget(Runtime.evaluate) → page.events()의 receivedMessageFromTarget 판독
const task = await taskSpace("release-check-live 05d");
const page = task.page("p1");
const expr = `(() => { const r = document.querySelector("[data-site-root]") || document.documentElement; const rs = getComputedStyle(r); const v = (k) => rs.getPropertyValue(k).trim();
  const hs = [...document.querySelectorAll("h1,h2")].slice(0, 3).map((h) => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 30), fontSize: getComputedStyle(h).fontSize }));
  return JSON.stringify({ url: location.pathname, w: innerWidth, rootFs: getComputedStyle(document.documentElement).fontSize, t1: v("--site-t1"), t2: v("--site-t2"), t3: v("--site-t3"), t4: v("--site-t4"), t5: v("--site-t5"), headings: hs }); })()`;
const out = { path: await page.evaluate(() => location.pathname), steps: [] };
await page.events();
try {
  out.steps.push({ autoAttach: await page.cdp("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: false, flatten: false }) });
} catch (e) { out.steps.push({ autoAttachErr: String(e).slice(0, 200) }); }
await page.waitForTimeout(500);
let evs = await page.events();
out.steps.push({ evNames: evs.map((e) => e.method ?? e.name ?? Object.keys(e).join(",")).slice(0, 20) });
const att = evs.filter((e) => (e.method ?? e.name) === "Target.attachedToTarget").map((e) => e.params ?? e.data ?? e);
out.attached = att.map((a) => ({ sid: a.sessionId, url: a.targetInfo?.url }));
const r = att.find((a) => /render\.html/.test(a.targetInfo?.url ?? ""));
if (r) {
  await page.cdp("Target.sendMessageToTarget", { sessionId: r.sessionId, message: JSON.stringify({ id: 7001, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true } }) });
  await page.waitForTimeout(800);
  evs = await page.events();
  const msg = evs.filter((e) => (e.method ?? e.name) === "Target.receivedMessageFromTarget").map((e) => JSON.parse((e.params ?? e.data ?? e).message)).find((m) => m.id === 7001);
  out.result = msg?.result?.result?.value ?? msg ?? { evNames: evs.map((e) => e.method ?? e.name).slice(0, 20) };
}
if (globalThis.FIRST_EVENT_SHAPE) out.sample = JSON.stringify(evs[0]).slice(0, 300);
console.log(JSON.stringify(out, null, 1));

// 05d OOPIF 시도 3 — page 세션에서 Target.getTargets → attachToTarget(flatten:false) → sendMessageToTarget, 이벤트는 page.events(); 실패 시 DOM.getDocument(pierce) 로 iframe 문서 노출 여부
const task = await taskSpace("release-check-live 05d");
const page = task.page("p1");
const out = {};
await page.events();
try {
  const { targetInfos } = await page.cdp("Target.getTargets", {});
  const t = targetInfos.find((x) => /4399\/render\.html/.test(x.url));
  out.target = t && { type: t.type, url: t.url, attached: t.attached };
  const { sessionId } = await page.cdp("Target.attachToTarget", { targetId: t.targetId, flatten: false });
  out.sessionId = sessionId;
  await page.cdp("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: "(()=>{const r=getComputedStyle(document.querySelector('[data-site-root]')||document.documentElement);return JSON.stringify({u:location.pathname,w:innerWidth,rootFs:getComputedStyle(document.documentElement).fontSize,h1:[...document.querySelectorAll('h1')].map(h=>({text:h.textContent.trim().slice(0,30),fs:getComputedStyle(h).fontSize})),t1:r.getPropertyValue('--site-t1').trim(),t5:r.getPropertyValue('--site-t5').trim()})})()", returnByValue: true } }) });
  await page.waitForTimeout(800);
  const evs = await page.events();
  out.events = evs.map((e) => e.method);
  const m = evs.filter((e) => e.method === "Target.receivedMessageFromTarget").map((e) => JSON.parse(e.params.message)).find((x) => x.id === 1);
  out.value = m?.result?.result?.value ? JSON.parse(m.result.result.value) : m;
} catch (e) { out.err = String(e).slice(0, 300); }
try {
  const d = await page.cdp("DOM.getDocument", { depth: -1, pierce: true });
  const s = JSON.stringify(d);
  const i = s.indexOf("render.html");
  out.pierce = { len: s.length, hasRender: i >= 0, h1InTree: /"nodeName":"H1"/.test(s) };
} catch (e) { out.pierceErr = String(e).slice(0, 200); }
console.log(JSON.stringify(out, null, 1));

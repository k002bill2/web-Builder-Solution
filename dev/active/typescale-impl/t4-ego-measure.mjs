// TS-AC-13 실측 2 — t4-ego.mjs 뒤 같은 탭(/studio)에서 편집 캔버스(sandbox iframe render.html) 안 제목 font-size 측정(CDP isolated world)
const task = await taskSpace("typescale-impl t4 ts-ac-13");
const page = task.page("p1");
const tree = await page.cdp("Page.getFrameTree", {});
const child = (tree.frameTree.childFrames ?? []).map((c) => c.frame).find((f) => /render\.html/.test(f.url));
console.log({ frame: child?.url });
const { executionContextId } = await page.cdp("Page.createIsolatedWorld", { frameId: child.id, worldName: "t4" });
const expr = `(() => {
  const hs = [...document.querySelectorAll("h1,h2")].slice(0, 4).map((h) => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 30), fontSize: getComputedStyle(h).fontSize }));
  const p = document.querySelector("p");
  const vars = [...document.querySelectorAll("[style]")].flatMap((el) => [...el.style].filter((k) => k.startsWith("--") && /scale|type|size/i.test(k)).map((k) => k + ":" + el.style.getPropertyValue(k).trim())).slice(0, 15);
  return JSON.stringify({ w: innerWidth, headings: hs, pFontSize: p ? getComputedStyle(p).fontSize : null, vars });
})()`;
const r = await page.cdp("Runtime.evaluate", { expression: expr, contextId: executionContextId, returnByValue: true });
console.log(r.result.value ?? r);

// FIX-2A04-NARROW 브라우저 측정 — `ego-browser nodejs < measure.mjs` (환경변수 없이, 파일 끝의 PHASE만 바꿔 실행)
// 보드에서 v1(Hero A) → v2(전부 C) → v3(전부 B) 확정 → ?v=1&diff=3 (pushState+popstate, 메모리 저장소라 새로고침 금지)
// 768·390·320: 캡처 + 수치 JSON + Chromium AX 트리(표 하위)
const PHASE = globalThis.PHASE ?? "before";
const OUT = "/Users/younghwankang/orca/workspaces/web-builder-solution/2a-04-narrow/dev/active/2a-04-narrow";
const { writeFile } = await import("node:fs/promises");
const task = await taskSpace(26);
const page = task.page("p1");
const setWidth = (width) => page.cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });

await setWidth(1280);
await page.goto("http://127.0.0.1:4337/catalog");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => (b.getAttribute("aria-label") || b.textContent).trim().endsWith("비교 추가")), undefined, { timeout: 15000 });
for (const n of ["모던 카페 브랜드", "프리미엄 헤어살롱", "동네 치과 클리닉"]) await page.click(`loc=role:button[name='${n} 비교 추가']`);
await page.click("loc=role:button[name='비교 보드 열기']");

async function confirmOn(select) {
  await page.waitForFunction(() => location.pathname === "/compare" && [...document.querySelectorAll("button")].some((b) => /이 요소 선택/.test(b.textContent)), undefined, { timeout: 15000 });
  await page.click(select);
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^(프로필 확정|새 버전으로 확정)/.test(b.textContent.trim()) && b.getAttribute("aria-disabled") !== "true" && !b.disabled), undefined, { timeout: 15000 });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^(프로필 확정|새 버전으로 확정)/.test(b.textContent.trim())).click());
  await page.waitForFunction(() => location.pathname.startsWith("/profile/") && document.querySelector("h1")?.textContent === "디자인 프로필", undefined, { timeout: 15000 });
}
await confirmOn("loc=css:button[aria-label='Hero 구성: A 모던 카페 브랜드의 요소 선택']");
await page.click("loc=role:link[name='비교 보드에서 선택 바꾸기']");
await confirmOn("loc=css:button[aria-label='이 레퍼런스로 전부 선택: C 동네 치과 클리닉']");
await page.click("loc=role:link[name='비교 보드에서 선택 바꾸기']");
await confirmOn("loc=css:button[aria-label='이 레퍼런스로 전부 선택: B 프리미엄 헤어살롱']");
await page.evaluate(() => { history.pushState(null, "", location.pathname + "?v=1&diff=3"); dispatchEvent(new PopStateEvent("popstate")); });
await page.waitForFunction(() => document.querySelector("table caption")?.textContent === "v1과 v3 비교", undefined, { timeout: 15000 });

function measure() {
  const box = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
  const table = [...document.querySelectorAll("table")].find((t) => t.querySelector("caption")?.textContent === "v1과 v3 비교");
  const wrap = table.parentElement;
  const rows = [...table.querySelectorAll("tr")];
  const cells = rows.slice(0, 5).map((tr) => [...tr.children].map((c) => [c.textContent, ...box(c), getComputedStyle(c).display]));
  const summaries = [...document.querySelectorAll('ul[aria-label="버전 목록"] > li')].map((li) => {
    const s = [...li.querySelectorAll("span.ds-caption1")].at(-1);
    return [s.textContent, ...box(s)];
  });
  const layoutRow = rows.find((tr) => tr.firstElementChild?.textContent === "레이아웃 방향");
  const before = getComputedStyle(rows[1].children[1], "::before").content;
  return {
    docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    wrapper: { scrollWidth: wrap.scrollWidth, clientWidth: wrap.clientWidth, ok: wrap.scrollWidth <= wrap.clientWidth },
    tableDisplay: getComputedStyle(table).display,
    theadRect: box(table.tHead),
    layoutRowHeight: box(layoutRow)[1],
    firstValueBefore: before,
    cells,
    summaries,
  };
}

async function axTable() {
  const { nodes } = await page.cdp("Accessibility.getFullAXTree", {});
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const table = nodes.find((n) => n.role?.value === "table" && n.name?.value === "v1과 v3 비교");
  if (!table) return { table: null, roles: [...new Set(nodes.map((n) => n.role?.value))] };
  const lines = [];
  const walk = (n, depth) => {
    const role = n.role?.value;
    if (role !== "none" && role !== "generic" && role !== "InlineTextBox" && !n.ignored) {
      const props = (n.properties ?? []).filter((p) => ["focusable", "focused"].includes(p.name)).map((p) => `${p.name}=${p.value.value}`);
      lines.push(`${"  ".repeat(depth)}${role} "${n.name?.value ?? ""}"${props.length ? " " + props.join(" ") : ""}`);
      depth += 1;
    }
    for (const c of n.childIds ?? []) { const child = byId.get(c); if (child) walk(child, depth); }
  };
  walk(table, 0);
  return { table: true, lines };
}

const result = { phase: PHASE, note: "?v=1&diff=3, TaskSpace 26, CDP 폭 변경. cells=[글자,폭,높이,display] 앞 5행, summaries=버전 줄 요약 [글자,폭,높이]" };
const ax = {};
for (const width of [768, 390, 320]) {
  await setWidth(width);
  await page.waitForTimeout(300);
  result[width] = await page.evaluate(measure);
  const t = await axTable();
  ax[width] = t.lines ?? t;
  await page.evaluate(() => document.querySelector("table caption")?.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: `${OUT}/screens/${PHASE}-${width}.png` });
}
// P-AC-09: ?v=1에서 "v1과 비교 (v3)" → caption 포커스 · 닫기 → 같은 버튼 (폭별)
result.focus = {};
for (const width of [768, 390, 320]) {
  await setWidth(width);
  await page.evaluate(() => { history.pushState(null, "", location.pathname + "?v=1"); dispatchEvent(new PopStateEvent("popstate")); });
  await page.waitForFunction(() => !document.querySelector("table caption"), undefined, { timeout: 10000 });
  await page.click("loc=role:button[name='v1과 비교 (v3)']");
  await page.waitForFunction(() => document.activeElement?.tagName === "CAPTION", undefined, { timeout: 10000 }).catch(() => {});
  const opened = await page.evaluate(() => [document.activeElement?.tagName, document.activeElement?.textContent]);
  await page.click("loc=role:button[name='비교 닫기']");
  const closed = await page.evaluate(() => [document.activeElement?.tagName, document.activeElement?.getAttribute("aria-label")]);
  result.focus[width] = { opened, closed };
}
await setWidth(1280);
await writeFile(`${OUT}/logs/browser-${PHASE}.json`, JSON.stringify(result, null, 1));
await writeFile(`${OUT}/logs/ax-${PHASE}.txt`, Object.entries(ax).map(([w, l]) => `## ${w}\n${Array.isArray(l) ? l.join("\n") : JSON.stringify(l)}`).join("\n\n"));
console.log(JSON.stringify({ focus: result.focus, 768: result[768].wrapper, 390: result[390].layoutRowHeight, summaries390: result[390].summaries }));

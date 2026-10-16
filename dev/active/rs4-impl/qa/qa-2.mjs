// RS4 QA 2 — (qa-1 상태 이어서, 새로고침 0) 헤더 "프로젝트" 링크 → /projects 미확인 행(AC-07) · 3폭 가림(AC-14) · 재시도 실패(P-U3·포커스 유지) → 주입 해제 → 재시도 성공(P-U2·포커스=링크)
const task = await taskSpace(1);
const page = task.page("p1");
const SHOTS = "/Users/younghwankang/orca/workspaces/web-builder-solution/rs4-impl/dev/active/rs4-impl/qa/shots";
await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "프로젝트").click());
await page.waitForFunction(() => location.pathname === "/projects", undefined, { timeout: 10000 });
await page.waitForFunction(() => /저장 다시 시도/.test(document.body.innerText), undefined, { timeout: 10000 });
const row = () => page.evaluate(() => {
  const li = [...document.querySelectorAll("li")].find((l) => /저장 다시 시도|저장을 확인/.test(l.innerText));
  if (!li) return null;
  return {
    text: li.innerText,
    links: [...li.querySelectorAll("a")].map((a) => a.getAttribute("aria-label") || a.textContent.trim()),
    buttons: [...li.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") || b.textContent.trim()),
    roles: [...li.querySelectorAll('[role="status"],[role="alert"]')].map((n) => `${n.getAttribute("role")}: ${n.textContent.trim()}`),
    focus: document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim().slice(0, 60) || document.activeElement?.tagName,
  };
});
console.log("== 진입", JSON.stringify(await row(), null, 1));
// AC-14 — 3폭 가림: 행 버튼이 뷰포트 밖·겹침 없는지
for (const w of [1280, 1024, 390]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.waitForTimeout(300);
  const fit = await page.evaluate(() => {
    const li = [...document.querySelectorAll("li")].find((l) => /저장 다시 시도/.test(l.innerText));
    const r = [...li.querySelectorAll("button,a")].map((b) => b.getBoundingClientRect());
    const out = r.filter((x) => x.left < 0 || x.right > window.innerWidth).length;
    let overlap = 0;
    for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (r[i].left < r[j].right && r[j].left < r[i].right && r[i].top < r[j].bottom && r[j].top < r[i].bottom) overlap++;
    return { buttons: r.length, out, overlap, hscroll: document.documentElement.scrollWidth > window.innerWidth };
  });
  await page.evaluate(() => [...document.querySelectorAll("li")].find((l) => /저장 다시 시도/.test(l.innerText)).scrollIntoView({ block: "center" }));
  await page.screenshot({ path: `${SHOTS}/02-projects-pending-${w}.png` });
  console.log("== 폭", w, JSON.stringify(fit));
}
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
// 실패 재시도 — 주입 유지 상태
const retryName = await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /저장 다시 시도$/.test(b.getAttribute("aria-label") || "")).getAttribute("aria-label"));
await page.click(`loc=role:button[name='${retryName}']`, { label: "저장 다시 시도 (실패)" });
await page.waitForFunction(() => [...document.querySelectorAll("li [role=alert]")].length > 0, undefined, { timeout: 10000 });
console.log("== 실패 재시도", JSON.stringify(await row(), null, 1));
await page.screenshot({ path: `${SHOTS}/03-projects-retry-fail-1280.png` });
// 주입 해제 → 성공 재시도
await page.evaluate(() => (window.__failPut = false));
await page.click(`loc=role:button[name='${retryName}']`, { label: "저장 다시 시도 (성공)" });
await page.waitForFunction(() => [...document.querySelectorAll("li [role=status]")].some((n) => /확인했습니다/.test(n.textContent)), undefined, { timeout: 10000 });
await page.waitForTimeout(500);
const after = await page.evaluate(() => {
  const st = [...document.querySelectorAll("li [role=status]")].find((n) => /확인했습니다/.test(n.textContent));
  const li = st.closest("li");
  return { status: st.textContent.trim(), links: [...li.querySelectorAll("a")].map((a) => a.getAttribute("aria-label")), buttons: [...li.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") || b.textContent.trim()), focus: document.activeElement?.getAttribute("aria-label") };
});
console.log("== 성공 재시도", JSON.stringify(after, null, 1));
await page.screenshot({ path: `${SHOTS}/04-projects-retry-ok-1280.png` });
// IDB 실제 반영 확인 — docs 저장소 레코드 수
console.log("== IDB", JSON.stringify(await page.evaluate(async () => {
  const dbs = await indexedDB.databases();
  const out = {};
  for (const d of dbs) {
    const db = await new Promise((r) => { const q = indexedDB.open(d.name); q.onsuccess = () => r(q.result); });
    for (const s of db.objectStoreNames) out[`${d.name}/${s}`] = await new Promise((r) => { const q = db.transaction(s).objectStore(s).count(); q.onsuccess = () => r(q.result); });
    db.close();
  }
  return out;
})));

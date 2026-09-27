#!/usr/bin/env node
// QA-A2-EDITOR-FLOW — a2 편집기(틀·필드·저장) 흐름 E1~E10 한 번 실행. 선례 docs/qa/a2-data-flow/flow.mjs 복사·수정. 도구: agent-browser CLI(같은 도구, 새 의존성 없음).
// 사용: node flow.mjs <outDir>   — 긴 흐름(보드 → 프로필 → 3안 → 편집 시작)은 1280에서 한 번, 나머지 폭은 같은 탭에서 viewport만 바꿔 관찰(문서 유지 확인 겸).
// 단계마다 JSON 한 줄을 stdout·<outDir>/flow.jsonl에 쓰고 shots/<폭>/에 캡처. 이동은 앱 안 클릭(메모리 store 유지). 직접 URL 진입은 첫 진입뿐.
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "docs/qa/a2-editor-flow";
const BASE = "http://127.0.0.1:4341";
const SESSION = "qaA2E";
const WIDTHS = [1920, 1280, 1024, 768, 390];
let WIDTH = 1280;
WIDTHS.forEach((w) => mkdirSync(`${OUT}/shots/${w}`, { recursive: true }));

function ab(...args) {
  try {
    return execFileSync("agent-browser", ["--session", SESSION, ...args], { encoding: "utf8", timeout: 30000 }).trim();
  } catch (error) {
    return `ERR ${String(error.stderr || error.message).slice(0, 300)}`;
  }
}
function ev(js) {
  const raw = ab("--json", "eval", `(async () => { try { return JSON.stringify(await (async () => { ${js} })()); } catch (e) { return JSON.stringify({ __err: String(e) }); } })()`);
  try {
    const parsed = JSON.parse(raw);
    return parsed.data?.result === undefined ? { __raw: raw.slice(0, 300) } : JSON.parse(parsed.data.result);
  } catch {
    return { __raw: raw.slice(0, 300) };
  }
}
const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function waitFor(js, timeout = 8000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    last = ev(js);
    if (last && last !== false && !last.__raw && !last.__err) return last;
    pause(250);
  }
  return last ?? false;
}
function log(step, check, pass, evidence = {}) {
  const line = JSON.stringify({ width: WIDTH, step, check, pass, ...evidence });
  console.log(line);
  appendFileSync(`${OUT}/flow.jsonl`, `${line}\n`);
}
function shot(name) {
  ab("screenshot", `${OUT}/shots/${WIDTH}/${name}.png`);
  return `shots/${WIDTH}/${name}.png`;
}
function setWidth(w) {
  WIDTH = w;
  ab("set", "viewport", String(w), "900");
  pause(500);
  const want = w >= 1280 ? "!document.querySelector('[role=\"tablist\"]') && !document.querySelector('header select')" : w >= 1024 ? "!!document.querySelector('header select')" : "!!document.querySelector('[role=\"tablist\"]')";
  if (location_isStudio()) waitFor(`return (${want}) || false;`, 4000);
}
const location_isStudio = () => ev(`return location.pathname.startsWith("/studio/");`) === true;

// 페이지 안 도우미 — 보이는 요소만, 접근 이름(aria-label || 글자)으로 찾는다
const H = `
  const vis = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden" && !el.closest("[hidden]");
  const nameOf = (el) => (el.getAttribute("aria-label") || el.textContent || "").replace(/\\s+/g, " ").trim();
  const all = (sel) => [...document.querySelectorAll(sel)].filter(vis);
  const byName = (sel, re) => all(sel).filter((el) => re.test(nameOf(el)));
  const status = () => [...document.querySelectorAll('[role="status"],[role="alert"]')].map((el) => (el.textContent || "").replace(/\\s+/g, " ").trim()).filter(Boolean);
  const setVal = (el, v) => { const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v); el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true })); if (el.tagName === "SELECT") el.dispatchEvent(new Event("input", { bubbles: true })); };
  const saveText = () => { const h = document.querySelector("header"); const p = h && [...h.querySelectorAll("p")].find((x) => /저장|오프라인/.test(x.textContent)); return p ? p.textContent.trim() : null; };
  const selRow = () => { const b = all('nav[aria-labelledby="studio-sections-heading"] button[aria-current="true"]')[0] || document.querySelector('nav[aria-labelledby="studio-sections-heading"] button[aria-current="true"]'); return b ? b.querySelector("span")?.textContent.trim() : null; };
  const editH2 = () => document.getElementById("studio-edit-heading")?.textContent.replace(/\\s+/g, " ").trim() ?? null;
  const chip = () => { const c = document.querySelector('[data-instance-id] > span.bg-primary'); return c ? c.textContent.replace(/\\s+/g, " ").trim() : null; };
  const firstField = () => { const s = document.querySelector('section[aria-labelledby="studio-edit-heading"]'); return s ? s.querySelector("input[type=text],textarea") : null; };
  const overflow = () => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth });
`;
const clickName = (sel, reSrc, idx = 0) =>
  ev(`${H} const els = byName(${JSON.stringify(sel)}, new RegExp(${JSON.stringify(reSrc)})); const el = els[${idx}]; if (!el) return { clicked: false, count: els.length }; el.scrollIntoView({ block: "center" }); el.click(); return { clicked: true, name: nameOf(el), count: els.length };`);
const path = () => ev("return location.pathname + location.search;");
const selState = () => ev(`${H} return { row: selRow(), editH2: editH2(), chip: chip(), select: document.querySelector("header select") ? document.querySelector("header select").selectedOptions[0]?.textContent : null };`);
const synced = (s) => !!s?.row && s.editH2 === `편집 · ${s.row}` && (s.chip ?? "").startsWith(s.row);

// ---------- 준비 ----------
setWidth(1280);
ab("open", `${BASE}/catalog`);
ab("console", "--clear");
ab("errors", "--clear");
ev(`console.warn("qaA2E-sentinel"); return true;`);

// ---------- P 선행(선례 G1·G2): 카탈로그 → 비교 3개 → 보드 확정 → 프로필 → 3안 → 안 선택 ----------
{
  const ready = waitFor(`${H} const b = byName("button", /비교 추가$/); return b.length >= 3 ? b.length : false;`);
  [0, 1, 2].forEach(() => clickName("button", "비교 추가$", 0));
  pause(300);
  clickName("button", "^비교 보드 열기$");
  const onCompare = waitFor(`return location.pathname === "/compare" && document.querySelectorAll('button[aria-pressed]').length > 0 ? location.pathname : false;`, 12000);
  const rows = ev(`${H} const rows = {}; all('button[aria-pressed][aria-label$="의 요소 선택"]').forEach((b) => { const row = b.getAttribute("aria-label").split(":")[0]; (rows[row] ||= []).push(b.getAttribute("aria-label")); }); return rows;`);
  const clickPick = (row, col) =>
    ev(`${H} const bs = all('button[aria-pressed][aria-label$="의 요소 선택"]').filter((b) => b.getAttribute("aria-label").startsWith(${JSON.stringify(row)} + ":")); const b = bs[${col}]; if (!b) return { clicked: false }; b.scrollIntoView({ block: "center" }); b.click(); return { clicked: true };`);
  const names = Object.keys(rows);
  const hero = names.find((r) => /hero/i.test(r)) ?? names[0];
  clickPick(hero, 0);
  names.filter((r) => r !== hero).slice(0, 2).forEach((r) => clickPick(r, 1));
  pause(400);
  const confirm = ev(`${H} const bs = all("button").filter((b) => /확정/.test(nameOf(b)) && !/비우기/.test(nameOf(b)) && b.getAttribute("aria-disabled") !== "true"); const b = bs.find((x) => !x.closest('[aria-label="초안 요약"]')) || bs[0]; if (!b) return { clicked: false }; b.scrollIntoView({ block: "center" }); b.click(); return { clicked: true, name: nameOf(b) };`);
  const onProfile = waitFor(`return location.pathname.startsWith("/profile/") ? location.pathname : false;`, 12000);
  clickName("button", "^3안 만들기");
  const cards = waitFor(`${H} const b = byName("button", /안 선택$/); return b.length >= 3 ? b.map(nameOf) : false;`, 15000);
  clickName("button", "안 선택$", 1);
  const edit = waitFor(`${H} const b = byName("button", /편집 시작$/).filter((x) => x.getAttribute("aria-disabled") !== "true"); return b.length ? nameOf(b[0]) : false;`, 8000);
  log("P", "선행: 카탈로그 → 보드 → 확정 → 프로필 → 3안 → 안 선택", !!ready && onCompare === "/compare" && !!onProfile && Array.isArray(cards) && !!edit, { compare: onCompare, confirm, profile: onProfile, cards, edit });
}

// ---------- E9 준비: 편집 시작 전 진입 관찰기(LoadingState 단계·시각) ----------
ev(`window.__qaLoad = []; const t0 = performance.now(); window.__qaT0 = t0;
  const snap = () => { const busy = [...document.querySelectorAll('[role="status"]')].some((s) => /불러오는 중/.test(s.textContent)); const hdr = !!document.querySelector("header h1"); const layout = !!document.getElementById("studio-canvas-heading");
    const key = busy + "|" + hdr + "|" + layout + "|" + location.pathname; const last = window.__qaLoad[window.__qaLoad.length - 1]; if (!last || last.key !== key) window.__qaLoad.push({ key, t: Math.round(performance.now() - window.__qaT0), path: location.pathname, loading: busy, header: hdr, layout }); };
  window.__qaMo?.disconnect(); window.__qaMo = new MutationObserver(snap); window.__qaMo.observe(document.body, { childList: true, subtree: true, characterData: true }); snap(); return true;`);

// ---------- E1 편집 시작 → /studio/:id (1280) ----------
let projName = null;
{
  projName = ev(`${H} const a = all("a").find((x) => /^프로젝트:/.test(nameOf(x))); return a ? nameOf(a).replace(/^프로젝트:\\s*/, "") : null;`);
  ev(`window.__qaT0 = performance.now(); window.__qaLoad = []; return true;`);
  clickName("button", "편집 시작$");
  const st = waitFor(`${H} return location.pathname.startsWith("/studio/") && document.getElementById("studio-canvas-heading") ? location.pathname : false;`, 12000);
  pause(500);
  const e1 = ev(`${H} const navs = [...document.querySelectorAll("nav")]; return { path: location.pathname,
    mainNav: navs.filter((n) => n.getAttribute("aria-labelledby") !== "studio-sections-heading").map((n) => n.getAttribute("aria-label") || nameOf(n).slice(0, 30)),
    banners: document.querySelectorAll("header").length, h1: [...document.querySelectorAll("h1")].map(nameOf), title: document.title,
    active: document.activeElement?.tagName, activeName: nameOf(document.activeElement).slice(0, 40),
    statusRegions: [...document.querySelectorAll('[role="status"]')].map((s) => ({ label: s.getAttribute("aria-label"), text: s.textContent.trim().slice(0, 200), display: getComputedStyle(s).display })),
    back: (() => { const a = document.querySelector('header a[aria-label="프로젝트로 돌아가기"]'); return a ? a.getAttribute("href") : null; })(),
    h2: [...document.querySelectorAll("h2")].filter(vis).map(nameOf), h3: [...document.querySelectorAll("h3")].filter(vis).map(nameOf) };`);
  log("E1", "편집 시작 → /studio/:projectId", /^\/studio\//.test(st || ""), { path: e1.path });
  log("E1", "집중 모드: 주 메뉴 nav 없음 · header 1 · h1 1", e1.mainNav?.length === 0 && e1.banners === 1 && e1.h1?.length === 1, { mainNav: e1.mainNav, banners: e1.banners, h1: e1.h1 });
  log("E1", "h1 = 프로젝트 이름 · document.title = '<이름> 편집'", e1.h1?.[0] === projName && e1.title === `${projName} 편집`, { h1: e1.h1, title: e1.title, expected: projName });
  log("E1", "'프로젝트로 돌아가기' → /projects", e1.back === "/projects", { back: e1.back });
  log("E1", "진입 포커스 = h1", e1.active === "H1", { active: e1.active, activeName: e1.activeName });
  const edit = (e1.statusRegions ?? []).filter((s) => s.label === "편집 알림");
  log("E1", "role=status '편집 알림' 1개(display≠none) · 편집 알림 문장 들어감", (e1.statusRegions ?? []).length === 1 && edit.length === 1 && edit[0].display !== "none" && edit[0].text.length > 0, { statusRegions: e1.statusRegions });
  log("E1", "E-AC-04 제목: h2 섹션·테마·구조 미리보기·편집 · <섹션>·품질 게이트 + h3 내보내기", ["섹션", "테마", "구조 미리보기", "품질 게이트"].every((h) => e1.h2?.includes(h)) && e1.h2?.some((h) => /^편집 · /.test(h)) && e1.h3?.includes("내보내기"), { h2: e1.h2, h3: e1.h3 });
  shot("e1-studio-entry");
}

// ---------- E9 진입 체감(기록만) ----------
{
  const trace = ev(`window.__qaMo?.disconnect(); return window.__qaLoad;`);
  const loadingPhases = Array.isArray(trace) ? trace.filter((t) => t.loading).length : null;
  log("E9", "(관찰) 진입 LoadingState 단계·시각(ms, 편집 시작 클릭 기준)", null, { trace, loadingPhases, note: "로컬 dev 서버 — 청크 캐시·네트워크 없음이라 실제 배포보다 짧다" });
}

// ---------- 배치 관찰 도우미(E2) ----------
// Tab 순서 샘플: body 맨 앞 임시 표식에서 Tab N번 — 요소가 속한 영역 이름을 기록
const regionJs = `const region = (el) => { if (!el || el === document.body) return "body"; if (el.closest("header")) return "툴바"; if (el.closest('[role="tablist"]')) return "탭 목록"; if (el.getAttribute?.("role") === "tabpanel" || el.closest('[role="tabpanel"]')) return "탭 패널";
  if (el.closest('nav[aria-labelledby="studio-sections-heading"]')) return "섹션 목록"; if (el.closest("details")) return "섹션 목록(details)"; if (el.closest('section[aria-labelledby="studio-theme-heading"]')) return "테마";
  if (el.closest('section[aria-labelledby="studio-canvas-heading"]')) return "캔버스"; if (el.closest('section[aria-labelledby="studio-edit-heading"]')) return "편집"; return "기타:" + (el.closest("section")?.getAttribute("aria-labelledby") || el.tagName); };`;
function tabSample(n) {
  ev(`const t = document.createElement("span"); t.tabIndex = -1; t.id = "qaA2E-start"; document.body.prepend(t); t.focus(); return true;`);
  const seq = [];
  for (let i = 0; i < n; i += 1) {
    ab("press", "Tab");
    const a = ev(`${H} ${regionJs} const a = document.activeElement; return { r: region(a), n: a ? nameOf(a).slice(0, 30) : null, tag: a?.tagName, top: Math.round(a?.getBoundingClientRect().top ?? -1), left: Math.round(a?.getBoundingClientRect().left ?? -1) };`);
    if (a.r === "body") { seq.push({ ...a, r: "문서 끝(브라우저 UI로 나감)" }); break; }
    seq.push(a);
  }
  ev(`document.getElementById("qaA2E-start")?.remove(); return true;`);
  return seq;
}
const EXPECTED_ORDER = {
  wide: ["툴바", "섹션 목록", "테마", "캔버스", "편집"],
  split: ["툴바", "캔버스", "섹션 목록(details)", "편집", "테마"],
  tabs: ["툴바", "탭 목록", "탭 패널", "캔버스"],
};
function orderOk(seq, mode) {
  const exp = EXPECTED_ORDER[mode];
  const regions = seq.map((s) => s.r).filter((r) => exp.includes(r));
  const idx = regions.map((r) => exp.indexOf(r));
  const monotone = idx.every((v, i) => i === 0 || v >= idx[i - 1]);
  return { monotone, regions: [...new Set(regions)], others: [...new Set(seq.map((s) => s.r).filter((r) => !exp.includes(r)))].filter((r) => r !== "기타:A" && !/문서 끝/.test(r)) };
}
const layoutJs = `${H} const tablist = document.querySelector('[role="tablist"]'); const sel = document.querySelector("header select"); const det = document.querySelector("details");
  const mode = tablist ? "tabs" : sel ? "split" : "wide";
  const cols = [...document.querySelectorAll('nav[aria-labelledby="studio-sections-heading"], section[aria-labelledby="studio-canvas-heading"], section[aria-labelledby="studio-edit-heading"]')].map((el) => ({ id: el.getAttribute("aria-labelledby"), visible: vis(el), left: Math.round(el.getBoundingClientRect().left), top: Math.round(el.getBoundingClientRect().top), width: Math.round(el.getBoundingClientRect().width) }));
  return { mode, ...overflow(), tabs: tablist ? [...tablist.querySelectorAll('[role="tab"]')].map((t) => ({ name: nameOf(t), selected: t.getAttribute("aria-selected") })) : null,
    select: sel ? { options: sel.options.length, value: sel.selectedOptions[0]?.textContent } : null, details: det ? { open: det.open, summary: det.querySelector("summary")?.textContent } : null, cols,
    saveInHeader: saveText(), h1: document.querySelector("h1")?.textContent, statusCount: document.querySelectorAll('[role="status"]').length };`;
const EXPECTED_MODE = { 1920: "wide", 1280: "wide", 1024: "split", 768: "tabs", 390: "tabs" };

// ---------- E2 · E3(폭마다 선택 유지) · E5 · E10(포커스) — 5폭 순회 ----------
let selectedAtStart = null;
{
  // 1280에서 두 번째 본문 섹션을 골라 둔 뒤 폭을 바꿔 선택이 남는지 본다
  WIDTH = 1280;
  const pick = ev(`${H} const bs = all('nav[aria-labelledby="studio-sections-heading"] ol button'); const b = bs[2] || bs[1]; b.focus(); b.click(); return { name: b.querySelector("span").textContent.trim(), rows: bs.map((x) => x.querySelector("span").textContent.trim()) };`);
  pause(300);
  selectedAtStart = pick.name;
  const s = selState();
  const act = ev(`${H} const a = document.activeElement; return { tag: a.tagName, name: nameOf(a).slice(0, 30), current: a.getAttribute("aria-current") };`);
  log("E3", "목록 클릭 → aria-current · 편집 h2 · 캔버스 칩 동기, 포커스는 누른 줄 그대로", synced(s) && s.row === pick.name && act.current === "true", { pick, ...s, active: act });
  // 캔버스 클릭(포인터) — 다른 섹션 블록
  const cv = ev(`${H} const blocks = [...document.querySelectorAll("[data-instance-id]")]; const b = blocks[1]; b.scrollIntoView({ block: "center" }); b.querySelector("p,span")?.click() ?? b.click(); return { id: b.getAttribute("data-instance-id"), blocks: blocks.length, tabStops: blocks.filter((x) => x.tabIndex >= 0 || x.querySelector("[tabindex],button,a,input")).length };`);
  pause(300);
  const s2 = selState();
  log("E3", "캔버스 클릭 → 같은 선택 동기 · 캔버스 섹션은 Tab 정지 아님", synced(s2) && s2.row !== s.row && cv.tabStops === 0, { canvas: cv, ...s2 });
  shot("e3-canvas-click");
  // 다시 목록으로 원래 선택 복원
  ev(`${H} const bs = all('nav[aria-labelledby="studio-sections-heading"] ol button'); const b = bs.find((x) => x.querySelector("span").textContent.trim() === ${JSON.stringify(selectedAtStart)}); b?.click(); return true;`);
  pause(200);
}

for (const w of WIDTHS) {
  setWidth(w);
  const L = ev(layoutJs);
  const exp = EXPECTED_MODE[w];
  log("E2", `배치 = ${exp === "wide" ? "3단" : exp === "split" ? "2단(select + 접힌 details)" : "탭 3개(섹션·편집·검사)"}`, L.mode === exp && (exp !== "split" || (L.details && L.details.open === false)) && (exp !== "tabs" || (L.tabs?.map((t) => t.name).join(",") === "섹션,편집,검사")), { mode: L.mode, tabs: L.tabs, select: L.select, details: L.details, cols: L.cols });
  log("E2", "가로 넘침 0 (scrollWidth ≤ clientWidth)", L.scrollWidth <= L.clientWidth, { scrollWidth: L.scrollWidth, clientWidth: L.clientWidth });
  log("E2", "편집 알림 role=status 1개 · h1 유지(문서 유지)", L.statusCount === 1 && L.h1 === projName, { statusCount: L.statusCount, h1: L.h1, save: L.saveInHeader });
  const s = selState();
  log("E3", "폭을 바꿔도 선택 유지(편집 h2 · 캔버스 칩)", s.editH2 === `편집 · ${selectedAtStart}` && (s.chip ?? "").startsWith(selectedAtStart) && (exp !== "split" || s.select === selectedAtStart), { expected: selectedAtStart, ...s });
  shot(`e2-layout-${w}`);
  const seq = tabSample(exp === "tabs" ? 10 : 16);
  const o = orderOk(seq, exp);
  log("E2", "Tab 순서 샘플 = SPEC 4.3 순서(영역 단조 증가)", o.monotone, { expectedOrder: EXPECTED_ORDER[exp], regionsSeen: o.regions, otherRegions: o.others, seq: seq.map((x) => `${x.r}:${x.n}`) });
  log("E10", "Tab 이동 중 포커스가 사라지지 않음(마지막 조작 요소 뒤 문서 끝은 정상)", seq.slice(0, -1).every((x) => !/문서 끝/.test(x.r)), { endReached: seq.some((x) => /문서 끝/.test(x.r)), tabs: seq.length });

  // ---------- E5 미리보기 폭 3종 전환 ----------
  const views = ["태블릿", "모바일", "데스크톱"];
  const res = views.map((label) => {
    const r = ev(`${H} const inp = [...document.querySelectorAll('input[name="studio-preview-width"]')].find((i) => i.closest("label").textContent.trim() === ${JSON.stringify(label)});
      if (!inp) return { label: ${JSON.stringify(label)}, found: false };
      const frame = () => document.querySelector("[data-instance-id]")?.parentElement; const before = frame()?.style.width + "|" + frame()?.style.zoom;
      const t0 = performance.now(); inp.closest("label").click();
      let dt = null; for (let i = 0; i < 120; i += 1) { await new Promise((r) => requestAnimationFrame(r)); const now = frame()?.style.width + "|" + frame()?.style.zoom; if (now !== before || inp.checked) { dt = Math.round(performance.now() - t0); if (now !== before) break; } }
      await new Promise((r) => setTimeout(r, 150));
      const f = frame(); const cap = [...document.querySelectorAll('section[aria-labelledby="studio-canvas-heading"] p')].map((p) => p.textContent.trim()).find((t) => /^축소 보기/.test(t)) || null;
      return { label: ${JSON.stringify(label)}, found: true, checked: inp.checked, ms: dt, frameWidth: f?.style.width || "(열 폭)", zoom: f?.style.zoom || null, frameRectW: Math.round(f?.getBoundingClientRect().width ?? 0), caption: cap, ...overflow(), editH2: editH2(), chip: chip(), sections: document.querySelectorAll("[data-instance-id]").length };`);
    if (r.found) shot(`e5-preview-${label}`);
    return r;
  });
  const okAll = res.every((r) => r.found && r.checked && r.ms !== null && r.ms < 1000 && r.scrollWidth <= r.clientWidth && r.editH2 === `편집 · ${selectedAtStart}` && (r.chip ?? "").startsWith(selectedAtStart));
  const zoomOk = res.every((r) => !r.found || (r.zoom ? /^축소 보기 · \d+%$/.test(r.caption ?? "") : r.caption === null));
  log("E5", "폭 3종 전환 1초 안 · 문서·선택 유지 · 가로 넘침 0", okAll, { results: res.map(({ label, ms, frameWidth, zoom, caption, scrollWidth, clientWidth, editH2: h, sections }) => ({ label, ms, frameWidth, zoom, caption, scrollWidth, clientWidth, editH2: h, sections })) });
  log("E5", "프레임 > 캔버스 ⇔ 축소 캡션 '축소 보기 · N%' 보임", zoomOk, { pairs: res.map((r) => ({ label: r.label, zoom: r.zoom, caption: r.caption, frameRectW: r.frameRectW })) });
}

// ---------- E3 1024 select · E10 키보드 select ----------
{
  setWidth(1024);
  const r = ev(`${H} const sel = document.querySelector("header select"); const opts = [...sel.options].map((o) => o.textContent); const target = opts.findIndex((t, i) => i > 1 && t !== ${JSON.stringify(selectedAtStart)}); setVal(sel, sel.options[target].value); return { opts, target: opts[target] };`);
  pause(300);
  const s = selState();
  const det = ev(`const d = document.querySelector("details"); d.open = true; return true;`);
  pause(200);
  const s2 = ev(`${H} return { detailsCurrent: [...document.querySelectorAll('details nav button[aria-current="true"]')].map((b) => b.querySelector("span").textContent.trim()) };`);
  log("E3", "1024 select 변경 → details 목록 aria-current · 편집 h2 · 캔버스 칩 동기", s.editH2 === `편집 · ${r.target}` && (s.chip ?? "").startsWith(r.target) && s2.detailsCurrent[0] === r.target, { ...r, ...s, ...s2, det });
  shot("e3-select-1024");
  ev(`const d = document.querySelector("details"); d.open = false; return true;`);
}

// ---------- E4 탭(768 · 390) ----------
for (const w of [768, 390]) {
  setWidth(w);
  const tabsNow = () => ev(`${H} return { selected: [...document.querySelectorAll('[role="tab"]')].filter((t) => t.getAttribute("aria-selected") === "true").map(nameOf), active: nameOf(document.activeElement), activeRole: document.activeElement.getAttribute("role"), visiblePanel: [...document.querySelectorAll('[role="tabpanel"]')].filter((p) => !p.hidden).map((p) => p.getAttribute("aria-labelledby")) };`);
  const attrs = ev(`const tl = document.querySelector('[role="tablist"]'); return { label: tl.getAttribute("aria-label"), tabs: [...tl.querySelectorAll('[role="tab"]')].map((t) => ({ sel: t.getAttribute("aria-selected"), ctrl: t.getAttribute("aria-controls"), ti: t.tabIndex })), panels: [...document.querySelectorAll('[role="tabpanel"]')].map((p) => ({ lb: p.getAttribute("aria-labelledby"), ti: p.tabIndex })) };`);
  log("E4", "tablist '편집 도구' · tab aria-selected/aria-controls · tabpanel aria-labelledby/tabindex=0", attrs.label === "편집 도구" && attrs.tabs.length === 3 && attrs.tabs.every((t) => t.ctrl) && attrs.panels.every((p) => p.lb && p.ti === 0), attrs);
  ev(`const t = document.querySelector('[role="tab"][aria-selected="true"]'); t.focus(); return true;`);
  const startState = tabsNow();
  const seq = [];
  for (const key of ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowLeft", "End", "Home"]) {
    ab("press", key);
    pause(150);
    seq.push({ key, ...tabsNow() });
  }
  const autoOk = seq.every((s) => s.selected.length === 1 && s.selected[0] === s.active && s.activeRole === "tab" && s.visiblePanel.length === 1);
  const expected = ["편집", "검사", "섹션", "검사", "검사", "섹션"]; // 섹션에서 시작 가정 — 시작 탭을 실제로 기록
  log("E4", "←/→ · Home/End = 포커스 이동 + 자동 활성(패널 1개 보임) · 양 끝 순환", autoOk, { seq: seq.map((s) => `${s.key}→${s.selected[0]}(focus:${s.active})`), expectedIfStartSections: expected, startSelected: startState.selected, startFocus: startState.active });
  // 편집 탭에서 입력 → 섹션 탭 → 편집 탭: 값·선택 유지
  clickName('[role="tab"]', "^편집$");
  pause(200);
  const marker = `QA-E4-${w}`;
  const typed = ev(`${H} const f = firstField(); if (!f) return { ok: false }; f.focus(); setVal(f, ${JSON.stringify(marker)}); return { ok: true, label: document.querySelector('label[for="' + f.id + '"]')?.textContent, value: f.value };`);
  clickName('[role="tab"]', "^섹션$");
  pause(200);
  const mid = selState();
  clickName('[role="tab"]', "^편집$");
  pause(200);
  const back = ev(`${H} const f = firstField(); return { value: f?.value, editH2: editH2() };`);
  log("E4", "탭을 바꿔도 선택 섹션 · 입력 값 유지", back.value === marker && back.editH2 === mid.editH2 && mid.row === mid.editH2?.replace(/^편집 · /, ""), { typed, midSections: mid, back });
  shot(`e4-tabs-${w}`);
  clickName('[role="tab"]', "^섹션$");
}

// ---------- E6 필드 · E7 자동 저장 (1280) ----------
let heroField = null;
{
  setWidth(1280);
  ev(`${H} const bs = all('nav[aria-labelledby="studio-sections-heading"] ol button'); const b = bs.find((x) => /Hero/i.test(x.textContent)) || bs[1]; b.click(); return true;`);
  pause(300);
  const info = ev(`${H} const f = firstField(); const counter = document.getElementById(f.id + "-count")?.textContent; return { id: f.id, label: document.querySelector('label[for="' + f.id + '"]')?.textContent, value: f.value, counter, describedby: f.getAttribute("aria-describedby"), editH2: editH2() };`);
  heroField = info;
  const rec = Number((info.counter?.match(/\/\s*(\d+)자/) || [])[1]);
  log("E6", "필드 카운터 'N / R자'가 aria-describedby로 연결", Number.isFinite(rec) && (info.describedby ?? "").includes(`${info.id}-count`), info);
  const fill = (n) => ev(`${H} const f = document.getElementById(${JSON.stringify(info.id)}); f.focus(); setVal(f, "가".repeat(${n})); await new Promise((r) => setTimeout(r, 200));
    const ids = (f.getAttribute("aria-describedby") || "").split(" ").filter(Boolean); const texts = ids.map((id) => ({ id, text: document.getElementById(id)?.textContent?.trim() ?? null, inCanvas: !!document.getElementById(id)?.closest('section[aria-labelledby="studio-canvas-heading"]') }));
    return { len: [...f.value].length, counter: document.getElementById(f.id + "-count")?.textContent, invalid: f.getAttribute("aria-invalid"), described: texts, badge: [...document.querySelectorAll("[data-instance-id] span")].map((s) => s.textContent.trim()).filter((t) => /^(경고|차단) 1$/.test(t)) };`);
  const warn = fill(rec + 1);
  const canvasSentence = warn.described?.find((d) => d.inCanvas);
  log("E6", "권장 초과 → 경고 문장 + 캔버스 문장·배지 · describedby 맨 앞 = 캔버스 문장 id", !!canvasSentence && warn.described[0]?.inCanvas === true && warn.invalid !== "true" && warn.badge.includes("경고 1"), warn);
  shot("e6-warn");
  // 상한 찾기: 크게 넣으면 입력 한도(상한 + 10)로 잘린다 → 상한 = 길이 − 10
  const big = fill(500);
  const max = big.len - 10;
  const over = fill(max + 1);
  const noteText = over.described?.map((d) => d.text).join(" | ");
  log("E6", "상한 초과 → aria-invalid + '…내보내기를 막습니다 (R-13)' + 캔버스 '차단 1'", over.invalid === "true" && /내보내기를 막습니다 \(R-13\)/.test(noteText ?? "") && over.badge.includes("차단 1"), { ...over, inferredMax: max });
  log("E6", "입력은 막지 않음: 상한 + 10자까지 입력 가능, 그 뒤는 잘림", big.len === max + 10 && max > rec, { typed: 500, kept: big.len, inferredMax: max, recommended: rec });
  shot("e6-block");

  // E7: 정상 값으로 되돌리고 입력 멈춤 → 상태 글자·알림 영역 변화를 시간순 기록
  // 페이지 안 긴 대기는 타이머 스로틀로 30초를 넘길 수 있어(1차 실행 실측) 관찰기만 페이지에 두고 기다림은 Node에서 한다
  ev(`${H} const f = document.getElementById(${JSON.stringify(info.id)}); const region = document.querySelector('[role="status"][aria-label="편집 알림"]'); const alertEl = document.querySelector('header [role="alert"]');
    const q = window.__qaE7 = { rel: [], regionBefore: region.textContent, regionChanges: [], alertChanges: [], t0: performance.now() }; let last = saveText(); q.rel.push({ t: 0, text: last, note: "입력 전" });
    const hdr = document.querySelector("header"); q.mo = new MutationObserver(() => { const s = saveText(); if (s !== last) { q.rel.push({ t: Math.round(performance.now() - q.t0), text: s }); last = s; } }); q.mo.observe(hdr, { childList: true, subtree: true, characterData: true, characterDataOldValue: true });
    q.olds = []; q.moOld = new MutationObserver((recs) => recs.forEach((r) => { if (r.type === "characterData" && /저장|오프라인/.test((r.oldValue || "") + r.target.data)) q.olds.push({ t: Math.round(performance.now() - q.t0), from: r.oldValue, to: r.target.data }); if (r.type === "childList") r.removedNodes.forEach((n) => { if (/저장/.test(n.textContent || "")) q.olds.push({ t: Math.round(performance.now() - q.t0), removed: n.textContent }); }); r.type === "childList" && r.addedNodes.forEach((n) => { if (/저장/.test(n.textContent || "")) q.olds.push({ t: Math.round(performance.now() - q.t0), added: n.textContent }); }); }));
    q.moOld.observe(hdr, { childList: true, subtree: true, characterData: true, characterDataOldValue: true });
    q.mo1 = new MutationObserver(() => q.regionChanges.push({ t: Math.round(performance.now() - q.t0), text: region.textContent })); q.mo1.observe(region, { childList: true, subtree: true, characterData: true });
    q.mo2 = new MutationObserver(() => q.alertChanges.push(alertEl.textContent)); if (alertEl) q.mo2.observe(alertEl, { childList: true, subtree: true, characterData: true });
    q.t0 = performance.now(); setVal(f, "QA 편집 제목"); q.vis = document.visibilityState; setTimeout(() => { q.calib = Math.round(performance.now() - q.t0); }, 2000); return true;`);
  pause(4500);
  const e7 = ev(`${H} const q = window.__qaE7; q.mo.disconnect(); q.moOld.disconnect(); q.mo1.disconnect(); q.mo2.disconnect();
    const saveP = [...document.querySelectorAll("header p")].find((x) => /저장/.test(x.textContent)); return { transitions: q.rel, mutations: q.olds, calibTimer2000: q.calib, visibility: q.vis, regionBefore: q.regionBefore, regionChanges: q.regionChanges, alertChanges: q.alertChanges, statusInLiveRegion: !!saveP?.closest('[role="status"],[role="alert"],[aria-live]') };`);
  const texts = (e7.transitions ?? []).map((t) => t.text);
  const savingSeen = (e7.mutations ?? []).find((m) => /저장 중/.test(`${m.from ?? ""}${m.to ?? ""}${m.added ?? ""}${m.removed ?? ""}`));
  const iSaving = savingSeen ? 0 : texts.findIndex((t) => /^저장 중/.test(t ?? ""));
  const iSaved = texts.findIndex((t) => /^이 탭에 저장됨/.test(t ?? ""));
  const tSaving = savingSeen ? savingSeen.t : e7.transitions?.[iSaving]?.t;
  log("E7", "입력 멈춤 → 약 2초 뒤 '저장 중…' → '이 탭에 저장됨 · N초 전'", iSaving >= 0 && iSaved >= 0 && tSaving >= 1800 && tSaving <= 2600, { transitions: e7.transitions, mutations: e7.mutations, calibTimer2000: e7.calibTimer2000, visibility: e7.visibility, raw: e7.__raw ?? e7.__err });
  log("E7", "평상시 저장으로 편집 알림 영역 글자 변화 0 · alert 0 · 상태 글자는 라이브 영역 밖", (e7.regionChanges ?? []).length === 0 && (e7.alertChanges ?? []).length === 0 && e7.statusInLiveRegion === false, { regionChanges: e7.regionChanges, alertChanges: e7.alertChanges, statusInLiveRegion: e7.statusInLiveRegion });
  const a0 = ev(`${H} return saveText();`); pause(2100); const tick = [a0, ev(`${H} return saveText();`)];
  log("E7", "(관찰) 상대 시각 갱신", null, { samples: tick });
  shot("e7-saved");
}

// ---------- E10 키보드만으로 E3 · E6 (1280) ----------
{
  // 섹션 목록 첫 줄(페이지 정보) 포커스에서 Tab으로 다음 섹션 줄 → Enter
  ev(`${H} all('nav[aria-labelledby="studio-sections-heading"] button')[0].focus(); return true;`);
  ab("press", "Tab");
  ab("press", "Tab");
  const target = ev(`${H} return document.activeElement.querySelector("span")?.textContent.trim() ?? nameOf(document.activeElement);`);
  ab("press", "Enter");
  pause(300);
  const s = selState();
  const act = ev(`${H} return { tag: document.activeElement.tagName, current: document.activeElement.getAttribute("aria-current") };`);
  log("E10", "키보드: Tab → 섹션 줄 · Enter → 선택 동기(포커스 그대로)", synced(s) && s.row === target && act.current === "true", { target, ...s, active: act });
  // 편집 패널 입력칸까지 Tab → 실제 키 입력
  let reached = null;
  for (let i = 0; i < 30; i += 1) {
    ab("press", "Tab");
    const a = ev(`${H} const a = document.activeElement; return a && a.closest('section[aria-labelledby="studio-edit-heading"]') && /INPUT|TEXTAREA/.test(a.tagName) ? { id: a.id } : null;`);
    if (a && a.id) { reached = { ...a, tabs: i + 1 }; break; }
  }
  const before = reached ? ev(`const f = document.getElementById(${JSON.stringify(reached?.id ?? "")}); return { value: f.value, counter: document.getElementById(f.id + "-count")?.textContent };`) : null;
  ab("press", "End");
  ab("keyboard", "type", " 키보드");
  pause(300);
  const after = reached ? ev(`${H} const f = document.getElementById(${JSON.stringify(reached?.id ?? "")}); return { value: f.value, counter: document.getElementById(f.id + "-count")?.textContent, active: document.activeElement.id, canvasHas: [...document.querySelectorAll("[data-instance-id] p")].some((p) => p.textContent.includes("키보드")) };`) : null;
  log("E10", "키보드: Tab으로 편집 필드 도달 · 실제 키 입력 → 값·카운터·캔버스 반영", !!reached && after?.value?.endsWith(" 키보드") && after.counter !== before?.counter && after.canvasHas, { reached, before, after });
  pause(2600);
  shot("e10-keyboard-edit");
}

// ---------- E8 입력 직후(2초 전) '프로젝트로 돌아가기' → 다시 열어 값 확인 ----------
{
  const marker = `QA-E8-${Date.now() % 100000}`;
  const r = ev(`${H} const bs = all('nav[aria-labelledby="studio-sections-heading"] ol button'); const b = bs.find((x) => /Hero/i.test(x.textContent)) || bs[1]; b.click(); await new Promise((r) => setTimeout(r, 200));
    const f = firstField(); f.focus(); setVal(f, ${JSON.stringify(marker)}); await new Promise((r) => setTimeout(r, 300)); const st = saveText();
    document.querySelector('header a[aria-label="프로젝트로 돌아가기"]').click(); return { typed: f.value, statusBeforeLeave: st, field: f.id };`);
  const onProjects = waitFor(`return location.pathname === "/projects" ? location.pathname : false;`, 5000);
  log("E8", "입력 300ms 뒤 '프로젝트로 돌아가기' → 막지 않고 /projects 이동", onProjects === "/projects", { ...r, path: onProjects || path() });
  shot("e8-projects");
  const open = clickName("a", "편집기 열기$");
  const st = waitFor(`${H} return location.pathname.startsWith("/studio/") && firstField() ? true : false;`, 10000);
  ev(`${H} const bs = all('nav[aria-labelledby="studio-sections-heading"] ol button'); const b = bs.find((x) => /Hero/i.test(x.textContent)) || bs[1]; b.click(); return true;`);
  pause(300);
  const v = ev(`${H} const f = firstField(); return { value: f?.value, editH2: editH2(), path: location.pathname, save: saveText() };`);
  log("E8", "다시 편집기 열기 → 입력 값이 저장돼 있음(Codex r1 수정)", v.value === r.typed, { open, reopened: !!st, ...v, expected: r.typed });
  shot("e8-reopened");
}

// ---------- 충돌(STALE_DOC) ----------
log("E7", "(관찰) 충돌 STALE_DOC — 브라우저 재현 불가(같은 탭 메모리 store에서 다른 쪽 저장을 만들 UI 없음). 단위 테스트 근거: ConflictCallout.test.tsx · StudioLayout.test.tsx(R1-3 E-AC-10)", null, {});

// ---------- E10 (관찰) 1024 select 키보드 — 네이티브 팝업이 열린 채 남을 수 있어 흐름 맨 끝에서 ----------
{
  setWidth(1024);
  const r = { target: ev(`return document.querySelector("header select")?.selectedOptions[0]?.textContent ?? null;`) };
  // 키보드: select에 포커스 후 ArrowDown(플랫폼 기본 동작 — 닫힌 select 값 변경 여부를 그대로 기록)
  ev(`document.querySelector("header select").focus(); return true;`);
  ab("press", "ArrowDown");
  pause(300);
  const k = ev(`${H} return { value: document.querySelector("header select").selectedOptions[0].textContent, editH2: editH2(), active: document.activeElement.tagName };`);
  ab("press", "Escape");
  log("E10", "(관찰) 1024 select 키보드 ArrowDown → 선택 변경", k.editH2 === `편집 · ${k.value}` ? (k.value !== r.target ? true : null) : false, { before: r.target, ...k, note: "닫힌 select의 ArrowDown은 OS·브라우저 기본 동작" });
  setWidth(768);
  const after = ev(`return { tablist: !!document.querySelector('[role="tablist"]'), select: !!document.querySelector("header select") };`);
  log("E10", "(관찰) select 팝업(ArrowDown) 뒤 768로 폭 변경 → 탭 배치로 바뀌는지", null, { ...after, note: "2차 실행에서 이 순서일 때 768 탭 배치가 나타나지 않았다 — 하네스 부작용인지 기록" });
}

// ---------- E10 콘솔·페이지 오류 ----------
{
  const consoleOut = ab("--json", "console");
  const errorsOut = ab("--json", "errors");
  let msgs = [];
  let errs = [];
  try { msgs = JSON.parse(consoleOut).data?.messages ?? JSON.parse(consoleOut).data ?? []; } catch { msgs = []; }
  try { errs = JSON.parse(errorsOut).data?.errors ?? JSON.parse(errorsOut).data ?? []; } catch { errs = []; }
  const consoleErrors = Array.isArray(msgs) ? msgs.filter((m) => /error/i.test(m.type ?? m.level ?? "")) : [];
  log("E10", "콘솔 error 0", consoleErrors.length === 0, { consoleErrors: consoleErrors.slice(0, 5), total: Array.isArray(msgs) ? msgs.length : null, sentinelCaptured: consoleOut.includes("qaA2E-sentinel") });
  log("E10", "페이지 오류 0", Array.isArray(errs) && errs.length === 0, { errors: Array.isArray(errs) ? errs.slice(0, 5) : errorsOut.slice(0, 300) });
}

ab("close");

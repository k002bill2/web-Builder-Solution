#!/usr/bin/env node
// QA-A1-BETA-FLOW — a1-β 사용자 흐름(F1~F7) 한 번 실행. 도구: agent-browser CLI(로컬 Playwright 미설치 → 브리프 2순위).
// 사용: node flow.mjs <width> <outDir>   — 단계마다 JSON 한 줄을 stdout·<outDir>/flow.jsonl에 쓰고 shots/<width>/에 캡처.
// 이동은 모두 앱 안 클릭·history.back(메모리 store 유지). 새로고침·직접 URL 이동 없음(첫 진입 제외).
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";

const WIDTH = Number(process.argv[2] ?? 1280);
const OUT = process.argv[3] ?? "docs/qa/a1-beta-flow";
const BASE = "http://127.0.0.1:4341";
const SESSION = `qa41-${WIDTH}`;
const SHOTS = `${OUT}/shots/${WIDTH}`;
mkdirSync(SHOTS, { recursive: true });

function ab(...args) {
  try {
    return execFileSync("agent-browser", ["--session", SESSION, ...args], { encoding: "utf8", timeout: 30000 }).trim();
  } catch (error) {
    return `ERR ${String(error.stderr || error.message).slice(0, 300)}`;
  }
}
function ev(js) {
  const raw = ab("--json", "eval", `(() => { try { return JSON.stringify((() => { ${js} })()); } catch (e) { return JSON.stringify({ __err: String(e) }); } })()`);
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
  ab("screenshot", `${SHOTS}/${name}.png`);
  return `shots/${WIDTH}/${name}.png`;
}

// 페이지 안 도우미 — 보이는 요소만, 접근 이름(aria-label || 글자)으로 찾는다
const H = `
  const vis = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const nameOf = (el) => (el.getAttribute("aria-label") || el.textContent || "").replace(/\\s+/g, " ").trim();
  const all = (sel) => [...document.querySelectorAll(sel)].filter(vis);
  const byName = (sel, re) => all(sel).filter((el) => re.test(nameOf(el)));
  const status = () => [...document.querySelectorAll('[role="status"],[role="alert"]')].map((el) => (el.textContent || "").replace(/\\s+/g, " ").trim()).filter(Boolean);
`;
const clickName = (sel, reSrc, idx = 0) =>
  ev(`${H} const els = byName(${JSON.stringify(sel)}, new RegExp(${JSON.stringify(reSrc)})); const el = els[${idx}]; if (!el) return { clicked: false, count: els.length }; el.scrollIntoView({ block: "center" }); el.click(); return { clicked: true, name: nameOf(el), count: els.length };`);
const path = () => ev("return location.pathname + location.search;");

// ---------- 준비 ----------
ab("set", "viewport", String(WIDTH), "900");
ab("open", `${BASE}/catalog`);
ab("console", "--clear");
ab("errors", "--clear");
ev(`console.warn("qa41-sentinel"); return true;`); // 콘솔 수집이 실제로 도는지 확인용 표식

// ---------- F1 카탈로그 → 비교 3개 → /compare ----------
{
  const ready = waitFor(`${H} const b = byName("button", /비교 추가$/); return b.length >= 3 ? b.length : false;`);
  log("F1", "catalog 렌더 · '비교 추가' 버튼 ≥3", !!ready, { count: ready, path: path() });
  const added = [0, 1, 2].map(() => clickName("button", "비교 추가$", 0)); // 담으면 이름이 '비교 중'으로 바뀌어 다음 0번이 다음 카드
  pause(300);
  const tray = ev(`${H} return { inTray: byName("button", /비교 중, 비교에서 빼기$/).length, tray: nameOf(document.querySelector('[aria-label="비교 트레이"]') || document.body).slice(0, 120) };`);
  log("F1", "레퍼런스 3개 담기", tray.inTray === 3, { added: added.map((a) => a.name), ...tray });
  shot("f1-catalog-tray");
  const open = clickName("button", "^비교 보드 열기$");
  const onCompare = waitFor(`return location.pathname === "/compare" && document.querySelectorAll('button[aria-pressed]').length > 0 ? location.pathname : false;`, 12000);
  log("F1", "'비교 보드 열기' → /compare", onCompare === "/compare", { open, path: path() });
  shot("f1-compare");
}

// 보드 도우미 — 행 이름별 선택 버튼 표 (aria-label "행: 열 제목의 요소 선택")
const picksJs = `${H} const rows = {}; all('button[aria-pressed][aria-label$="의 요소 선택"]').forEach((b) => { const row = b.getAttribute("aria-label").split(":")[0]; (rows[row] ||= []).push({ label: b.getAttribute("aria-label"), pressed: b.getAttribute("aria-pressed") === "true" }); }); return rows;`;
const clickPick = (row, col) =>
  ev(`${H} const bs = all('button[aria-pressed][aria-label$="의 요소 선택"]').filter((b) => b.getAttribute("aria-label").startsWith(${JSON.stringify(row)} + ":")); const b = bs[${col}]; if (!b) return { clicked: false, count: bs.length }; b.scrollIntoView({ block: "center" }); b.click(); return { clicked: true, label: b.getAttribute("aria-label") };`);
const draftJs = `${H}
  const legend = [...document.querySelectorAll("legend")].find((l) => /확정할 곳/.test(l.textContent));
  const fs = legend?.closest("fieldset");
  const radios = fs ? [...fs.querySelectorAll('input[type="radio"]')].map((r) => ({ label: r.closest("label")?.textContent.trim(), checked: r.checked, visible: vis(r) })) : [];
  const caption = all("p").map((p) => p.textContent.trim()).find((t) => /프로젝트/.test(t) && /만들|새 프로젝트|이름/.test(t) && t.length < 120) || null;
  const confirms = all("button").filter((b) => /확정/.test(nameOf(b)) && !/비우기/.test(nameOf(b))).map((b) => ({ name: nameOf(b), disabled: b.getAttribute("aria-disabled") === "true", inBar: !!b.closest('[aria-label="초안 요약"]') }));
  return { hasTarget: !!fs, targetVisible: fs ? vis(fs) : false, radios, caption, confirms };`;
function openDraftIfNeeded() {
  // <1280: 초안 패널이 아래로 내려가거나 요약 바의 '초안 보기'로 연다 — 확정할 곳이 안 보이면 요약 바 버튼을 누른다
  const d = ev(draftJs);
  if (d.hasTarget && !d.targetVisible) clickName("button", "초안");
  return ev(draftJs);
}
function clickConfirm() {
  return ev(`${H} const bs = all("button").filter((b) => /확정/.test(nameOf(b)) && !/비우기/.test(nameOf(b)) && b.getAttribute("aria-disabled") !== "true"); const b = bs.find((x) => !x.closest('[aria-label="초안 요약"]')) || bs[0]; if (!b) return { clicked: false }; b.scrollIntoView({ block: "center" }); b.click(); return { clicked: true, name: nameOf(b) };`);
}

// ---------- F2 첫 확정 ----------
let firstName = null;
{
  const rows = ev(picksJs);
  const rowNames = Object.keys(rows);
  const hero = rowNames.find((r) => /hero/i.test(r)) ?? rowNames[0];
  const picked = [clickPick(hero, 0)];
  rowNames.filter((r) => r !== hero).slice(0, 2).forEach((r) => picked.push(clickPick(r, 1)));
  pause(500);
  const d = openDraftIfNeeded();
  firstName = (d.caption?.match(/[‘'“"]([^’'”"]+)[’'”"]/) || [])[1] ?? null;
  log("F2", "요소 선택(Hero 포함)", picked.every((p) => p.clicked), { rows: rowNames, picked: picked.map((p) => p.label) });
  log("F2", "J-S09 첫 확정 캡션(새 프로젝트 이름)", !!d.caption, { caption: d.caption, parsedName: firstName });
  log("F2", "'확정할 곳' 라디오 없음", !d.hasTarget, { radios: d.radios });
  log("F2", "확정 버튼 활성", d.confirms.some((c) => !c.disabled), { confirms: d.confirms });
  shot("f2-board-first-confirm");
  const c = clickConfirm();
  const onProfile = waitFor(`return location.pathname.startsWith("/profile/") ? location.pathname : false;`, 12000);
  const note = waitFor(`${H} const s = status().find((t) => /새 프로젝트/.test(t) && /만들었습니다/.test(t)); return s || false;`, 6000);
  log("F2", "확정 → /profile/:id", !!onProfile, { confirm: c, path: onProfile || path() });
  log("F2", "J-S11 새 프로젝트 알림", !!note, { status: note || ev(`${H} return status();`) });
  if (!firstName && typeof note === "string") firstName = (note.match(/'([^']+)'/) || [])[1] ?? null;
  shot("f2-profile-after-first-confirm");
}

// ---------- F3 프로필 머리 프로젝트 링크 → /projects → 뒤로 ----------
let profilePath1 = null;
{
  profilePath1 = path();
  const link = ev(`${H} const a = all("a").find((x) => /^프로젝트:/.test(nameOf(x))); return a ? { text: nameOf(a), href: a.getAttribute("href") } : null;`);
  log("F3", "프로필 머리 '프로젝트: <이름>' 링크", !!link && (!firstName || link.text.includes(firstName)), { link, firstName });
  if (link && !firstName) firstName = link.text.replace(/^프로젝트:\s*/, "");
  clickName("a", "^프로젝트:");
  const list = waitFor(`${H} if (location.pathname !== "/projects") return false; const ul = document.querySelector('[aria-label="프로젝트 목록"]'); return ul ? [...ul.children].map((li) => nameOf(li).slice(0, 80)) : false;`, 8000);
  log("F3", "/projects 목록에 그 프로젝트 존재", Array.isArray(list) && list.some((t) => t.includes(firstName)), { path: path(), list, firstName });
  shot("f3-projects");
  ab("back");
  const back = waitFor(`return location.pathname.startsWith("/profile/") ? location.pathname : false;`);
  log("F3", "뒤로 → 프로필", back === profilePath1, { path: back || path() });
}

// ---------- F4 보드 재확정 — 확정할 곳 라디오 ----------
{
  clickName('nav[aria-label="주 메뉴"] a', "^비교 보드$");
  const onBoard = waitFor(`return location.pathname === "/compare" && document.querySelectorAll('button[aria-pressed]').length > 0;`, 10000);
  const rows = ev(picksJs);
  const hero = Object.keys(rows).find((r) => /hero/i.test(r)) ?? Object.keys(rows)[0];
  const change = clickPick(hero, 1);
  pause(500);
  const d = openDraftIfNeeded();
  log("F4", "보드 복귀(GNB '비교 보드') · 선택 변경", !!onBoard && change.clicked, { path: path(), change });
  const ok2 = d.radios.length === 2 && d.radios[0].checked && d.radios[0].label === `${firstName} 새 버전` && d.radios[1].label === "새 프로젝트";
  log("F4", "라디오 2개 · '<이름> 새 버전' 기본 선택 · '새 프로젝트'", ok2, { radios: d.radios, firstName });
  const labelCurrent = d.confirms.map((c) => c.name);
  shot("f4-board-target-current");
  // 키보드: 첫 라디오에 포커스 → 화살표 아래 → 둘째 선택·포커스 → Shift+Tab / Tab으로 되돌아옴
  ev(`const r = [...document.querySelectorAll("fieldset input[type=radio]")].find((x) => x.checked); r?.scrollIntoView({ block: "center" }); r?.focus(); return !!r;`);
  ab("press", "ArrowDown");
  pause(200);
  const kb1 = ev(`const a = document.activeElement; const rs = [...document.querySelectorAll("fieldset input[type=radio]")]; return { focusIdx: rs.indexOf(a), checked: rs.map((r) => r.checked) };`);
  ab("press", "Shift+Tab");
  ab("press", "Tab");
  const kb2 = ev(`const a = document.activeElement; const rs = [...document.querySelectorAll("fieldset input[type=radio]")]; return { focusIdx: rs.indexOf(a), checked: rs.map((r) => r.checked) };`);
  ab("press", "ArrowUp");
  const kb3 = ev(`const rs = [...document.querySelectorAll("fieldset input[type=radio]")]; return { focusIdx: rs.indexOf(document.activeElement), checked: rs.map((r) => r.checked) };`);
  ab("press", "ArrowDown");
  pause(200);
  const kbOk = kb1.focusIdx === 1 && kb1.checked[1] && kb2.focusIdx === 1 && kb3.focusIdx === 0 && kb3.checked[0];
  log("F4", "키보드(Tab·화살표)로 라디오 선택", kbOk, { afterArrowDown: kb1, afterShiftTabTab: kb2, afterArrowUp: kb3 });
  const dNew = ev(draftJs);
  const labelNew = dNew.confirms.map((c) => c.name);
  log("F4", "확정 버튼 이름이 대상에 맞게 바뀜", JSON.stringify(labelCurrent) !== JSON.stringify(labelNew) && labelNew.some((n) => /새 프로젝트/.test(n)), { current: labelCurrent, new: labelNew, radios: dNew.radios });
  shot("f4-board-target-new");
  const c = clickConfirm();
  const onProfile = waitFor(`return location.pathname.startsWith("/profile/") && location.pathname !== ${JSON.stringify(profilePath1)} ? location.pathname : false;`, 12000);
  const note = waitFor(`${H} const s = status().find((t) => /새 프로젝트/.test(t) && /만들었습니다/.test(t)); return s || false;`, 6000);
  log("F4", "'새 프로젝트'로 확정 → 새 프로필 · 알림", !!onProfile && !!note, { confirm: c, path: onProfile || path(), note });
  shot("f4-profile-second");
  clickName('nav[aria-label="주 메뉴"] a', "^프로젝트$");
  const list = waitFor(`${H} if (location.pathname !== "/projects") return false; const ul = document.querySelector('[aria-label="프로젝트 목록"]'); return ul ? [...ul.children].map((li) => nameOf(li).slice(0, 80)) : false;`, 8000);
  log("F4", "프로젝트 2개", Array.isArray(list) && list.length === 2, { list });
  shot("f4-projects-two");
  ab("back");
  waitFor(`return location.pathname.startsWith("/profile/") ? location.pathname : false;`);
}

// ---------- F5 3안 → 편집 시작 → /studio/:projectId ----------
{
  const projLink = ev(`${H} const a = all("a").find((x) => /^프로젝트:/.test(nameOf(x))); return a ? nameOf(a).replace(/^프로젝트:\\s*/, "") : null;`);
  const gen = clickName("button", "^3안 만들기");
  const cards = waitFor(`${H} const b = byName("button", /안 선택$/); return b.length >= 3 ? b.map(nameOf) : false;`, 15000);
  log("F5", "3안 만들기 → 카드 3개", Array.isArray(cards), { gen, cards, project: projLink });
  const sel = clickName("button", "안 선택$", 1);
  const edit = waitFor(`${H} const b = byName("button", /편집 시작$/).filter((x) => x.getAttribute("aria-disabled") !== "true"); return b.length ? nameOf(b[0]) : false;`, 8000);
  log("F5", "안 선택 → '편집 시작' 활성", !!edit, { sel, edit });
  shot("f5-profile-candidates");
  clickName("button", "편집 시작$");
  const studio = waitFor(`${H} if (!location.pathname.startsWith("/studio/")) return false; const h1 = document.querySelector("h1"); return h1 ? { path: location.pathname, h1: nameOf(h1), body: document.body.innerText.slice(0, 600) } : false;`, 10000);
  log("F5", "/studio/:projectId 이동", !!studio?.path, { path: studio?.path || path() });
  log("F5", "셸이 프로젝트 이름(실데이터) 표시", !!studio?.h1 && studio.h1 === projLink, { h1: studio?.h1, expected: projLink });
  log("F5", "E-S03 문서 없음 상태", /아직 편집할 페이지가 없습니다/.test(studio?.body ?? ""), { body: (studio?.body ?? "").slice(0, 200) });
  shot("f5-studio");
  const back = ev(`${H} const el = [...document.querySelectorAll("a,button")].find((x) => /프로젝트로 돌아가기/.test(nameOf(x))); return el ? { name: nameOf(el), href: el.getAttribute("href") } : null;`);
  if (back) {
    clickName("a,button", "프로젝트로 돌아가기");
    const p = waitFor(`return location.pathname === "/projects" ? location.pathname : false;`);
    log("F5", "'프로젝트로 돌아가기' → /projects", p === "/projects", { back, path: path() });
  } else {
    const alt = ev(`${H} return all("a").map((a) => ({ name: nameOf(a), href: a.getAttribute("href") })).filter((a) => !a.href?.startsWith("/catalog"));`);
    log("F5", "'프로젝트로 돌아가기' → /projects", false, { back: null, note: "E-S03 화면에 해당 이름의 링크/버튼 없음", links: alt });
    clickName("a", "^프로필에서 3안 고르기$");
    const p = waitFor(`return location.pathname.startsWith("/profile/") ? location.pathname : false;`);
    log("F5", "(대체) '프로필에서 3안 고르기' → /profile/:profileId", !!p, { path: path() });
  }
}

// ---------- F6 GNB · Tab 순서 ----------
{
  const gnb = ev(`${H} const h = document.querySelector("header"); return h ? [...h.querySelectorAll("a,button")].filter(vis).map((a) => ({ name: nameOf(a), href: a.getAttribute("href"), current: a.getAttribute("aria-current") })) : null;`);
  const hasNew = gnb?.some((a) => a.name === "새 프로젝트" && a.href === "/compare?new=1");
  const hasProj = gnb?.some((a) => a.name === "프로젝트" && a.href === "/projects");
  log("F6", "GNB '새 프로젝트'(→/compare?new=1) · '프로젝트'(→/projects)", !!hasNew && !!hasProj, { gnb, path: path() });
  // Tab 순서 = 보이는 순서: 헤더 첫 포커스부터 Tab으로 돌며 헤더 안 요소의 위치를 모은다
  ev(`const h = document.querySelector("header"); const t = document.createElement("span"); t.tabIndex = -1; t.id = "qa41-start"; h.parentNode.insertBefore(t, h); t.focus(); return true;`);
  const seq = [];
  for (let i = 0; i < 10; i += 1) {
    ab("press", "Tab");
    const a = ev(`${H} const a = document.activeElement; if (!a || a.closest("header") !== document.querySelector("header")) return { out: true, name: a ? nameOf(a).slice(0, 30) : null }; const r = a.getBoundingClientRect(); return { name: nameOf(a).slice(0, 30), top: Math.round(r.top), left: Math.round(r.left) };`);
    if (a.out) break;
    seq.push(a);
  }
  ev(`document.getElementById("qa41-start")?.remove(); return true;`);
  const visual = [...seq].sort((a, b) => (Math.abs(a.top - b.top) > 8 ? a.top - b.top : a.left - b.left)).map((a) => a.name);
  log("F6", "헤더 Tab 순서 = 보이는 순서", seq.length > 0 && JSON.stringify(seq.map((a) => a.name)) === JSON.stringify(visual), { tabOrder: seq, visualOrder: visual });
  const hdr = ev(`const h = document.querySelector("header"); return h ? Math.round(h.getBoundingClientRect().height) : null;`);
  log("F6", "헤더 높이(참고 — D3: 390 3행 수용)", true, { headerHeight: hdr });
  shot("f6-gnb");
  clickName("header a", "^새 프로젝트$");
  const np = waitFor(`return location.pathname === "/compare" ? location.pathname + location.search : false;`);
  log("F6", "GNB '새 프로젝트' 클릭 → /compare", !!np, { path: path() });
  shot("f6-new-project");
}

// ---------- F7 콘솔·페이지 오류 ----------
{
  const consoleOut = ab("--json", "console");
  const errorsOut = ab("--json", "errors");
  let msgs = [];
  let errs = [];
  try { msgs = JSON.parse(consoleOut).data?.messages ?? JSON.parse(consoleOut).data ?? []; } catch { msgs = []; }
  try { errs = JSON.parse(errorsOut).data?.errors ?? JSON.parse(errorsOut).data ?? []; } catch { errs = []; }
  const sentinel = consoleOut.includes("qa41-sentinel");
  const consoleErrors = Array.isArray(msgs) ? msgs.filter((m) => /error/i.test(m.type ?? m.level ?? "")) : [];
  log("F7", "콘솔 error 0", consoleErrors.length === 0, { consoleErrors: consoleErrors.slice(0, 5), total: Array.isArray(msgs) ? msgs.length : null, sentinelCaptured: sentinel, raw: Array.isArray(msgs) ? undefined : consoleOut.slice(0, 300) });
  log("F7", "페이지 오류 0", Array.isArray(errs) && errs.length === 0, { errors: Array.isArray(errs) ? errs.slice(0, 5) : errorsOut.slice(0, 300) });
}
ab("close");

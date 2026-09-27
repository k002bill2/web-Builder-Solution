#!/usr/bin/env node
// QA-A2-DATA-FLOW — a2 데이터 계층 흐름(G1~G7) 한 번 실행. 선례 docs/qa/a1-beta-flow/flow.mjs 복사·수정. 도구: agent-browser CLI(같은 도구, 새 의존성 없음).
// 사용: node flow.mjs <width> <outDir>   — 단계마다 JSON 한 줄을 stdout·<outDir>/flow.jsonl에 쓰고 shots/<width>/에 캡처.
// 이동은 앱 안 클릭(메모리 store 유지). 직접 URL 진입은 첫 진입과 G4(새로고침 관찰, 맨 끝)뿐.
// 편집 시작 결과는 화면에 알림이 그려지지 않으므로 이동 state(history.state.usr = StudioEntryState)로 관찰한다.
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";

const WIDTH = Number(process.argv[2] ?? 1280);
const OUT = process.argv[3] ?? "docs/qa/a2-data-flow";
const BASE = "http://127.0.0.1:4341";
const SESSION = `qaA2-${WIDTH}`;
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
  const raw = ab("--json", "eval", `(async () => { try { return JSON.stringify(await (async () => { ${js} })()); } catch (e) { return JSON.stringify({ __err: String(e) }); } })()`); // 선례와 달리 async — 페이지 안 대기(setTimeout) 허용
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
ev(`console.warn("qaA2-sentinel"); return true;`); // 콘솔 수집이 실제로 도는지 확인용 표식

// ---------- G1(a) 카탈로그 → 비교 3개 → /compare ----------
{
  const ready = waitFor(`${H} const b = byName("button", /비교 추가$/); return b.length >= 3 ? b.length : false;`);
  log("G1", "catalog 렌더 · '비교 추가' 버튼 ≥3", !!ready, { count: ready, path: path() });
  const added = [0, 1, 2].map(() => clickName("button", "비교 추가$", 0)); // 담으면 이름이 '비교 중'으로 바뀌어 다음 0번이 다음 카드
  pause(300);
  const tray = ev(`${H} return { inTray: byName("button", /비교 중, 비교에서 빼기$/).length, tray: nameOf(document.querySelector('[aria-label="비교 트레이"]') || document.body).slice(0, 120) };`);
  log("G1", "레퍼런스 3개 담기", tray.inTray === 3, { added: added.map((a) => a.name), ...tray });
  shot("g1-catalog-tray");
  const open = clickName("button", "^비교 보드 열기$");
  const onCompare = waitFor(`return location.pathname === "/compare" && document.querySelectorAll('button[aria-pressed]').length > 0 ? location.pathname : false;`, 12000);
  log("G1", "'비교 보드 열기' → /compare", onCompare === "/compare", { open, path: path() });
  shot("g1-compare");
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

// ---------- G1(b) 첫 확정 → /profile/:id ----------
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
  log("G1", "요소 선택(Hero 포함)", picked.every((p) => p.clicked), { rows: rowNames, picked: picked.map((p) => p.label) });
  log("G1", "J-S09 첫 확정 캡션(새 프로젝트 이름)", !!d.caption, { caption: d.caption, parsedName: firstName });
  log("G1", "'확정할 곳' 라디오 없음", !d.hasTarget, { radios: d.radios });
  log("G1", "확정 버튼 활성", d.confirms.some((c) => !c.disabled), { confirms: d.confirms });
  shot("g1-board-first-confirm");
  const c = clickConfirm();
  const onProfile = waitFor(`return location.pathname.startsWith("/profile/") ? location.pathname : false;`, 12000);
  const note = waitFor(`${H} const s = status().find((t) => /새 프로젝트/.test(t) && /만들었습니다/.test(t)); return s || false;`, 1500);
  log("G1", "확정 → /profile/:id", !!onProfile, { confirm: c, path: onProfile || path() });
  log("G1", "(범위 밖·기록만) 첫 확정 새 프로젝트 알림 — C6 revert", null, { status: note || ev(`${H} return status();`) });
  if (!firstName && typeof note === "string") firstName = (note.match(/'([^']+)'/) || [])[1] ?? null;
  shot("g1-profile-after-first-confirm");
}


// ---------- 공통: 편집 시작 관찰 도우미 ----------
const profileName = () => ev(`${H} const a = all("a").find((x) => /^프로젝트:/.test(nameOf(x))); return a ? nameOf(a).replace(/^프로젝트:\\s*/, "") : null;`);
const E_S03 = "아직 편집할 페이지가 없습니다";
const studioJs = `${H} if (!location.pathname.startsWith("/studio/")) return false; const h1 = document.querySelector("h1"); if (!h1) return false;
  return { path: location.pathname, h1: nameOf(h1), body: document.body.innerText.replace(/\\s+/g, " ").slice(0, 400), usr: history.state?.usr ?? null, status: status(),
    active: document.activeElement ? { tag: document.activeElement.tagName, name: nameOf(document.activeElement).slice(0, 40) } : null };`;
// pushState 횟수 계측 — 중복 클릭이 이동을 두 번 만들지 않는지(쓰기 경로 중복의 간접 증거)
const armPush = () => ev(`if (!window.__qaPushWrapped) { const o = history.pushState; history.pushState = function (...a) { window.__qaPush = (window.__qaPush || 0) + 1; return o.apply(this, a); }; window.__qaPushWrapped = true; } window.__qaPush = 0; return true;`);
const pushes = () => ev(`return window.__qaPush || 0;`);

// ---------- G2 3안 → 안 선택 → 편집 시작(중복 클릭) → /studio/:projectId ----------
let studioPath = null;
let projName = null;
let profilePath = null;
{
  profilePath = path();
  projName = profileName();
  const gen = clickName("button", "^3안 만들기");
  const cards = waitFor(`${H} const b = byName("button", /안 선택$/); return b.length >= 3 ? b.map(nameOf) : false;`, 15000);
  log("G2", "3안 만들기 → 카드 3개", Array.isArray(cards), { gen, cards, project: projName });
  const sel = clickName("button", "안 선택$", 1);
  const edit = waitFor(`${H} const b = byName("button", /편집 시작$/).filter((x) => x.getAttribute("aria-disabled") !== "true"); return b.length ? nameOf(b[0]) : false;`, 8000);
  log("G2", "안 선택 → '편집 시작' 활성", !!edit, { sel, edit });
  shot("g2-profile-candidates");
  armPush();
  // 사람의 빠른 연속 클릭 = 서로 다른 작업(task) — 클릭 사이에 setTimeout 0으로 React 반영(마이크로태스크)을 허용한다.
  // aria-busy 값 변화는 MutationObserver로 모두 모은다(로컬에서는 진행 구간이 짧아 시점 조회로는 놓칠 수 있음).
  const dbl = ev(`${H} const b = byName("button", /편집 시작$/)[0]; if (!b) return { clicked: false }; b.scrollIntoView({ block: "center" });
    const seen = []; const mo = new MutationObserver(() => seen.push(b.getAttribute("aria-busy"))); mo.observe(b, { attributes: true, attributeFilter: ["aria-busy"] });
    const tick = () => new Promise((r) => setTimeout(r, 0));
    b.click(); await tick(); const busy1 = b.isConnected ? b.getAttribute("aria-busy") : "(버튼 사라짐)";
    const second = b.isConnected; if (second) b.click(); await tick(); const third = b.isConnected; if (third) b.click(); await tick();
    mo.disconnect(); return { clicked: true, busyAfterFirst: busy1, secondClickSent: second, thirdClickSent: third, ariaBusySeen: seen };`);
  log("G2", "편집 시작 누름 → 진행 중 aria-busy=true", dbl.busyAfterFirst === "true" || (dbl.ariaBusySeen ?? []).includes("true"), dbl);
  const st = waitFor(studioJs, 10000);
  pause(400);
  const n = pushes();
  studioPath = st?.path ?? null;
  log("G2", "중복 클릭 무시 — 이동(pushState) 1회", n === 1, { pushStateCount: n, note: "클릭 3회(서로 다른 task)" });
  log("G2", "/studio/:projectId 이동", /^\/studio\/project-\d+$/.test(studioPath ?? ""), { path: studioPath || path() });
  log("G2", "셸 h1 = 프로젝트 이름", !!st?.h1 && st.h1 === projName, { h1: st?.h1, expected: projName });
  log("G2", "셸이 '문서 있음' 상태(E-S03 '문서 없음' 안내 아님)", !!st && !st.body.includes(E_S03), { body: st?.body?.slice(0, 200) });
  log("G2", "(관찰) 이동 state = startDoc 성공 결과(changes·editNotice)", null, { usr: st?.usr });
  shot("g2-studio");
  // ---------- G5 8.2.1 (a) 바뀐 변형 알림 문구 ----------
  const changes = st?.usr?.changes;
  const notice = st?.usr?.editNotice;
  if (Array.isArray(changes) && changes.length > 0) {
    const re = /^구조안의 섹션 (\d+)개를 편집기 변형으로 바꿔 열었습니다 — (.+ → .+)( · .+ → .+)*$/;
    const m = typeof notice === "string" ? notice.match(re) : null;
    log("G5", "8.2.1 (a) 알림 문형 = SPEC 문형(글자 그대로)", !!m, { notice, changes, spec: "구조안의 섹션 N개를 편집기 변형으로 바꿔 열었습니다 — <유형> <원래> → <편집기 변형> · …" });
    log("G5", "알림의 쌍 수 = changes 수", !!m && notice.split(" · ").length === changes.length, { pairs: typeof notice === "string" ? notice.split(" — ")[1]?.split(" · ") : null, changes: changes.length, countInText: m?.[1] });
    const shown = st.body.includes("바꿔 열었습니다") || st.status.some((t) => t.includes("바꿔 열었습니다"));
    log("G5", "알림이 이동 뒤 화면에 1회 보임", shown, { status: st.status, note: "StudioPage가 location.state를 읽는지 확인" });
  } else {
    log("G5", "바뀐 변형 알림", null, { note: "해당 픽스처 없음 — 이 안의 changes 0개", usr: st?.usr });
  }
}

// ---------- G3 같은 안으로 다시 편집 시작 · 다른 안(G6 키보드)으로 편집 시작 → DOC_EXISTS ----------
function backToProfile() {
  const c = clickName("a", "^프로필에서 3안 고르기$");
  const p = waitFor(`${H} return location.pathname.startsWith("/profile/") && byName("button", /안 선택$/).length >= 3 ? location.pathname : false;`, 10000);
  return { link: c, path: p || path() };
}
{
  const back = backToProfile();
  const selNow = ev(`${H} return byName("button", /편집 시작$/).map(nameOf);`);
  log("G3", "셸 → '프로필에서 3안 고르기' → 프로필(3안·선택 유지)", back.path === profilePath, { ...back, expected: profilePath, editButton: selNow });
  armPush();
  const c = clickName("button", "편집 시작$");
  const st = waitFor(studioJs, 10000);
  log("G3", "같은 안 다시 편집 시작 → 같은 /studio/:projectId", st?.path === studioPath, { click: c, path: st?.path || path(), pushStateCount: pushes() });
  const ne = st?.usr?.editNotice ?? null;
  // SPEC 8.3.1 판정 2: 같은 인자 = 멱등 재생(성공, 쓰기 0) · 브리프 기대: DOC_EXISTS — 둘 다 "새 문서 없음". 실제 결과를 그대로 기록
  log("G3", "같은 안 → 새 문서 없이 기존 문서(멱등 재생 또는 DOC_EXISTS)", !!st && (Array.isArray(st.usr?.changes) || /^이미 편집 중인 문서를 엽니다/.test(ne ?? "")), { usr: st?.usr, kind: /^이미 편집 중인 문서를 엽니다/.test(ne ?? "") ? "DOC_EXISTS" : Array.isArray(st?.usr?.changes) ? "멱등 재생(성공 결과 재사용)" : "알 수 없음" });
  shot("g3-studio-same-candidate");
}

// ---------- G6 키보드만으로 다른 안 선택 → 편집 시작 (→ G3 DOC_EXISTS) ----------
{
  backToProfile();
  // 시작점: 3안 제목(h2) 앞에 임시 포커스 표식
  ev(`const h = document.getElementById("profile-candidates"); const t = document.createElement("span"); t.tabIndex = -1; t.id = "qaA2-start"; h.parentNode.insertBefore(t, h); t.focus(); return true;`);
  const tabTo = (re, max = 25) => {
    for (let i = 0; i < max; i += 1) {
      ab("press", "Tab");
      const a = ev(`${H} const a = document.activeElement; return a ? nameOf(a).slice(0, 60) : null;`);
      if (typeof a === "string" && new RegExp(re).test(a)) return { name: a, tabs: i + 1 };
    }
    return null;
  };
  const toC = tabTo("C안 선택$");
  ab("press", "Enter");
  pause(300);
  const cSel = ev(`${H} return { edit: byName("button", /편집 시작$/).map(nameOf), active: nameOf(document.activeElement).slice(0, 40) };`);
  log("G6", "Tab으로 'C안 선택' 도달 · Enter로 선택", !!toC && cSel.edit.some((n) => /^C안으로 편집 시작$/.test(n)), { toC, ...cSel });
  const toEdit = tabTo("편집 시작$");
  armPush();
  ab("press", "Enter");
  const st = waitFor(studioJs, 10000);
  ev(`document.getElementById("qaA2-start")?.remove(); return true;`);
  log("G6", "Tab으로 '편집 시작' 도달 · Enter → /studio/:projectId", !!toEdit && st?.path === studioPath, { toEdit, path: st?.path || path() });
  pause(300);
  const focus = ev(`${H} const a = document.activeElement; return { tag: a?.tagName ?? null, name: a ? nameOf(a).slice(0, 40) : null, isBody: a === document.body, connected: !!a?.isConnected };`);
  // 이동 뒤 한 번 더 Tab — 포커스가 문서 안 조작 요소로 이어지는지
  ab("press", "Tab");
  const next = ev(`${H} const a = document.activeElement; return { tag: a?.tagName ?? null, name: a ? nameOf(a).slice(0, 40) : null, isBody: a === document.body };`);
  log("G6", "이동 뒤 포커스가 사라지지 않음(body 아님)", !focus.isBody && focus.connected, { afterNav: focus, afterTab: next });
  const ne = st?.usr?.editNotice ?? null;
  log("G3", "다른 안(C) 편집 시작 → DOC_EXISTS 흐름 · 같은 /studio/:projectId", st?.path === studioPath && /^이미 편집 중인 문서를 엽니다/.test(ne ?? ""), { usr: st?.usr, path: st?.path });
  const shown = (st?.body ?? "").includes("이미 편집 중인 문서를 엽니다") || (st?.status ?? []).some((t) => t.includes("이미 편집 중인 문서를 엽니다"));
  log("G3", "'이미 편집 중인 문서를 엽니다'가 화면에 보임", shown, { status: st?.status, body: st?.body?.slice(0, 200) });
  shot("g3-studio-doc-exists");
}

// ---------- G7 콘솔·페이지 오류 ----------
{
  const consoleOut = ab("--json", "console");
  const errorsOut = ab("--json", "errors");
  let msgs = [];
  let errs = [];
  try { msgs = JSON.parse(consoleOut).data?.messages ?? JSON.parse(consoleOut).data ?? []; } catch { msgs = []; }
  try { errs = JSON.parse(errorsOut).data?.errors ?? JSON.parse(errorsOut).data ?? []; } catch { errs = []; }
  const sentinel = consoleOut.includes("qaA2-sentinel");
  const consoleErrors = Array.isArray(msgs) ? msgs.filter((m) => /error/i.test(m.type ?? m.level ?? "")) : [];
  log("G7", "콘솔 error 0", consoleErrors.length === 0, { consoleErrors: consoleErrors.slice(0, 5), total: Array.isArray(msgs) ? msgs.length : null, sentinelCaptured: sentinel, raw: Array.isArray(msgs) ? undefined : consoleOut.slice(0, 300) });
  log("G7", "페이지 오류 0", Array.isArray(errs) && errs.length === 0, { errors: Array.isArray(errs) ? errs.slice(0, 5) : errorsOut.slice(0, 300) });
}


// ---------- G4 새로고침(직접 진입) — 관찰만 ----------
{
  ab("open", `${BASE}${studioPath ?? "/studio/project-1"}`);
  const st = waitFor(`${H} const h1 = document.querySelector("h1"); return h1 ? { path: location.pathname, h1: nameOf(h1), body: document.body.innerText.replace(/\\s+/g, " ").slice(0, 300) } : false;`, 10000);
  log("G4", "(관찰) 새로고침 뒤 /studio/:projectId", null, { ...st, note: "메모리 저장소 — E-S02 문구 '새로고침하면 프로젝트와 편집 내용이 사라집니다(서버 연결 전)'" });
  shot("g4-studio-reload");
  const errorsOut = ab("--json", "errors");
  log("G4", "새로고침 뒤 페이지 오류 0", /"errors":\s*\[\]|"data":\s*\[\]/.test(errorsOut), { raw: errorsOut.slice(0, 300) });
}
ab("close");

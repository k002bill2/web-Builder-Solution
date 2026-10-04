// QA 독립 판정(작성 = QA, 구현자 fbjudge.mjs 미사용) — logs/fb-qa.json + static/fb-qa-*.html → logs/fb-qa-judge.txt
import { readFileSync, writeFileSync } from "node:fs";
const V = ["sticky-right-cta", "sticky-hamburger", "sticky-two-tier", "transparent"], W3 = [1280, 768, 390];
const o = JSON.parse(readFileSync(new URL("./logs/fb-qa.json", import.meta.url)));
const L = []; let fail = 0;
const line = (ok, msg) => { if (!ok) fail++; L.push(`${ok ? "PASS" : "FAIL"} ${msg}`); };
// A. 변환 검사: 원본에 같은 치환을 적용하면 모의 사본과 바이트 동일(그 외 차이 0) · 원본에 명시 @supports 지원/미지원 블록 존재
for (const v of V) {
  const orig = readFileSync(new URL(`./static/fb-qa-${v}.html`, import.meta.url), "utf8");
  const mock = readFileSync(new URL(`./static/fb-qa-${v}-mock.html`, import.meta.url), "utf8");
  const re = orig.replace(/:popover-open/g, ":x-mock-no-popover").replace(/\spopover="[^"]*"/g, "").replace(/\spopovertarget(?:action)?="[^"]*"/g, "");
  line(re === mock && /@supports not selector\(:popover-open\)/.test(orig) && /@supports selector\(:popover-open\)/.test(orig) && !/x-mock/.test(orig),
    `변환 ${v}: 원본→모의 = 지정 치환뿐(${re === mock}) · 원본 CSS 지원/미지원 @supports 블록 존재 · 원본에 모의 토큰 0 · 내역 ${JSON.stringify(o[`transform-${v}`])}`);
}
// B. 지원(원본) 경로
for (const v of V) for (const w of W3) {
  const s = o[`orig-${v}-${w}`]; const why = [];
  if (!s.supportsPopoverOpen || s.popoverEls !== 1) why.push(`지원/팝오버 ${s.supportsPopoverOpen}/${s.popoverEls}`);
  if (s.sheetVisible) why.push("닫힌 시트 보임");
  if (s.navVisible !== (s.menuButtons.length ? 0 : 1) && !(s.menuButtons.length && s.navVisible === 0)) why.push(`nav ${s.navVisible}`);
  if (s.overflowX !== 0) why.push(`넘침 ${s.overflowX}`);
  const lgBar = w === 1280 && v !== "sticky-hamburger";
  if (lgBar && (s.menuButtons.length || s.navVisible !== 1)) why.push("lg 바 메뉴 아님");
  if (!lgBar && !s.menuButtons.includes("메뉴")) why.push("메뉴 버튼 없음");
  const n = s.native;
  if (!lgBar) {
    if (!n) why.push("네이티브 측정 없음");
    else {
      if (!n.open1) why.push("열기 실패");
      if (!n.esc.closed || !n.escVis) why.push("Esc 닫힘 실패");
      if (!n.esc.focusBack) why.push("포커스 복귀 실패");
      if (!n.anchor.opened || !n.anchor.closed) why.push("앵커 닫힘 실패");
      if (!n.vis2.closedBefore || !n.vis2.openVis || !n.vis2.closedAfter || n.vis2.openRect[1] === 0) why.push(`실제 visibility ${JSON.stringify(n.vis2)}`);
    }
  }
  line(!why.length, `지원 ${v} ${w}: ${why.join(" · ") || "ok"} (버튼 ${s.menuButtons} · nav ${s.navVisible} · 닫힌 시트 ${s.sheetVisible ? "보임" : "숨김"} · 넘침 ${s.overflowX}${n ? ` · 열림 시트 ${n.vis2.openRect.join("×")} · Esc ${n.esc.closed}/${n.escVis} · 복귀 ${n.esc.focusBack} · 앵커 ${n.anchor.href} 닫힘 ${n.anchor.closed}` : ""})`);
}
// C. 모의 미지원
for (const v of V) for (const w of W3) {
  const s = o[`mock-${v}-${w}`]; const why = [];
  if (s.supportsMock !== false || s.popoverEls !== 0) why.push("모의 미적용");
  if (s.menuButtons.length) why.push(`버튼 ${s.menuButtons}`);
  if (s.navVisible !== 1) why.push(`nav ${s.navVisible}`);
  if (!s.allNavReachable || s.visNavItems !== s.navItems || s.navItems === 0) why.push(`항목 ${s.visNavItems}/${s.navItems}`);
  if (s.links === 0 || s.focusableLinks !== s.links) why.push(`링크 focus ${s.focusableLinks}/${s.links}`);
  if (s.utilityTotal > 0 && s.utilityVisible < 1) why.push(`utility ${s.utilityVisible}/${s.utilityTotal}`);
  if (s.overflowX !== 0) why.push(`넘침 ${s.overflowX}`);
  if (w < 1280 || v === "sticky-hamburger") { if (!s.sheetVisible || s.sheetPosition !== "static") why.push(`시트 일반 흐름 아님 ${s.sheetVisible}/${s.sheetPosition}`); }
  else if (s.sheetVisible) why.push("lg 시트 중복");
  line(!why.length, `모의 ${v} ${w}: ${why.join(" · ") || "ok"} (nav ${s.navVisible} · 항목 ${s.visNavItems}/${s.navItems} · 링크 ${s.focusableLinks}/${s.links} · 시트 ${s.sheetVisible ? s.sheetPosition : "숨김"} · utility ${s.utilityVisible}/${s.utilityTotal} · 넘침 ${s.overflowX} · 규칙 ${s.cssRules})`);
}
L.push(`종합 FAIL ${fail}건 · 규칙 수 원본 ${o["orig-transparent-1280"].cssRules} → 모의 ${o["mock-transparent-1280"].cssRules}`);
writeFileSync(new URL("./logs/fb-qa-judge.txt", import.meta.url), L.join("\n") + "\n"); console.log(L.join("\n"));

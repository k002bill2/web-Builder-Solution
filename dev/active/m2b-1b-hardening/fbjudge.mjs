// fb-{base,fix}.json → P1 판정 (logs/fb-judge.txt). 모의 미지원 = "selector()는 알고 popover는 모르는 엔진" 모의(실제 구형 UA 아님)
import { readFileSync } from "node:fs";
const V = ["sticky-right-cta", "sticky-hamburger", "sticky-two-tier", "transparent"], W3 = [1280, 768, 390];
const lines = [];
for (const phase of ["base", "fix"]) {
  const o = JSON.parse(readFileSync(new URL(`./logs/fb-${phase}.json`, import.meta.url)));
  const rows = (kind) => V.flatMap((v) => W3.map((w) => [v, w, o[`${kind}-${v}-${w}`]]));
  // 모의가 실제로 걸렸는지: 엔진이 :popover-open 규칙을 버림(규칙 수 감소) · selector() 거짓 · popover 요소 0
  const mk = rows("mock"), og = rows("orig");
  const mockReal = mk.every(([, , s]) => s.popoverEls === 0 && s.supportsMock === false) && mk[0][2].cssRules < og[0][2].cssRules;
  lines.push(`[${phase}] 모의 적용 ${mockReal ? "OK" : "FAIL"} — 규칙 ${og[0][2].cssRules}→${mk[0][2].cssRules}(엔진이 버린 규칙 ${og[0][2].cssRules - mk[0][2].cssRules}) · 변환 ${JSON.stringify(o["transform-sticky-hamburger"])}`);
  const fails = [];
  for (const [v, w, s] of mk) {
    const why = [];
    if (s.menuButtons.length) why.push(`조작 안 되는 버튼 보임 ${s.menuButtons}`);
    if (!s.allNavReachable || s.visNavItems === 0) why.push(`메뉴 항목 ${s.visNavItems}/${s.navItems}`);
    if (s.focusableLinks !== s.links || s.links === 0) why.push(`링크 focus ${s.focusableLinks}/${s.links}`);
    if (s.navVisible !== 1) why.push(`nav ${s.navVisible}`);
    if (s.utilityTotal && s.utilityVisible !== 1) why.push(`utility ${s.utilityVisible}`);
    if (s.overflowX !== 0) why.push(`넘침 ${s.overflowX}`);
    lines.push(`[${phase}] mock ${v} ${w}: ${why.length ? "FAIL " + why.join(" · ") : "PASS"} (nav ${s.navVisible} · 항목 ${s.visNavItems}/${s.navItems} · 링크 ${s.focusableLinks}/${s.links} · 시트 ${s.sheetVisible ? s.sheetPosition : "숨김"} · utility ${s.utilityVisible}/${s.utilityTotal} · 넘침 ${s.overflowX})`);
    if (why.length) fails.push(`${v}-${w}`);
  }
  const nat = og.filter(([, , s]) => s.native);
  const natOk = nat.every(([, , s]) => s.native.open1 && s.native.esc.closed && s.native.esc.focusBack && s.native.anchor.opened && s.native.anchor.closed);
  const lgOk = og.filter(([v, w]) => w === 1280 && v !== "sticky-hamburger").every(([, , s]) => s.menuButtons.length === 0 && s.navVisible === 1 && !s.sheetVisible);
  lines.push(`[${phase}] 지원 경로: 메뉴 버튼 ${nat.length}건 열기·Esc 닫힘·포커스 복귀·시트 앵커 닫힘 ${natOk ? "PASS" : "FAIL"} · lg(burger 제외) 버튼·시트 숨김·nav 1 ${lgOk ? "PASS" : "FAIL"} · 넘침 최대 ${Math.max(...og.map(([, , s]) => s.overflowX))}`);
  lines.push(`[${phase}] 모의 미지원 종합: ${fails.length ? `FAIL ${fails.length}건 ${fails.join(", ")}` : "PASS 12/12"}`);
}
const txt = lines.join("\n");
console.log(txt);
(await import("node:fs")).writeFileSync(new URL("./logs/fb-judge.txt", import.meta.url), txt + "\n");

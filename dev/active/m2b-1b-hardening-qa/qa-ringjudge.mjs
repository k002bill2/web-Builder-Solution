// QA 독립 판정(작성 = QA) — logs/qb-qa.json → logs/ring-qa-judge.txt. 원시 rings(focused/fv/style/width/ratio/pair)를 직접 다시 판정한다(구현자 badRings 문자열에 기대지 않음)
import { readFileSync, writeFileSync } from "node:fs";
const o = JSON.parse(readFileSync(new URL("./logs/qb-qa.json", import.meta.url)));
const L = []; const P = (ok, m) => L.push(`${ok === null ? "N/A" : ok ? "PASS" : "FAIL"} ${m}`);
const FOOT = /-(biz-extended|biz-extended-map|minimal|minimal-biz)-\d+$/;
const keys = Object.keys(o).filter((k) => k.startsWith("ring-"));
const head = keys.filter((k) => !FOOT.test(k)), foot = keys.filter((k) => FOOT.test(k));
// rings 문자열 "t:ring/face:ratio" → 수치 재계산 대상. badRings는 구현 판정이므로 별도 대조만
const parseRing = (s) => { const m = /^(.*):([^:]+\/[^:]+):([\d.]+|null)$/.exec(s); return m ? { t: m[1], pair: m[2], ratio: m[3] === "null" ? null : +m[3] } : { t: s, pair: "?", ratio: null }; };
const OK = new Set(["on-primary/primary", "ink/bg", "ink/surface", "bg/ink"]);
let n = 0, min = 99, minAt = "", badQa = [], implBad = 0, zeroDocs = [];
for (const k of head) {
  let docN = 0;
  for (const part of ["bar", "sheet"]) { const v = o[k][part]; if (!v) continue;
    implBad += v.badRings.length;
    for (const r of v.rings.map(parseRing)) { n++; docN++; if (r.ratio !== null && r.ratio < min) { min = r.ratio; minAt = `${k}:${part}:${r.t}`; } if (r.ratio === null || r.ratio < 3 || !OK.has(r.pair)) badQa.push(`${k}:${part}:${r.t}:${r.pair}:${r.ratio}`); } }
  if (docN === 0) zeroDocs.push(k);
}
P(n > 0 && badQa.length === 0 && implBad === 0 && zeroDocs.length === 0, `header 링(3변형 바·시트 + transparent 면 3, light·dark × base·alt × 3폭) 문서 ${head.length} · 링 ${n}건 · 바깥(부모) 면 대비 최소 ${min} @ ${minAt} · QA 재판정 위반 ${badQa.length} · 구현 판정 badRings ${implBad} · 링 0 문서 ${zeroDocs.length}${badQa.length ? " · " + badQa.slice(0, 5).join(" | ") : ""}`);
// focus-visible/outline 원시값은 rings 문자열에 없으므로 badRings(focus/fv/링 없음 포함)로 대조 — 0이면 모두 focused·fv·outline>0
// footer 실제
const fa = foot.reduce((s, k) => s + o[k].foot.anchors, 0), fr = foot.reduce((s, k) => s + o[k].foot.ringN, 0);
const audits = Object.keys(o).filter((k) => k.startsWith("qa-footer-audit-"));
const focAny = audits.reduce((s, k) => s + o[k].focusableAny.length + o[k].anchorsAll, 0), tabIn = audits.reduce((s, k) => s + o[k].tabInFooter, 0);
const exactMatch = audits.every((k) => o[k].liText.slice(0, 3).every((t) => o[k].headings.includes(t)) && o[k].liTags.every((t) => t === "TEXT"));
P(fa === 0 && fr === 0 && focAny === 0 && tabIn === 0 && exactMatch ? null : false, `footer 실제 링 — 설계상 포커스 대상 0(m2a SPEC 0.10 122행 · K1-7 463/468행 = 하단 링크는 전부 글자 항목). 매트릭스 ${foot.length}대상 실제 a ${fa} · 링 ${fr} · 감사 ${audits.length}건(4변형×3폭) 포커스 가능 요소(a/button/input/summary/[tabindex]/[href] 등) ${focAny} · Tab 순회 footer 진입 ${tabIn} · 본문 제목과 정확히 같은 글자 3개 포함해도 li = TEXT ${exactMatch}. → N/A(실제 링 PASS 아님) · 숨은 링크/결함 0`);
// 탐침
const pr = foot.reduce((s, k) => s + o[k].probe.ringN, 0), pb = foot.reduce((s, k) => s + o[k].probe.badRings.length, 0), pmin = Math.min(...foot.map((k) => o[k].probe.ringMin ?? 0));
P(pr === foot.length && pb === 0 && pmin >= 3, `(참고·운영 마크업 아님) footer 탐침 복제본 a 링 ${pr}건 · 위반 ${pb} · 최소 ${pmin} · 쌍 ${[...new Set(foot.flatMap((k) => o[k].probe.ringPairs))]}`);
// 부정 표본
const neg = (k, test, m) => { const v = o[k]; P(test(v), `부정 ${m}: badRings ${Array.isArray(v.badRings) ? v.badRings.length + "/" + v.ringN : JSON.stringify(v)} · ${JSON.stringify(v.badRings ?? v).slice(0, 160)}`); };
neg("neg-same-color", (v) => v.badRings.filter((b) => /bg\/bg:1 /.test(b)).length >= 3, "N1 같은 색 header(링 bg / 면 bg) → FAIL 검출");
neg("neg-same-color-footer-probe", (v) => v.ringN > 0 && v.badRings.length === v.ringN, "N1f 같은 색 footer 탐침(ink/ink) → FAIL 검출");
neg("neg-low-ratio", (v) => v.ringN > 0 && v.badRings.length === v.ringN && v.badRings.every((b) => /대비 1\.\d/.test(b)), "N2 저대비(역할 허용 ink/bg · 1.45) → FAIL 검출");
neg("qa-neg-no-outline", (v) => v.ringN > 0 && v.badRings.length === v.ringN && v.badRings.every((b) => b.includes("링 없음")), "QA N4 outline:none 주입 → '링 없음' FAIL 검출");
const u = o["qa-neg-unfocusable"]; P(u.rings.length > 0 && u.rings.every((r) => !r.focused && !r.fv), `부정 QA N5 href 제거(focus 불가) → focused ${u.rings.map((r) => r.focused)} · fv ${u.rings.map((r) => r.fv)} (ringBad 규칙상 'focus 실패')`);
P(o["cta-face-check"].length > 0 && o["cta-face-check"].every((r) => r.face === "bg" && r.own === "primary"), `CTA 자기 fill(primary)을 면으로 오인 안 함 — 판정 면 ${o["cta-face-check"].map((r) => r.face)} · own ${o["cta-face-check"].map((r) => r.own)}`);
for (const w of [1280, 768, 390]) { const p = o[`p3-${w}`];
  const ok = p.utilityItems.length > 0 && p.navSlotEmpty && p.sheets === 0 && p.buttons === 0 && p.navs === 0 && p.tierVisible && p.tier.bottom <= p.bar.y + 0.5 && p.domOrderTierFirst && p.overflowX === 0 && p.outside === 0;
  P(ok, `P3 two-tier nav 빈 값 + utility ${w}: utility ${p.utilityItems.join("·")} · 시트 ${p.sheets} · 버튼 ${p.buttons} · nav ${p.navs} · tier ${p.tier.y}~${p.tier.bottom} / bar ${p.bar.y}~${p.bar.bottom} · DOM tier→bar ${p.domOrderTierFirst} · 넘침 ${p.overflowX} · 밖 ${p.outside}`); }
const txt = L.join("\n"); writeFileSync(new URL("./logs/ring-qa-judge.txt", import.meta.url), txt + "\n"); console.log(txt);

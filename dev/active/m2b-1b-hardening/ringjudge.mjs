// qb-h.json → P2 링 · P3 판정 (logs/ring-judge.txt). 링 = 역할 허용 쌍 + 부모(바깥) 면 대비 ≥ 3 · 대상 0/측정 0/파싱 실패 = FAIL
import { readFileSync, writeFileSync } from "node:fs";
const o = JSON.parse(readFileSync(new URL("./logs/qb-h.json", import.meta.url)));
const L = [];
const keys = Object.keys(o).filter((k) => k.startsWith("ring-"));
const parts = keys.flatMap((k) => Object.entries(o[k]).filter(([p, v]) => p !== "probe" && v && typeof v === "object" && "ringN" in v).map(([p, v]) => [`${k}:${p}`, v]));
const bad = [], zero = [], textBad = [];
let ringN = 0, minRatio = 99, minAt = "";
const pairCount = {};
for (const [k, v] of parts) {
  ringN += v.ringN;
  if (v.ringN === 0) zero.push(k);
  if (v.ringMin !== null && v.ringMin < minRatio) { minRatio = v.ringMin; minAt = k; }
  for (const p of v.ringPairs) pairCount[p] = (pairCount[p] ?? 0) + 1;
  for (const b of v.badRings) bad.push(`${k} ${b}`);
  for (const b of v.bad) textBad.push(`${k} ${JSON.stringify(b)}`);
}
// footer 실제 링크: SPEC상 하단 링크 = 글자 항목(MQ-2) → a 0이면 "미판정(BLOCKED)" — PASS 아님. 탐침(probe) 링은 별도 줄
const foot = keys.filter((k) => /-(biz-extended|biz-extended-map|minimal|minimal-biz)-\d+$/.test(k)).map((k) => [k, o[k]]);
const footReal = foot.reduce((n, [, v]) => n + v.foot.anchors, 0), footRealRing = foot.reduce((n, [, v]) => n + v.foot.ringN, 0);
const probeBad = foot.flatMap(([k, v]) => (v.probe.ringN > 0 ? v.probe.badRings : ["탐침 링 0"]).map((b) => `${k} ${b}`));
const probeMin = Math.min(...foot.map(([, v]) => v.probe.ringMin ?? 0));
const probePairs = [...new Set(foot.flatMap(([, v]) => v.probe.ringPairs))];
// 바 측정 0은 hamburger 등 링크 없는 바가 있을 수 있으므로 문서 단위로: 각 header 키에서 bar+sheet 링 합 > 0
const headBad = keys.filter((k) => !/-(biz-extended|biz-extended-map|minimal|minimal-biz)-\d+$/.test(k)).filter((k) => (o[k].bar?.ringN ?? 0) + (o[k].sheet?.ringN ?? 0) === 0);
L.push(`링 매트릭스: 키 ${keys.length}(header ${keys.length - foot.length} · footer ${foot.length}) · 측정 부분 ${parts.length} · 링 측정 ${ringN}건 · 최소 대비 ${minRatio} (${minAt}) · 역할 쌍 ${JSON.stringify(pairCount)}`);
L.push(`${footReal > 0 && footRealRing > 0 ? "PASS" : "미판정(BLOCKED)"} footer 실제 링크 링 — ${foot.length}개 대상(footer 4 × 3폭 × light·dark × base·alt) 실제 a 합 ${footReal} · 링 측정 합 ${footRealRing} · links 항목 태그 ${JSON.stringify(foot[0][1].linkTags)} (본문 제목과 같은 글자를 넣어도 글자 항목 — m2a SPEC 122·463 MQ-2)`);
L.push(`${probeBad.length ? "FAIL" : "PASS"} footer 탐침(판정 페이지 주입 a, 운영 마크업 아님) 링 — ${foot.length}개 대상 링 ${foot.reduce((n, [, v]) => n + v.probe.ringN, 0)}건 · 최소 대비 ${probeMin} · 쌍 ${JSON.stringify(probePairs)}${probeBad.length ? " · " + probeBad.slice(0, 6).join(" | ") : ""}`);
L.push(`header 링 0 문서: ${headBad.length} ${headBad.join(", ")}`);
L.push(`측정 0 부분(참고 — 링크 없는 바 등): ${zero.length} ${zero.slice(0, 8).join(", ")}`);
L.push(`${bad.length || headBad.length ? "FAIL" : "PASS"} P2 링(header 4 바·시트 · transparent 면 3) — 허용 밖·대비<3·focus/링 실패 ${bad.length}건${bad.length ? ": " + bad.slice(0, 10).join(" | ") : ""}`);
L.push(`${textBad.length ? "FAIL" : "PASS"} (참고) 글자 대비 4.5·역할 — 위반 ${textBad.length}건${textBad.length ? ": " + textBad.slice(0, 5).join(" | ") : ""}`);
// 부정 표본 — 기대 FAIL
const n1 = o["neg-same-color"], n1f = o["neg-same-color-footer-probe"], n2 = o["neg-low-ratio"];
const n1ok = n1.rings.filter((r) => !n1.badRings.some((b) => b.startsWith(r.split(":")[0] + ":")));
L.push(`${n1.badRings.length > 0 && n1.badRings.every((b) => b.includes("역할 밖 bg/bg") && b.includes("대비 1")) && n1ok.every((r) => r.includes(":ink/bg:")) ? "PASS" : "FAIL"} 부정 표본 N1 같은 색(header 면 bg + 링 bg) → 판정기 FAIL ${n1.badRings.length}/${n1.ringN} (남은 ${n1ok.join(",")} = 자기 --kit-ring ink를 가진 CTA, 정상): ${n1.badRings.slice(0, 2).join(" | ")}`);
L.push(`${n1f.ringN > 0 && n1f.badRings.length === n1f.ringN ? "PASS" : "FAIL"} 부정 표본 N1f 같은 색(footer 면 ink + 탐침 링 ink) → 판정기 FAIL ${n1f.badRings.length}/${n1f.ringN}: ${n1f.badRings.slice(0, 2).join(" | ")}`);
L.push(`${n2.badRings.length > 0 && n2.badRings.every((b) => b.includes("대비") && !b.includes("역할 밖")) ? "PASS" : "FAIL"} 부정 표본 N2 역할 허용(ink/bg)·수치<3 → 판정기 FAIL ${n2.badRings.length}/${n2.ringN}: ${n2.badRings.slice(0, 2).join(" | ")}`);
L.push(`CTA 면 대조(N3): 자기 fill primary인 링크 ${o["cta-face-check"].length}건 → 판정 면 ${[...new Set(o["cta-face-check"].map((r) => r.face))]} (1b 방식이면 ink/primary로 기록)`);
// P3
const W3 = [1280, 768, 390];
for (const w of W3) {
  const p = o[`p3-${w}`];
  const ok = p.utilityItems.length > 0 && p.navSlotEmpty && p.sheets === 0 && p.buttons === 0 && p.navs === 0 && p.tierVisible && p.dataAlways && p.tierAboveBar && p.domOrderTierFirst && p.overflowX === 0 && p.outside === 0;
  L.push(`${ok ? "PASS" : "FAIL"} P3 ${w} — utility ${p.utilityItems.length}(${p.utilityItems.join("·")}) · 시트 ${p.sheets} · 버튼 ${p.buttons} · nav ${p.navs} · 보조 줄 보임 ${p.tierVisible}(data-always ${p.dataAlways}) · tier y${p.tier.y}~${p.tier.bottom} ≤ bar y${p.bar.y} ${p.tierAboveBar} · DOM tier→bar ${p.domOrderTierFirst} · 넘침 ${p.overflowX} · 밖 요소 ${p.outside}`);
}
L.push(`P3 캡처: ${o["p3-shot"]}${o["p3-shot-try1"] ? ` (try1 ${o["p3-shot-try1"]}${o["p3-shot-try2"] ? ` · try2 ${o["p3-shot-try2"]}` : ""})` : ""}`);
const txt = L.join("\n");
console.log(txt);
writeFileSync(new URL("./logs/ring-judge.txt", import.meta.url), txt + "\n");

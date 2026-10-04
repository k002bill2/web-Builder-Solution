// qb-b.json → KB-AC [B] 판정 (logs/qb-judge.txt)
import { readFileSync } from "node:fs";
const o = JSON.parse(readFileSync(new URL("./logs/qb-b.json", import.meta.url)));
const W3 = [1280, 768, 390];
const lines = [];
const verdict = (id, ok, note) => lines.push(`${ok ? "PASS" : "FAIL"} ${id} — ${note}`);
const all = (xs) => xs.every(Boolean);

// KB-AC-01 hamburger
const hb = W3.map((w) => o[`hstate-sticky-hamburger-${w}`]);
verdict("KB-AC-01", all(hb.map((s) => s.closed.btnVisible && s.closed.barNav === 0 && s.closed.navVisible === 0 && s.open?.isOpen && s.open.navVisible === 1)),
  hb.map((s, i) => `${W3[i]} 버튼 ${s.closed.btnVisible} · 바 nav ${s.closed.barNav} · 닫힘 nav ${s.closed.navVisible} → 열림 ${s.open?.isOpen} nav ${s.open?.navVisible}`).join(" / "));
// KB-AC-02
const [h1280, h768, h390] = hb;
verdict("KB-AC-02", Math.abs(h1280.open.rect.right - h1280.open.vw) < 0.6 && h1280.open.rect.w < h1280.open.vw / 2 && Math.abs(h390.open.rect.w - h390.open.vw) < 0.6,
  `1280 right ${h1280.open.rect.right}/${h1280.open.vw} · 폭 ${h1280.open.rect.w}(4/12=${(h1280.open.vw * 4 / 12).toFixed(1)}) · 768 폭 ${h768.open.rect.w}(6/12=${(h768.open.vw / 2).toFixed(1)}) right ${h768.open.rect.right} · 390 폭 ${h390.open.rect.w}/${h390.open.vw}`);
// KB-AC-04 two-tier
const tt = W3.map((w) => o[`hstate-sticky-two-tier-${w}`]);
const [t1280, t768, t390] = tt;
verdict("KB-AC-04", t1280.closed.tierVisible && t1280.closed.barNavVisible && t1280.closed.btnDisplay === "none" && t768.closed.tierVisible && t768.closed.btnVisible && !t390.closed.tierVisible && t390.open?.visibleChildren.join(",") === "BUTTON,NAV>nav,HR,UL[utility]" && all(tt.map((s) => s.closed.navVisible <= 1 && (!s.open || s.open.navVisible <= 1))),
  `1280 보조 줄 ${t1280.closed.tierVisible} · 바 nav ${t1280.closed.barNavVisible} · 버튼 ${t1280.closed.btnDisplay} / 768 보조 줄 ${t768.closed.tierVisible} · 버튼 ${t768.closed.btnVisible} · 시트 ${t768.open?.visibleChildren} / 390 보조 줄 ${t390.closed.tierVisible} · 시트 ${t390.open?.visibleChildren} · nav 보임 최대 ${Math.max(...tt.flatMap((s) => [s.closed.navVisible, s.open?.navVisible ?? 0]))}`);
// KB-AC-06
const anc = [1280, 390].flatMap((w) => o[`anchors-sticky-two-tier-${w}`]);
verdict("KB-AC-06", anc.every((a) => a.ok), `two-tier 390·1280 × 본문 4 제목 위 끝 ≥ header 아래 끝 — 최소 여유 ${Math.min(...anc.map((a) => a.h2Top - a.headerBottom)).toFixed(1)} · scroll-margin-top ${anc[0].smt} (sticky-right-cta ${o["smt-right-cta"]}) · hamburger도 ${[1280, 768, 390].flatMap((w) => o[`anchors-sticky-hamburger-${w}`]).every((a) => a.ok)}`);
// KB-AC-08
const cl = ["center", "fullbleed", "split-alt", "split-base", "none"].flatMap((k) => W3.map((w) => [k, w, o[`clear-${k}-${w}`]]));
verdict("KB-AC-08", cl.every(([, , c]) => !["sticky", "fixed", "absolute"].includes(c.position) && c.overlap === 0),
  `position ${[...new Set(cl.map(([, , c]) => c.position))]} · 겹침 최대 ${Math.max(...cl.map(([, , c]) => c.overlap))} (5문서 × 3폭) · 면 이음(header 배경 = 다음 섹션 배경): ${cl.filter(([k]) => k !== "fullbleed" && k !== "none").every(([, , c]) => c.bg === c.nextBg)} · 구분선 none만 ${cl.filter(([, , c]) => c.borderBottom !== "0px none").map(([k]) => k).filter((v, i, a) => a.indexOf(v) === i)}`);
// KB-AC-09 · 34 colors
const colorKeys = Object.keys(o).filter((k) => k.startsWith("colors-") || k.startsWith("qb13-"));
const bad = [];
let minR = 99, n = 0;
for (const k of colorKeys) {
  const v = o[k];
  for (const part of [v.bar, v.sheet, v.rows ? v : null, v.n !== undefined ? v : null].filter(Boolean)) {
    if (part.bad?.length) bad.push(`${k}: ${JSON.stringify(part.bad)}`);
    if (part.badRings?.length) bad.push(`${k} ring: ${part.badRings}`);
    if (Number.isFinite(part.min)) minR = Math.min(minR, part.min);
    n += part.n ?? 0;
  }
}
const clearBars = Object.keys(o).filter((k) => /colors-.*-transparent-/.test(k));
const face = clearBars.map((k) => [k, o[k].surface, o[k].bar.pairs.join("|"), o[k].sheet?.pairs.join("|") ?? "-"]);
const faceOk = face.every(([k, s, bar, sheet]) => (s === "primary" ? bar === "on-primary/primary" : bar === `ink/${s}`) && (sheet === "-" || sheet === "ink/bg"));
verdict("KB-AC-09", faceOk, `transparent 면 3종 × 프로필 2 × 톤 2 × 3폭: 바 글자 쌍 = 면 primary → on-primary/primary · surface → ink/surface · bg → ink/bg / 열린 시트(768·390) = ink/bg만 · 링 ${[...new Set(clearBars.flatMap((k) => [...o[k].bar.rings, ...(o[k].sheet?.rings ?? [])].map((r) => r.split(":")[1])))]}`);
verdict("KB-AC-34", bad.length === 0, `${colorKeys.filter((k) => k.startsWith("colors-")).length}개 측정(프로필 light·dark × 톤 base·alt × header 3(transparent 면 3) × 폭 · footer 3 × 1280·390) 글자 ${n}개 허용 밖 쌍 0 · 최소 대비 ${minR}${bad.length ? " · " + bad.slice(0, 5).join(" ; ") : ""}`);
// KB-AC-24·25
const m1280 = o["map-1280"], m768 = o["map-768"], m390 = o["map-390"];
const sameRow = (a, b) => a.y < b.bottom && b.y < a.bottom;
verdict("KB-AC-24", sameRow(m1280.address, m1280.figure) && m390.address.y < m390.links.y && m390.links.y < m390.figure.y && m390.figure.y < m390.copy.y,
  `1280 글 칸 x ${m1280.address.x} · 지도 칸 x ${m1280.figure.x} 폭 ${m1280.figure.w} 같은 행 · 768 지도 폭 ${m768.figure.w} · 390 y 사업자정보 ${m390.address.y} → 링크 ${m390.links.y} → 지도 ${m390.figure.y} → 저작권 ${m390.copy.y} · 지도 경계 ${m1280.mapBorder.borderTopWidth} ${m1280.mapBorder.borderTopColor}`);
const off = o["map-off-1280"];
verdict("KB-AC-25", off.figure === null && sameRow(off.address, off.links), `map 꺼짐 1280 figure 0 · 사업자정보 y ${off.address.y} · 링크 y ${off.links.y} 같은 행(x ${off.address.x} / ${off.links.x})`);
// KB-AC-26 · 29
const mn = W3.map((w) => o[`min-minimal-${w}`]), mb = W3.map((w) => o[`min-minimal-biz-${w}`]);
const P = JSON.parse('{"bg":"rgb(252, 251, 248)","ink":"rgb(26, 26, 26)","muted":"rgb(110, 110, 110)"}');
verdict("KB-AC-26", mn.every((m) => m.root.backgroundColor === P.bg && m.root.borderTopStyle === "solid" && m.root.borderTopColor === P.muted && m.ul.color === P.ink && m.lead.color === P.muted),
  `3폭 면 bg · 위 경계 ${mn[0].root.borderTopWidth} solid muted · 링크 ink · 저작권 muted`);
const keyOf = (m) => JSON.stringify([m.root.backgroundColor, m.root.borderTopWidth, m.root.borderTopStyle, m.root.borderTopColor, m.ul, m.line]);
verdict("KB-AC-29", W3.every((w, i) => keyOf(mn[i]) === keyOf(mb[i])) && mb.every((m) => m.lead.color === P.ink),
  `minimal ↔ minimal-biz 3폭 루트 background·border-top · 링크 목록 계산 스타일 · 래퍼 배치 같음 · 사업자정보 ink`);
// KB-AC-31
const longs = Object.keys(o).filter((k) => k.startsWith("long200-"));
const lbad = longs.flatMap((k) => W3.map((w) => [k, w, o[k][w]]).filter(([, , r]) => r.closed.overflowX > 0 || r.closed.wider.length || r.closed.ellipsis || (r.open && (r.open.widerInSheet || r.open.sheetRight > r.open.vw + 0.5))));
verdict("KB-AC-31", lbad.length === 0, `6변형 상한 글자 + 200% × 3폭(header는 열린 시트 포함) 가로 넘침 0 · 밖 요소 0 · 말줄임 0${lbad.length ? " · " + JSON.stringify(lbad) : ""}`);
// KB-AC-35
const st = Object.keys(o).filter((k) => k.startsWith("static-"));
verdict("KB-AC-35", st.every((k) => o[k].same && o[k].anchorsOk && o[k].scripts === 1), `${st.length}건(10문서 × 3폭) 정적 HTML 계산 스타일 = 캔버스(header position·면·글자·버튼·보조 줄·scroll-margin-top · footer 면·경계·배치·지도 칸) · 앵커 이동 뒤 제목이 header 아래 · script 1`);
// QB-13
const q13 = Object.keys(o).filter((k) => k.startsWith("qb13-"));
verdict("QB-13", q13.every((k) => !o[k].bar.bad.length && (!o[k].sheet || !o[k].sheet.bad.length) && o[k].overflowX === 0), `bright 프로필 6변형 × 1280·390 허용 밖 쌍 0 · 넘침 0 (게이트 통과: ${o["gate-profiles"].bright.every((c) => c[2])})`);
// QB-14 (qb14.mjs → logs/qb14.json)
const q14 = JSON.parse(readFileSync(new URL("./logs/qb14.json", import.meta.url)));
const q14r = Object.entries(q14).filter(([, r]) => r.button);
verdict("QB-14", q14r.length === 7 && q14r.every(([, r]) => r.ok) && Object.values(q14).every((r) => r.scripts === 1), `정적 HTML 3 header × 3폭(버튼 보이는 ${q14r.length}건): 실제 클릭 → 시트 열림(popovertarget) · Esc → 닫힘 · 시트 안 앵커 → 닫힘·hash 이동 · script 1 / 버튼 숨김 ${Object.keys(q14).filter((k) => !q14[k].button)}`);
console.log(lines.join("\n"));

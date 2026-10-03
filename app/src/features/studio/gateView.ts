/**
 * 게이트 표시 문장 (DS-2A-05 5.12 · 5.13 · m2a 3.2 A) — 진입 직후 첫 화면 코드. 계산(`runGate`)은 엔진 청크(gateCheck), 여기는 결과를 글자로만 바꾼다.
 * 상태 단어(Q14)는 8줄 모두 — 성능 예산도 "측정 전". 머리 Tag = 차단·경고 개수 글자.
 */
import type { PageDoc, SectionInstance } from "../../engine/contracts/pageDoc";
import type { GateReport, GateRow, GateRowId } from "../../engine/contracts/records";
import { RENDERED_VARIANTS } from "./renderedVariants";
import { sectionName } from "./selection";

export const GATE_ROW_NAMES: Readonly<Record<GateRowId, string>> = Object.freeze({
  contrast: "대비 AA",
  "alt-text": "대체텍스트",
  "heading-order": "헤딩 순서",
  "required-sections": "필수 섹션",
  "motion-budget": "모션 예산",
  "seo-meta": "SEO 메타",
  "text-length": "글자 수",
  performance: "성능 예산",
});

const countOf = (rows: readonly GateRow[], severity: "block" | "warn") => rows.reduce((n, r) => n + r.issues.filter((i) => i.severity === severity).length, 0);

export interface GateCounts {
  readonly block: number;
  readonly warn: number;
}
export const gateCounts = (report: GateReport): GateCounts => ({ block: countOf(report.rows, "block"), warn: countOf(report.rows, "warn") });

/** 머리 Tag — "차단 1 · 경고 1" · "경고 2" · "통과" */
export function gateHeadText({ block, warn }: GateCounts): string {
  if (block + warn === 0) return "통과";
  return [block > 0 && `차단 ${block}`, warn > 0 && `경고 ${warn}`].filter(Boolean).join(" · ");
}

/** 줄 상태 단어 — "통과" / "경고 1" / "차단 1" / "측정 전"(성능 예산, Q13) */
export function gateRowWord(row: GateRow): string {
  if (row.state === "unmeasured") return "측정 전";
  if (row.state === "pass") return "통과";
  const severity = row.state;
  return `${severity === "block" ? "차단" : "경고"} ${row.issues.filter((i) => i.severity === severity).length}`;
}

/** 첫 차단 줄 — 내보내기 이유·"첫 차단으로 이동"·툴바 요약이 같이 쓴다 */
export const firstBlockRow = (report: GateReport): GateRow | undefined => report.rows.find((r) => r.state === "block");

/** 5.13 · B-09 "차단 1건(SEO 메타: 설명 없음) — 고치면 열립니다" — n = 차단 이슈 전체 개수, 괄호 = 첫 차단 줄 이름 + 그 줄 첫 차단 원인 */
export function gateBlockReason(report: GateReport): string | undefined {
  const row = firstBlockRow(report);
  const cause = row?.issues.find((i) => i.severity === "block")?.cause;
  if (!row || cause === undefined) return undefined;
  return `차단 ${gateCounts(report).block}건(${GATE_ROW_NAMES[row.id]}: ${cause}) — 고치면 열립니다`;
}

/** 렌더러 없는 섹션(폴백, m2a 3.2 · 8.3.2 7단계와 같은 판정) — 문서 순서 */
export const fallbackSections = (doc: PageDoc): readonly SectionInstance[] => doc.sections.filter((s) => !RENDERED_VARIANTS.includes(`${s.type}/${s.variant}`));

/** m2a 3.2 A "구조 미리보기 섹션 {N}개({이름 목록})가 있어 내보낼 수 없습니다 — …" — 이름 3개까지 + "외 {k}개" */
export function fallbackReason(sections: readonly SectionInstance[]): string | undefined {
  if (sections.length === 0) return undefined;
  const names = sections.slice(0, 3).map(sectionName).join(" · ");
  const more = sections.length > 3 ? ` 외 ${sections.length - 3}개` : "";
  return `구조 미리보기 섹션 ${sections.length}개(${names}${more})가 있어 내보낼 수 없습니다 — 실제 렌더가 있는 변형으로 바꾸거나 지우면 열립니다`;
}

/** 툴바 "검사 · 내보내기" 요약 알림(E-S26) — 차단 있음 → 첫 차단 줄 안내 · 없음 → 내보내기 버튼으로 */
export function gateSummaryNotice(report: GateReport): string {
  const counts = gateCounts(report);
  const row = firstBlockRow(report);
  if (row) return `품질 게이트 ${gateHeadText(counts)} — 첫 차단: ${GATE_ROW_NAMES[row.id]}`;
  return `품질 게이트 ${gateHeadText(counts)} — 내보내기 버튼으로 이동합니다`;
}

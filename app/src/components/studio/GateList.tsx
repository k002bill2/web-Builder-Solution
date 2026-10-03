import type { GateReport, GateRow } from "../../engine/contracts/records";
import { GATE_ROW_NAMES, gateCounts, gateHeadText, gateRowWord } from "../../features/studio/gateView";

/** 점(장식, Q14 — 모든 줄에 상태 단어가 있으므로 `aria-hidden`) */
const DOT: Readonly<Record<GateRow["state"], string>> = {
  pass: "bg-status-positive",
  warn: "bg-status-cautionary",
  block: "bg-status-negative",
  unmeasured: "bg-line-strong",
};
const CAPTION = "ds-caption1 text-label-alternative";
/** 머리 Tag 톤(상태 글자 별칭, B-17) — ds `Tag`를 import하면 공통 청크가 다시 나뉘어 다른 화면 첫 화면이 +0.09KB(실측) → 같은 모양 글자 */
const HEAD_TONE = { block: "bg-accent-red-bg text-accent-red", warn: "bg-accent-orange-bg text-accent-orange", pass: "bg-accent-green-bg text-accent-green" } as const;

/** 줄 한 줄 원인 — 문제 줄은 첫 이슈 원인, 성능 예산은 "생성기 연결 후 측정합니다"(5.12 표) */
const rowCause = (row: GateRow) => row.issues[0]?.cause ?? (row.state === "unmeasured" ? "생성기 연결 후 측정합니다" : undefined);

/**
 * 품질 게이트 8줄 (DS-2A-05 5.12 · E-S22~E-S25). 순서 = 결과 순서(GATE_ROWS 고정). 문제 줄은 `button` → 이동(E-S23), 통과·측정 전 줄은 글자만.
 * 펼치면(`details`) 건별 규칙 ID · 원인 · 대체안. 결과가 지금 문서 것이 아니면 목록 `aria-busy` + "편집 전 기준" 캡션(E-S25).
 */
export function GateList({
  report,
  stale,
  failed,
  onRow,
}: {
  readonly report: GateReport | undefined;
  readonly stale: boolean;
  readonly failed?: boolean;
  readonly onRow: (row: GateRow) => void;
}) {
  if (!report) return <p className={CAPTION}>{failed ? "검사하지 못했습니다" : "검사하는 중입니다"}</p>;
  const counts = gateCounts(report);
  const tone = HEAD_TONE[counts.block > 0 ? "block" : counts.warn > 0 ? "warn" : "pass"];
  return (
    <div className="flex flex-col gap-2">
      <span className={`ds-caption1 self-start rounded-sm px-2 py-0.5 font-semibold ${tone}`}>{gateHeadText(counts)}</span>
      {stale && <p className={CAPTION}>편집 전 기준 결과입니다 · 다시 검사하는 중</p>}
      <ul aria-label="검사 항목" aria-busy={stale || undefined} className="flex flex-col gap-1">
        {report.rows.map((row) => {
          const cause = rowCause(row);
          const label = (
            <>
              <span aria-hidden="true" className={`size-2 flex-none rounded-full ${DOT[row.state]}`} />
              <span className="ds-label flex-1">{GATE_ROW_NAMES[row.id]}</span>
              <span className="ds-caption1 text-label-neutral">{gateRowWord(row)}</span>
            </>
          );
          return (
            <li key={row.id} data-gate-row={row.id} className="flex flex-col">
              {row.issues.length > 0 ? (
                <button type="button" onClick={() => onRow(row)} className="flex min-h-8 items-center gap-2 rounded-sm px-2 text-left hover:bg-fill-normal">
                  {label}
                </button>
              ) : (
                <span className="flex min-h-8 items-center gap-2 px-2">{label}</span>
              )}
              {cause && <p className={`${CAPTION} px-2 ps-6`}>{cause}</p>}
              {row.issues.length > 0 && (
                <details className="px-2 ps-6">
                  <summary className="ds-caption1 cursor-pointer text-label-neutral">원인 · 대체안 {row.issues.length}건</summary>
                  <ul className="ds-caption1 flex flex-col gap-1 pt-1 text-label-neutral">
                    {row.issues.map((issue, n) => (
                      <li key={n}>
                        {issue.ruleId} · {issue.cause} · {issue.alternative}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

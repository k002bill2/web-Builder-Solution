/**
 * 3안 비교 표 (DS-2A-04 4.6) — ≥768만(<768은 카드가 같은 정보를 모두 가진다). 행 머리글 고정 + 가로 스크롤(보드 표 규칙).
 * A와 다른 값 칸에 캡션 "A와 다름"(색 외 단서, 5.4). 엔진 청크 전용.
 */
import type { CandidatePlan, GenerationJob } from "../../domain/generation";
import { heroText, scaleText } from "./CandidateCard";
import { GRID_LABELS } from "./generationText";

type Row = readonly [string, (plan: CandidatePlan, scale: number) => string];
const ROWS: readonly Row[] = [
  ["Hero", (p) => heroText(p.axes)],
  ["카드 그리드", (p) => GRID_LABELS[p.axes.grid]],
  ["제목 비율", (p, s) => scaleText(p, s)],
  ["섹션 수", (p) => `${p.sections.length}개`],
  ["모션 L2 섹션", (p) => `${p.sections.filter((s) => s.motion === "L2").length}개`],
  ["경고", (p) => `경고 ${p.lint.filter((l) => l.severity === "block").length}`],
  ["결과 해시", (p) => p.hash],
];
const CELL = "border-b border-line-alternative px-3 py-2 text-left align-top";

export function CandidateTable({ job, profileScale }: { readonly job: GenerationJob; readonly profileScale: number }) {
  const a = job.candidates[0]?.status === "succeeded" ? job.candidates[0].plan : undefined;
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="ds-body3 w-full border-collapse">
        <caption className="ds-label pb-2 text-left">3안 비교</caption>
        <thead>
          <tr>
            <th scope="col" className={`${CELL} sticky left-0 bg-background-normal`}>
              항목
            </th>
            {job.candidates.map((c) => (
              <th key={c.id} scope="col" className={CELL}>
                {c.id}안
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, value]) => (
            <tr key={label}>
              <th scope="row" className={`${CELL} sticky left-0 bg-background-normal font-semibold`}>
                {label}
              </th>
              {job.candidates.map((c) => {
                if (c.status !== "succeeded") return <td key={c.id} className={CELL}>{c.status === "failed" ? "만들지 못함" : "만드는 중"}</td>;
                const text = value(c.plan, profileScale);
                const differs = a !== undefined && c.id !== "A" && text !== value(a, profileScale);
                return (
                  <td key={c.id} className={`${CELL} ${label === "결과 해시" ? "ds-mono" : ""}`}>
                    {text}
                    {differs && <span className="ds-caption2 block text-label-alternative">A와 다름</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

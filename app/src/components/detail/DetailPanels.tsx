import type { ReactNode } from "react";
import type { DesignReference } from "../../domain/reference";
import type { PaletteRole, ReferenceDetail } from "../../domain/referenceDetail";
import { formatDate } from "../catalog/referenceDisplay";

interface DetailProps {
  readonly detail: ReferenceDetail;
}

/** 정보 패널 소제목 (목업 t-label 자리). */
const InfoHeading = ({ id, children }: { readonly id: string; readonly children: ReactNode }) => (
  <h2 id={id} className="ds-label mb-2 text-label-neutral">
    {children}
  </h2>
);

/** 섹션 구성 — 정보 패널 목록 (목업 2a-02). 순번은 label-alternative (A11Y-01 3절 #7). */
export function SectionsList({ detail }: DetailProps) {
  return (
    <div>
      <InfoHeading id="detail-sections-heading">섹션 구성 · {detail.sections.length}개</InfoHeading>
      <ol aria-label="섹션 구성" className="flex flex-col">
        {detail.sections.map((s, i) => (
          <li key={`${s.name}-${i}`} className="flex items-center gap-2.5 border-b border-line-neutral py-1.75">
            <span className="ds-caption1 w-4.5 flex-none tabular-nums text-label-alternative">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 text-body3 font-semibold">{s.name}</span>
            <span className="ds-caption1 text-label-alternative">{s.variant}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 견본 4칸 = 목업 순서(대표·면·글자·배경). muted는 대표색과 겹쳐 견본에서 뺀다. */
const SWATCH_ROLES: readonly PaletteRole[] = ["primary", "surface", "ink", "bg"];

/** 토큰 요약 — 견본 4칸 + hex 목록 + 한 줄 요약. 기존 TokensPanel의 간격·모션 값은 한 줄에 합친다 (SPEC 4.3). */
export function TokenSummary({ detail }: DetailProps) {
  const { typography: t, spacing } = detail;
  const swatches = SWATCH_ROLES.flatMap((role) => detail.palette.filter((c) => c.role === role));
  const hexes = swatches.map((c) => c.hex).join(" · ");
  const summary = [
    `${t.family} ${t.headingWeight}/${t.bodyWeight}`,
    `스케일 ${t.scale}`,
    spacing.grid,
    `섹션 간격 ${spacing.sectionGap}px`,
    detail.motionNote,
    `본문 대비 ${detail.bodyContrast}:1`,
  ].join(" · ");
  return (
    <div>
      <InfoHeading id="detail-tokens-heading">토큰 요약</InfoHeading>
      <div role="img" aria-label={`팔레트 ${hexes}`} className="flex gap-1.25">
        {swatches.map((c) => (
          <span
            key={c.role}
            className={`h-6.5 flex-1 rounded-[--spacing(1.5)] ${c.role === "bg" ? "border border-line-strong" : ""}`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      <p className="ds-caption2 mt-1.5 tabular-nums text-label-alternative">{hexes}</p>
      <p className="ds-caption1 mt-2 text-label-alternative">{summary}</p>
    </div>
  );
}

/** 모바일 구조 — 미리보기 폭 "모바일"일 때 와이어프레임 아래 (1a-02 모바일 탭 내용). */
export function MobileStructure({ detail }: DetailProps) {
  return (
    <section aria-labelledby="detail-mobile-heading">
      <h2 id="detail-mobile-heading" className="ds-heading2 mb-2.5">
        모바일 구조
      </h2>
      <ol className="flex flex-wrap gap-2">
        {detail.mobileFlow.map((m) => (
          <li key={m} className="rounded-full bg-background-normal px-2.5 py-1.5 text-caption1 font-medium">
            {m}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 점수 이력 — 아래 영역 (C-07). 현재 측정 1건을 보여준다 (이력 누적은 백엔드 이후). */
export function ScoreHistory({ reference, detail }: DetailProps & { readonly reference: DesignReference }) {
  const s = reference.scores;
  return (
    <section aria-labelledby="detail-history-heading">
      <h2 id="detail-history-heading" className="ds-heading2 mb-3">
        점수 이력
      </h2>
      <table className="w-full text-left text-body3">
        <thead className="ds-caption1 text-label-alternative">
          <tr className="border-b border-line-neutral">
            <th className="py-2 font-medium">측정일</th>
            <th className="py-2 font-medium">도구</th>
            <th className="py-2 font-medium">접근성</th>
            <th className="py-2 font-medium">성능</th>
          </tr>
        </thead>
        <tbody>
          {!("status" in s) ? (
            <tr className="border-b border-line-alternative">
              <td className="py-2.5">{formatDate(s.measuredAt)}</td>
              <td className="py-2.5">{detail.measuredWith}</td>
              <td className="py-2.5 font-semibold">{s.accessibility}</td>
              <td className="py-2.5 font-semibold">{s.performance}</td>
            </tr>
          ) : (
            <tr className="border-b border-line-alternative">
              <td colSpan={4} className="py-2.5">
                측정 기록 없음 · 접근성·성능 미측정
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="ds-caption1 mt-2 text-label-alternative">이전 측정 기록이 없습니다.</p>
    </section>
  );
}

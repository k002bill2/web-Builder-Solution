import type { ReactNode } from "react";
import type { DesignReference } from "../../domain/reference";
import type { ReferenceDetail } from "../../domain/referenceDetail";
import { MOTION_LABELS } from "../../fixtures/catalogFilters";
import { formatDate } from "../catalog/referenceDisplay";

interface PanelProps {
  readonly reference: DesignReference;
  readonly detail: ReferenceDetail;
}

const PanelHeading = ({ children }: { readonly children: ReactNode }) => (
  <h2 className="ds-heading1 mb-3">{children}</h2>
);

/** 섹션 구성 (목업 142~145행). */
export function SectionsPanel({ detail }: PanelProps) {
  return (
    <>
      <PanelHeading>섹션 구성 · {detail.sections.length}개</PanelHeading>
      <ol className="flex flex-wrap gap-2">
        {detail.sections.map((s, i) => (
          <li
            key={`${s.name}-${i}`}
            className="inline-flex items-center gap-2 rounded-md border border-line-normal px-3 py-2 text-body3 font-medium"
          >
            <span className="ds-caption2 text-label-assistive">{String(i + 1).padStart(2, "0")}</span>
            {s.name}
            <span className="ds-caption2 text-label-alternative">{s.variant}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

function TokenCard({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line-neutral p-4">
      <div className="ds-caption1 text-label-alternative">{label}</div>
      {children}
    </div>
  );
}

/** 토큰 요약 — 팔레트·폰트·간격/모션 (목업 146~151행). */
export function TokensPanel({ reference, detail }: PanelProps) {
  const { palette, typography: t, spacing } = detail;
  return (
    <>
      <PanelHeading>토큰 요약</PanelHeading>
      <div className="grid gap-3 sm:grid-cols-3">
        <TokenCard label="팔레트">
          <div role="img" aria-label={`팔레트 ${palette.map((c) => c.hex).join(" · ")}`} className="mt-2.5 flex gap-1.5">
            {palette.map((c) => (
              <span
                key={c.role}
                className={`h-8 flex-1 rounded-[--spacing(1.5)] ${c.role === "bg" ? "border border-line-normal" : ""}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <div className="ds-caption2 mt-2 text-label-alternative">
            대표 {reference.colorPalette.primary} · 본문 대비 {detail.bodyContrast}:1
          </div>
        </TokenCard>
        <TokenCard label="폰트">
          <div className="ds-title2 mt-2 tracking-(--tracking-tight)">{t.family}</div>
          <div className="ds-caption2 mt-1 text-label-alternative">
            제목 {t.headingWeight} / 본문 {t.bodyWeight} · 스케일 {t.scale}
          </div>
        </TokenCard>
        <TokenCard label="간격 · 모션">
          <div className="ds-title2 mt-2 tracking-(--tracking-tight)">
            {spacing.grid} · {MOTION_LABELS[reference.motionLevel]}
          </div>
          <div className="ds-caption2 mt-1 text-label-alternative">
            섹션 간격 {spacing.sectionGap}px · {detail.motionNote}
          </div>
        </TokenCard>
      </div>
    </>
  );
}

/** 모바일 구조 (목업 152~153행). */
export function MobilePanel({ detail }: PanelProps) {
  return (
    <>
      <PanelHeading>모바일 구조</PanelHeading>
      <ol className="flex flex-wrap gap-2.5">
        {detail.mobileFlow.map((m) => (
          <li key={m} className="rounded-full bg-fill-normal px-2.5 py-1.5 text-caption1 font-medium">
            {m}
          </li>
        ))}
      </ol>
    </>
  );
}

/** 점수 이력 — 목업은 탭 이름만 있다. 현재 측정 1건을 보여준다 (이력 누적은 백엔드 이후). */
export function ScoresPanel({ reference, detail }: PanelProps) {
  const s = reference.scores;
  return (
    <>
      <PanelHeading>점수 이력</PanelHeading>
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
          <tr className="border-b border-line-alternative">
            <td className="py-2.5">{formatDate(s.measuredAt)}</td>
            <td className="py-2.5">{detail.measuredWith}</td>
            <td className="py-2.5 font-semibold">{s.accessibility}</td>
            <td className="py-2.5 font-semibold">{s.performance}</td>
          </tr>
        </tbody>
      </table>
      <p className="ds-caption1 mt-2 text-label-assistive">이전 측정 기록이 없습니다.</p>
    </>
  );
}

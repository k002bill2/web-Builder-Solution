import { useId } from "react";
import type { DraftStatus } from "../../domain/compareBoard";
import type { ConfirmAvailability } from "../../domain/confirmGate";
import { confirmLabel } from "../../features/compare/draftLabels";
import { Button } from "../ds/Button";

/**
 * <1280 하단 고정 요약 바 (SPEC 5.2·5.3). 트레이 바와 같은 표면 토큰. 확정은 패널과 같은 조건(A-8)·같은 문구(D-V2F-01).
 * 확정 프로필에 조정이 있으면 개수만 "조정 N개"(DS-2A-04 10.0.2 Q7 — P-S25 캡션과 같은 개수, 판정·목록은 초안 패널)
 */
export function DraftSummaryBar({
  pickedCount,
  total,
  warningCount,
  status,
  canConfirm,
  confirming,
  onShowDraft,
  onConfirm,
  adjustmentCount = 0,
}: {
  readonly pickedCount: number;
  readonly total: number;
  readonly warningCount: number;
  readonly status: DraftStatus;
  readonly canConfirm: ConfirmAvailability;
  readonly confirming: boolean;
  readonly onShowDraft: () => void;
  readonly onConfirm: () => void;
  readonly adjustmentCount?: number;
}) {
  const reasonId = useId();
  const blocked = confirming || !canConfirm.ok;
  return (
    <section
      aria-label="초안 요약"
      className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 bg-surface-inverse px-4 py-3 text-on-surface-inverse shadow-4 md:-mx-7 md:px-7"
    >
      <p className="ds-label min-w-0 flex-1">
        초안 {pickedCount}/{total}
        {warningCount > 0 && ` · 경고 ${warningCount}`}
        {adjustmentCount > 0 && ` · 조정 ${adjustmentCount}개`}
      </p>
      <Button variant="secondary" size="sm" onClick={onShowDraft}>
        초안 보기
      </Button>
      <Button
        variant="primary"
        size="sm"
        aria-disabled={blocked || undefined}
        aria-busy={confirming || undefined}
        aria-describedby={!canConfirm.ok ? reasonId : undefined}
        onClick={onConfirm}
        className="aria-disabled:cursor-not-allowed aria-disabled:bg-inverse-fill-normal aria-disabled:text-inverse-label-disable"
      >
        {confirmLabel(status, confirming)}
      </Button>
      {!canConfirm.ok && (
        <span id={reasonId} className="sr-only">
          {canConfirm.reason}
        </span>
      )}
    </section>
  );
}

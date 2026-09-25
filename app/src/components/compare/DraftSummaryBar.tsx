import { useId } from "react";
import type { ConfirmAvailability } from "../../domain/confirmGate";
import { Button } from "../ds/Button";

/** <1280 하단 고정 요약 바 (SPEC 5.2·5.3). 트레이 바와 같은 표면 토큰. 확정은 패널과 같은 조건(A-8). */
export function DraftSummaryBar({
  pickedCount,
  total,
  warningCount,
  canConfirm,
  confirming,
  onShowDraft,
  onConfirm,
}: {
  readonly pickedCount: number;
  readonly total: number;
  readonly warningCount: number;
  readonly canConfirm: ConfirmAvailability;
  readonly confirming: boolean;
  readonly onShowDraft: () => void;
  readonly onConfirm: () => void;
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
        {confirming ? "확정 중…" : "프로필 확정"}
      </Button>
      {!canConfirm.ok && (
        <span id={reasonId} className="sr-only">
          {canConfirm.reason}
        </span>
      )}
    </section>
  );
}

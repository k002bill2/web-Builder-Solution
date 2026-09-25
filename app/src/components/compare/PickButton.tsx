import type { FocusEvent, KeyboardEvent, Ref } from "react";
import { cx } from "../ds/cx";
import { Icon } from "../ds/Icon";

/**
 * 표·아코디언 공통 선택 버튼 (SPEC 7.2 · A-2 · A-3). 네이티브 button[aria-pressed].
 * 접근 이름에 항목과 레퍼런스를 모두 넣는다 — 표 머리글 읽기에 기대지 않는다.
 * 선택 표시는 색만으로 하지 않는다: 체크 아이콘 + "선택됨" + 굵은 테두리 + 배경.
 */
export function PickButton({
  rowLabel,
  columnLabel,
  referenceTitle,
  pressed,
  onToggle,
  disabled = false,
  tabIndex,
  onKeyDown,
  onFocus,
  onBlur,
  ref,
}: {
  readonly rowLabel: string;
  readonly columnLabel: string;
  readonly referenceTitle: string;
  readonly pressed: boolean;
  readonly onToggle: () => void;
  /** 확정 중 등 — 포커스는 받되 누르지 않는다 */
  readonly disabled?: boolean;
  readonly tabIndex?: number;
  readonly onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: (event: FocusEvent<HTMLButtonElement>) => void;
  readonly ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      aria-disabled={disabled || undefined}
      aria-label={`${rowLabel}: ${columnLabel} ${referenceTitle}의 요소 선택`}
      tabIndex={tabIndex}
      onClick={() => {
        if (!disabled) onToggle();
      }}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cx(
        "inline-flex h-9 w-full items-center justify-center gap-1 rounded-sm px-3 text-caption1 select-none cursor-pointer",
        "transition-[background-color,border-color] duration-(--duration-fast) ease-standard",
        "focus-visible:outline-none focus-visible:shadow-(--focus-ring) aria-disabled:cursor-not-allowed",
        pressed
          ? "border-(length:--border-thick) border-primary bg-status-informative-bg font-bold text-label-strong"
          : "border border-line-normal bg-background-normal font-medium text-label-normal hover:bg-fill-normal",
      )}
    >
      {pressed ? (
        <>
          <Icon name="check" size={16} className="text-primary" />
          선택됨
        </>
      ) : (
        "이 요소 선택"
      )}
    </button>
  );
}

import type { Ref } from "react";
import type { ColumnStatus } from "../../domain/compareBoard";
import type { BoardColumnView } from "../../features/compare/boardView";
import { LICENSE_TONE } from "../catalog/referenceDisplay";
import { Button } from "../ds/Button";
import { Icon } from "../ds/Icon";
import { Tag } from "../ds/Tag";

const UNAVAILABLE_REASON: Readonly<Record<Exclude<ColumnStatus, "available">, string>> = Object.freeze({
  withdrawn: "라이선스가 바뀌어 더 이상 쓸 수 없습니다",
  missing: "찾을 수 없는 레퍼런스입니다",
});

/**
 * 비교 열 머리글 (SPEC 2.2 · S-08 · S-09 · S-18). 제목은 2줄 말줄임 + title에 전체.
 * 버튼 2개("전부 선택"·빼기)는 일반 Tab 순서(A-6). 회수·삭제된 열은 "사용 불가" + 사유, 전부 선택 없음.
 */
export function ColumnHeader({
  column,
  pickAllLabel,
  canPickAll,
  disabled = false,
  onRemove,
  onPickAll,
  removeRef,
}: {
  readonly column: BoardColumnView;
  readonly pickAllLabel: string;
  readonly canPickAll: boolean;
  readonly disabled?: boolean;
  readonly onRemove: () => void;
  readonly onPickAll: () => void;
  readonly removeRef?: Ref<HTMLButtonElement>;
}) {
  const unavailable = column.status !== "available";
  return (
    <div className="flex flex-col items-stretch gap-2 text-left font-normal">
      <div className="flex items-start gap-2">
        <span className="ds-caption1 inline-flex size-5.5 flex-none items-center justify-center rounded-xs bg-surface-inverse font-bold text-on-surface-inverse">
          {column.label}
        </span>
        <span title={column.title} className="ds-label line-clamp-2 min-w-0 flex-1 text-label-strong">
          {column.title}
        </span>
        <button
          ref={removeRef}
          type="button"
          data-remove-column={column.referenceId}
          aria-label={`${column.title} 비교에서 빼기`}
          aria-disabled={disabled || undefined}
          onClick={() => {
            if (!disabled) onRemove();
          }}
          className="inline-flex flex-none cursor-pointer rounded-full p-0.5 text-label-alternative hover:text-label-normal focus-visible:outline-none focus-visible:shadow-(--focus-ring)"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {column.swatch && <span aria-hidden="true" className="size-3 flex-none rounded-full" style={{ backgroundColor: column.swatch }} />}
        {column.industry && <span className="ds-caption1 text-label-alternative">{column.industry}</span>}
        {column.license && (
          <Tag size="sm" tone={LICENSE_TONE[column.license]}>
            {column.license}
          </Tag>
        )}
        {unavailable && (
          <Tag size="sm" tone="red">
            사용 불가
          </Tag>
        )}
      </div>
      {unavailable ? (
        <p className="ds-caption1 text-label-neutral">{UNAVAILABLE_REASON[column.status as keyof typeof UNAVAILABLE_REASON]}</p>
      ) : (
        canPickAll && (
          <Button variant="outline" size="sm" aria-disabled={disabled || undefined} onClick={() => !disabled && onPickAll()}>
            {pickAllLabel}
          </Button>
        )
      )}
    </div>
  );
}

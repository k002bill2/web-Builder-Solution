import { useEffect, useRef } from "react";
import type { DesignReference } from "../../domain/reference";
import { COMPARE_LIMIT } from "../../features/compare/compareTray";
import { Button } from "../ds/Button";
import { Icon } from "../ds/Icon";

/** 제거 후 포커스 대상: 다음 칩 → 이전 칩 → (마지막 하나였으면) 트레이 영역 (QA-1A-01 D07). */
const TRAY_REGION = Symbol("tray-region");
type FocusTarget = string | typeof TRAY_REGION;

function focusTargetAfterRemoving(references: readonly DesignReference[], index: number): FocusTarget {
  return (references[index + 1] ?? references[index - 1])?.id ?? TRAY_REGION;
}

/** 하단 고정 비교 트레이 (목업 117~123행). */
export function CompareTrayBar({
  references,
  notice,
  onRemove,
  onOpen,
}: {
  readonly references: readonly DesignReference[];
  readonly notice: string | null;
  readonly onRemove: (id: string) => void;
  readonly onOpen: () => void;
}) {
  const region = useRef<HTMLElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<FocusTarget | null>(null);

  // 제거가 반영된(칩이 사라진) 뒤에 포커스를 옮긴다
  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    (target === TRAY_REGION ? region.current : removeButtons.current.get(target))?.focus();
  }, [references]);

  const removeAt = (index: number, id: string) => {
    pendingFocus.current = focusTargetAfterRemoving(references, index);
    onRemove(id);
  };

  return (
    <section
      ref={region}
      aria-label="비교 트레이"
      tabIndex={-1}
      className={
        "sticky bottom-5 z-10 mx-4 mb-5 -mt-18 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg " +
        "bg-surface-inverse py-3 pr-3 pl-5 text-on-surface-inverse shadow-4 md:mx-7 " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      }
    >
      <span className="ds-label flex-none">
        비교 보드 <span className="text-blue-70">{references.length}</span> / {COMPARE_LIMIT}
      </span>
      {references.length > 0 ? (
        <ul className="hidden min-w-0 flex-1 flex-wrap gap-2 md:flex">
          {references.map((r, i) => (
            <li
              key={r.id}
              className="inline-flex items-center gap-2 rounded-full bg-on-surface-inverse/10 py-1.5 pr-2 pl-2.5 text-caption1 font-medium"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: r.colorPalette.primary }} />
              {r.title}
              <button
                ref={(el) => {
                  if (el) removeButtons.current.set(r.id, el);
                  else removeButtons.current.delete(r.id);
                }}
                type="button"
                aria-label={`${r.title} 비교에서 제거`}
                onClick={() => removeAt(i, r.id)}
                className="inline-flex cursor-pointer rounded-full opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:shadow-(--focus-ring)"
              >
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <span className="ds-caption1 hidden min-w-0 flex-1 opacity-70 md:inline">
          카드의 ‘비교 추가’로 최대 {COMPARE_LIMIT}개까지 담을 수 있습니다
        </span>
      )}
      <Button variant="primary" size="md" trailingIcon="arrow-right" onClick={onOpen} className="ml-auto">
        비교 보드 열기
      </Button>
      <p role="status" className="ds-caption1 w-full empty:hidden">
        {notice}
      </p>
    </section>
  );
}

import { useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { cx } from "./cx";
import { rovingTargetIndex } from "./rovingFocus";

export interface TabItem<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
}

/**
 * 목업 번들 Tabs — 밑줄 탭 바 (제어 컴포넌트).
 * APG tablist 수동 활성화: Tab 정지점은 하나, ←/→·Home/End는 포커스만 옮기고 Enter·Space(클릭)로 선택한다.
 * 선택이 URL 이동을 일으키므로 방향키마다 history가 쌓이지 않게 자동 활성화를 쓰지 않는다.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  readonly items: readonly TabItem<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly label: string;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  /** 방향키로 옮겨 간 탭. 목록 밖으로 포커스가 나가면 선택된 탭이 다시 Tab 정지점이 된다. */
  const [focused, setFocused] = useState<number | null>(null);
  const selected = items.findIndex((it) => it.value === value);
  const tabStop = focused ?? (selected >= 0 ? selected : 0);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = rovingTargetIndex(event.key, index, items.length);
    if (target === null) return;
    event.preventDefault();
    setFocused(target);
    buttons.current[target]?.focus();
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
  };

  return (
    <div role="tablist" aria-label={label} onBlur={onBlur} className="flex gap-6 border-b border-line-neutral">
      {items.map((it, i) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => {
              setFocused(null);
              onChange(it.value);
            }}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              "relative cursor-pointer whitespace-nowrap py-3 text-body1 leading-(--line-height-heading2) font-semibold",
              "transition-colors duration-(--duration-fast) ease-standard hover:text-label-normal",
              "focus-visible:outline-none focus-visible:shadow-(--focus-ring)",
              active
                ? "text-label-normal after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-xs after:bg-label-normal"
                : "text-label-alternative",
            )}
          >
            {it.label}
            {it.count != null && (
              <span className={cx("ml-1 font-medium", active ? "text-primary" : "text-label-assistive")}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

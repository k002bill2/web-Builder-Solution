import { useId, useRef, type KeyboardEvent } from "react";
import { cx } from "./cx";
import { rovingTargetIndex } from "./rovingFocus";

export interface SegmentOption<T extends string> {
  readonly value: T;
  readonly label: string;
  /** 고를 수 없는 옵션(테마 허용 범위 밖 등) — aria-disabled, roving에서 건너뛴다. 이유는 그룹 설명(`description`)에 둔다 */
  readonly disabled?: boolean;
}

/** 방향키·Home/End 목적지 — 비활성 옵션은 건너뛴다(APG radio group). Home·End가 비활성이면 안쪽으로. 모두 비활성이면 null */
function enabledTarget(key: string, index: number, options: readonly { readonly disabled?: boolean }[]): number | null {
  const walk = key === "Home" ? "ArrowRight" : key === "End" ? "ArrowLeft" : key;
  let target = rovingTargetIndex(key, index, options.length);
  for (let step = 0; target !== null && step < options.length; step += 1) {
    if (!options[target]?.disabled) return target;
    target = rovingTargetIndex(walk, target, options.length);
  }
  return null;
}

/**
 * 목업 번들 SegmentedControl — 상호 배타 선택. 필터 용도라 radiogroup 시맨틱을 쓴다.
 * roving tabindex: Tab 정지점은 선택된 항목 하나, 방향키·Home/End로 이동하면서 선택한다 (APG radio group).
 * 비활성 옵션(DS-2A-04 3.4): 포커스를 받지 않으므로 이유는 그룹 아래 설명 캡션(`aria-describedby`)으로 알린다.
 * 선택값이 비활성이면 Tab 정지점은 첫 활성 옵션, 모두 비활성이면 선택값(그룹 aria-disabled — 포커스로 이유를 듣게).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  fullWidth = false,
  description,
}: {
  readonly options: readonly SegmentOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly label: string;
  readonly size?: "sm" | "md";
  readonly fullWidth?: boolean;
  /** 그룹 설명 캡션 — 비활성 옵션의 이유 등 */
  readonly description?: string;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const descriptionId = useId();
  const selected = options.findIndex((o) => o.value === value);
  const firstEnabled = options.findIndex((o) => !o.disabled);
  const allDisabled = options.length > 0 && firstEnabled < 0;
  const tabStop = selected >= 0 && !options[selected]?.disabled ? selected : firstEnabled >= 0 ? firstEnabled : Math.max(selected, 0);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (rovingTargetIndex(event.key, index, options.length) === null) return;
    event.preventDefault();
    const target = enabledTarget(event.key, index, options);
    const option = target === null ? undefined : options[target];
    if (target === null || !option) return;
    buttons.current[target]?.focus();
    if (option.value !== value) onChange(option.value);
  };

  return (
    <>
      <div
        role="radiogroup"
        aria-label={label}
        aria-describedby={description ? descriptionId : undefined}
        aria-disabled={allDisabled || undefined}
        className={cx("flex-wrap gap-0.5 rounded-md bg-fill-normal p-1", fullWidth ? "flex" : "inline-flex")}
      >
        {options.map((o, i) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={o.disabled || undefined}
              tabIndex={i === tabStop ? 0 : -1}
              onClick={() => {
                if (!o.disabled) onChange(o.value);
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cx(
                "cursor-pointer whitespace-nowrap rounded-sm font-semibold",
                "transition-[background-color,color] duration-(--duration-fast) ease-standard",
                "focus-visible:outline-none focus-visible:shadow-(--focus-ring)",
                size === "sm" ? "px-3 py-1 text-caption1 leading-(--line-height-label)" : "px-4 py-1.5 text-body3 leading-(--line-height-label)",
                fullWidth && "flex-1",
                active ? "bg-background-normal text-label-normal shadow-1" : "text-label-alternative hover:text-label-normal",
                "aria-disabled:cursor-not-allowed aria-disabled:text-label-disable aria-disabled:hover:text-label-disable",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {description && (
        <p id={descriptionId} className="ds-caption1 text-label-alternative">
          {description}
        </p>
      )}
    </>
  );
}

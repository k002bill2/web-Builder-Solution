import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import type { DesignReference } from "../../domain/reference";
import { COMPARE_LIMIT } from "../../features/compare/compareTray";
import { Button } from "../ds/Button";
import { Icon } from "../ds/Icon";

/** 제거 후 포커스 대상: 다음 항목 → 이전 항목 → (마지막 하나였으면) 펼침 버튼 (QA-1A-01 D07 → v2 C-05 변형). */
const TOGGLE = Symbol("toggle");
type FocusTarget = string | typeof TOGGLE;

function focusTargetAfterRemoving(references: readonly DesignReference[], index: number): FocusTarget {
  return (references[index + 1] ?? references[index - 1])?.id ?? TOGGLE;
}

/**
 * 필이 가리는 높이만큼 문서 scroll-padding-bottom을 둔다 — 포커스로 스크롤될 때 필 위에 보이게 (WCAG 2.4.11).
 * 값 = 카탈로그 본문 하단 여백(`pb-24`)과 같다 (SPEC C-05 "목록 하단 여백 동일").
 */
const PILL_CLEARANCE = "calc(var(--spacing) * 24)";

const INVERSE_FOCUS = "focus-visible:outline-none focus-visible:shadow-(--focus-ring)";

/** 플로팅 비교 필 (v2 SPEC 4.5 C-05, 목업 2a-01·2a-06). 담긴 목록은 "비교 보드 N / 6" 펼침 버튼으로 연다. */
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
  const listId = useId();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<FocusTarget | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.style.scrollPaddingBottom = PILL_CLEARANCE;
    return () => {
      root.style.scrollPaddingBottom = "";
    };
  }, []);

  // 제거가 반영된(항목이 사라진) 뒤에 포커스를 옮긴다
  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    (target === TOGGLE ? toggle.current : removeButtons.current.get(target))?.focus();
  }, [references]);

  const removeAt = (index: number, id: string) => {
    pendingFocus.current = focusTargetAfterRemoving(references, index);
    onRemove(id);
  };

  const closeOnEscape = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !open) return;
    setOpen(false);
    toggle.current?.focus();
  };

  // 펼친 목록은 필보다 높아 scroll-padding 밖이다 — 포커스가 필을 떠나면 닫아 뒤 카드를 가리지 않는다
  const closeOnLeave = (e: FocusEvent<HTMLElement>) => {
    const next = e.relatedTarget;
    if (next instanceof Node && !e.currentTarget.contains(next)) setOpen(false);
  };

  return (
    <section
      aria-label="비교 트레이"
      onKeyDown={closeOnEscape}
      onBlur={closeOnLeave}
      className="pointer-events-none sticky bottom-0 z-10 -mt-16 flex justify-center px-4 pb-5"
    >
      <div className="pointer-events-auto relative">
        <div className="flex items-center gap-3 rounded-full bg-surface-inverse py-1.5 pr-1.5 pl-2 text-on-surface-inverse shadow-4">
          <button
            ref={toggle}
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((o) => !o)}
            className={`ds-label inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-2 hover:bg-inverse-fill-normal ${INVERSE_FOCUS}`}
          >
            비교 보드 <span className="tabular-nums">{references.length}</span>{" "}
            <span className="text-inverse-label-alternative">/ {COMPARE_LIMIT}</span>
            <Icon name="chevron-down" size={16} className={open ? "" : "rotate-180"} />
          </button>
          {/* 펼친 목록은 DOM에서 토글 바로 다음(Tab 앞으로 도달, D-V22-05). 위치는 바깥 relative 기준 absolute라 필 위 그대로 */}
          <div className="absolute bottom-full left-1/2 mb-2 flex w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-2">
            <p role="status" className="ds-caption1">
              {notice && (
                <span className="block rounded-md bg-surface-inverse px-3 py-2 text-on-surface-inverse shadow-4">{notice}</span>
              )}
            </p>
            <div
              id={listId}
              className={`${open ? "flex" : "hidden"} w-full flex-col rounded-lg bg-surface-inverse p-2 text-on-surface-inverse shadow-4`}
            >
              {references.length > 0 ? (
                <ul className="flex flex-col">
                  {references.map((r, i) => (
                    <li key={r.id} className="ds-caption1 flex items-center gap-2 rounded-sm py-1 pr-1 pl-2">
                      <span aria-hidden="true" className="size-2.5 flex-none rounded-full" style={{ backgroundColor: r.colorPalette.primary }} />
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      <button
                        ref={(el) => {
                          if (el) removeButtons.current.set(r.id, el);
                          else removeButtons.current.delete(r.id);
                        }}
                        type="button"
                        aria-label={`${r.title} 비교에서 제거`}
                        onClick={() => removeAt(i, r.id)}
                        className={`inline-flex size-8 flex-none cursor-pointer items-center justify-center rounded-sm text-inverse-label-alternative hover:bg-inverse-fill-normal hover:text-on-surface-inverse ${INVERSE_FOCUS}`}
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ds-caption1 px-2 py-1.5 text-inverse-label-alternative">
                  카드의 ‘비교 추가’로 최대 {COMPARE_LIMIT}개까지 담을 수 있습니다
                </p>
              )}
            </div>
          </div>
          {references.length > 0 && (
            <span aria-hidden="true" className="hidden pl-1.5 sm:flex">
              {references.map((r) => (
                <span
                  key={r.id}
                  className="-ml-1.5 size-5 rounded-full border-2 border-surface-inverse"
                  style={{ backgroundColor: r.colorPalette.primary }}
                />
              ))}
            </span>
          )}
          <Button variant="primary" size="sm" trailingIcon="arrow-right" aria-label="비교 보드 열기" onClick={onOpen}>
            비교 보드
          </Button>
        </div>
      </div>
    </section>
  );
}

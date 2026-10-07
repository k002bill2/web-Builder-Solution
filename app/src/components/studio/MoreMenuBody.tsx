import { useEffect, useRef, type KeyboardEvent } from "react";
import type { MoreMenuProps } from "./MoreMenu";

/** 빈 기록 이유(ER SPEC r1 3.5) — 실행 취소 · 다시 실행 공통 */
const EMPTY = "되돌릴 편집이 없습니다";
const ITEMS = [
  { redo: false, name: "실행 취소" },
  { redo: true, name: "다시 실행" },
] as const;

/**
 * "더보기" 메뉴 본문(조작 뒤 청크 · ER-AC-U4) — 항목 = 단축키와 같은 함수 · 알림은 그 함수가 낸다(편집 알림 1문장).
 * 비활성 = `aria-disabled` + 보이는 이유(포커스는 받는다). 화살표 순환 · Home/End · Esc = 닫고 트리거로 · Tab·바깥 포커스 = 닫기
 */
export default function MoreMenuBody({ at, labelledBy, peek, onStep, onClose }: MoreMenuProps & { readonly at: 0 | 1; readonly labelledBy: string; readonly onClose: (refocus: boolean) => void }) {
  const menu = useRef<HTMLDivElement>(null);
  const items = () => [...(menu.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
  // 본문 청크를 받는 동안 포커스가 트리거 밖 컨트롤로 갔으면 빼앗지 않고 닫는다(Codex r1 P2). 클릭으로 연 Safari = body
  useEffect(() => {
    const active = document.activeElement;
    if (active === document.body || active?.id === labelledBy) items()[at]?.focus();
    else onClose(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 열 때 1회(at이 바뀌면 다시)
  }, [at]);
  const run = (redo: boolean, target: string | undefined) => {
    if (!target) return;
    // 포커스를 트리거로 먼저 — 실행 취소는 포커스 이동 없음(7절), 가 있던 줄이 사라지면 h2 "섹션"은 단축키 경로가 맡는다
    onClose(true);
    void onStep(redo);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (to !== undefined) list[(to + list.length) % list.length]?.focus();
    else if (e.key === "Escape") onClose(true);
    else if (e.key === "Tab") return onClose(false);
    else return;
    e.preventDefault();
  };
  return (
    <div
      ref={menu}
      role="menu"
      aria-labelledby={labelledBy}
      onKeyDown={onKey}
      onBlur={(e) => !e.currentTarget.parentElement?.contains(e.relatedTarget) && onClose(false)}
      className="absolute end-0 top-full z-10 mt-1 flex min-w-56 flex-col rounded-md border border-line-normal bg-background-normal p-1"
    >
      {ITEMS.map(({ redo, name }) => {
        const target = peek(redo);
        const reason = `${labelledBy}-reason-${Number(redo)}`;
        return (
          <div
            key={name}
            role="menuitem"
            tabIndex={-1}
            aria-label={target ? `${name}: ${target}` : name}
            aria-disabled={!target || undefined}
            aria-describedby={target ? undefined : reason}
            onClick={() => run(redo, target)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              run(redo, target);
            }}
            className="ds-body3 flex cursor-pointer flex-col items-start gap-0.5 rounded-sm px-3 py-2 text-label-normal hover:bg-fill-normal focus:bg-fill-normal focus:shadow-(--focus-ring) focus:outline-none aria-disabled:cursor-not-allowed aria-disabled:text-label-disable"
          >
            {target ? `${name}: ${target}` : name}
            {!target && (
              <span id={reason} className="ds-caption1 text-label-alternative">
                {EMPTY}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

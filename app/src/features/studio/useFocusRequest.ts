import { useCallback, useEffect, useRef, type RefObject } from "react";

/** 연산 뒤 포커스 대상(6.4) — 누른 컨트롤 그대로 또는 섹션 줄(`data-row-id`) */
export type FocusTarget = { readonly element: HTMLElement } | { readonly rowId: string };

/**
 * 다음 커밋 뒤에 포커스를 옮긴다. 섹션 줄이 닫힌 `details`(1024) 안이면 먼저 펼친다 — 실제 브라우저는 닫힌 `details`·`hidden` 패널 안으로
 * 포커스를 보내지 않는다(<1024 탭 전환은 부르는 쪽이 같은 배치에서 먼저 한다). 누른 버튼은 줄이 옮겨져 포커스를 잃었으면 되돌린다.
 */
export function useFocusRequest(root: RefObject<HTMLElement | null>): (target: FocusTarget) => void {
  const pending = useRef<FocusTarget>(undefined);
  useEffect(() => {
    const target = pending.current;
    if (!target) return;
    pending.current = undefined;
    const element =
      "element" in target ? target.element : root.current?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(target.rowId)}"]`);
    if (!element?.isConnected) return;
    const details = element.closest("details");
    if (details && !details.open) details.open = true;
    if (document.activeElement !== element) element.focus();
  });
  return useCallback((target: FocusTarget) => {
    pending.current = target;
  }, []);
}

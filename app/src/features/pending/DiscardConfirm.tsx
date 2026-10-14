/**
 * 폐기 확인(RESTART SPEC-4 r0.3a 5.5) — 보조 버튼 → 같은 자리 확인(role=alertdialog) · 첫 포커스 = 취소 · Esc·취소 = 닫고 포커스 = 보조 버튼.
 * 확인 = 이 탭의 미확인 기억을 버리고 경고를 뗀 뒤 새로고침(자동 복구가 아니다 — 마지막 저장 상태로 다시 연다). 로컬 영속에서만 보인다.
 */
import { useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../../components/ds/Button";
import { PENDING_TEXT as T } from "./pendingText";
import { discardAndReload } from "./pendingWrites";

export function DiscardConfirm({ label, reload }: { readonly label?: string; readonly reload?: () => void }) {
  const id = useId();
  const [asking, setAsking] = useState<boolean>();
  const box = useRef<HTMLSpanElement>(null);
  // 열면 첫 버튼(취소) · 닫으면 보조 버튼으로 포커스(처음 렌더 제외)
  useLayoutEffect(() => {
    if (asking !== undefined) box.current?.querySelector("button")?.focus();
  }, [asking]);
  return (
    <span ref={box} className="contents">
      {asking ? (
        <span
          role="alertdialog"
          aria-labelledby={`${id}-t`}
          aria-describedby={`${id}-d`}
          className="flex w-full flex-col items-start gap-2"
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            setAsking(false);
          }}
        >
          <span id={`${id}-t`} className="ds-label">
            {T.discardTitle}
          </span>
          <span id={`${id}-d`} className="ds-body3">
            {T.discardBody}
          </span>
          <span className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setAsking(false)}>
              {T.keepIt}
            </Button>
            <Button size="sm" onClick={() => discardAndReload(reload)}>
              {T.discard}
            </Button>
          </span>
        </span>
      ) : (
        <Button size="sm" variant="outline" aria-label={label} onClick={() => setAsking(true)}>
          {T.discard}
        </Button>
      )}
    </span>
  );
}

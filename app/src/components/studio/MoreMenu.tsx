import { lazy, Suspense, useState } from "react";
import { Button } from "../ds/Button";

/** 메뉴 본문(role=menu · 키보드 · 이유 문구) — 연 뒤에만 받는다(조작 뒤 청크, ER SPEC r1 3.5 · 8절) */
const MoreMenuBody = lazy(() => import("./MoreMenuBody"));
const TRIGGER_ID = "studio-more";

export type MoreMenuProps = {
  /** 다음 실행 취소(false)/다시 실행(true) 대상 이름 — 없으면 비활성 */
  readonly peek: (redo: boolean) => string | undefined;
  /** 단축키와 같은 함수(useSectionOps.step) */
  readonly onStep: (redo: boolean) => unknown;
};

/**
 * 툴바 "더보기"(ER SPEC r1 3.5 · ER-AC-U4 · 7절 키보드 2.1.4) — 진입 청크에는 버튼과 열림 상태만.
 * Enter·ArrowDown = 열고 첫 항목 · ArrowUp = 마지막 항목 · 닫으면(Esc·실행) 포커스 = 이 버튼
 */
export function MoreMenu({ peek, onStep }: MoreMenuProps) {
  const [open, setOpen] = useState<0 | 1>();
  const close = (refocus: boolean) => {
    setOpen(undefined);
    if (refocus) document.getElementById(TRIGGER_ID)?.focus();
  };
  return (
    <div className="relative flex-none">
      <Button
        id={TRIGGER_ID}
        variant="outline"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open !== undefined}
        className="aria-disabled:cursor-not-allowed aria-disabled:text-label-disable"
        onClick={() => setOpen(open === undefined ? 0 : undefined)}
        onKeyDown={(e) => {
          const at = e.key === "ArrowUp" ? 1 : e.key === "Enter" || e.key === "ArrowDown" ? 0 : undefined;
          // 미리보기 잠금(aria-disabled)은 Enter·Space만 막는다 — 화살표 열기도 막는다(Codex r1 P2)
          if (at === undefined || e.currentTarget.getAttribute("aria-disabled") === "true") return;
          e.preventDefault();
          setOpen(at);
        }}
      >
        더보기
      </Button>
      {open !== undefined && (
        <Suspense fallback={null}>
          <MoreMenuBody at={open} labelledBy={TRIGGER_ID} peek={peek} onStep={onStep} onClose={close} />
        </Suspense>
      )}
    </div>
  );
}

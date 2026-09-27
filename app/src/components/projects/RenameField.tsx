import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import type { RenameDraft } from "../../features/projects/renameDraft";
import { Button } from "../ds/Button";
import { TextField } from "../ds/TextField";

/** 저장 누름 결과 — 무효면 입력으로 포커스를 돌린다(J-S06) */
export type RenameSubmitOutcome = "sent" | "invalid" | "ignored";

/** TextField는 ref를 넘기지 않아 감싼 상자에서 입력을 찾는다 */
const inputIn = (box: HTMLElement | null) => box?.querySelector("input") ?? null;

/**
 * J-S05~J-S07 이름 바꾸기 입력. 열리면 입력에 포커스 + 전체 선택, Esc = 취소.
 * 검증 문장은 `aria-describedby`(알림 아님), 저장 실패만 `role=alert`.
 */
export function RenameField({
  draft,
  onChange,
  onSubmit,
  onCancel,
}: {
  readonly draft: RenameDraft;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => RenameSubmitOutcome;
  readonly onCancel: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const errorId = useId();
  useEffect(() => {
    const input = inputIn(box.current);
    input?.focus();
    input?.select();
  }, []);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onCancel();
  };
  return (
    <div ref={box} className="flex w-full flex-col gap-2" onKeyDown={onKeyDown}>
      <form
        noValidate
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (onSubmit() === "invalid") inputIn(box.current)?.focus();
        }}
      >
        <div className="min-w-0 flex-1">
          <TextField
            label="프로젝트 이름"
            value={draft.value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={draft.error !== undefined || undefined}
            aria-describedby={draft.error !== undefined ? errorId : undefined}
          />
        </div>
        <Button type="submit" size="sm" aria-busy={draft.submitting || undefined}>
          저장
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          취소
        </Button>
      </form>
      {draft.error !== undefined && (
        <p id={errorId} className="ds-caption1 text-status-negative-text">
          {draft.error}
        </p>
      )}
      {draft.alert !== undefined && (
        <div role="alert" className="ds-body3 rounded-md bg-status-negative-bg p-3 text-status-negative-text">
          {draft.alert}
        </div>
      )}
    </div>
  );
}

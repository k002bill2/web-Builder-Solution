import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { DISCARD_TIMEOUT_TEXT } from "../../features/studio/saveStatusText";
import { DISCARD_TIMEOUT_ALERT } from "../../features/studio/save/alertKeys";
import { Button } from "../ds/Button";

/**
 * 폐기 확인(UX-5 6.3 · INTEGRATE-6 8.2 "버리고 새로고침") — 조작 뒤 청크(버튼을 눌러야 받는다). `role=alertdialog` + `showModal()`.
 * 열 때 포커스 = "취소" · Esc = 취소 · 진행 중 aria-busy·aria-disabled(연타 1회) · 시간 초과면 alert + 포커스 "취소" 유지(I6 8.4).
 * 포커스 복귀(여는 버튼)는 여는 쪽이 맡는다.
 */
export default function DiscardDialog({ discard, onClose }: { readonly discard: () => Promise<string>; readonly onClose: () => void }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState({ text: "", key: 0, timeout: false });

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  const focusCancel = () => dialog.current?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus();
  useLayoutEffect(focusCancel, []);

  const dismiss = () => {
    dialog.current?.close();
    onClose();
  };
  const run = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    const result = await discard();
    if (result === "done") return;
    running.current = false;
    setBusy(false);
    setError((e) => ({ text: result === "timeout" ? DISCARD_TIMEOUT_TEXT : "버리지 못했습니다 — 다시 시도해 주세요", key: e.key + 1, timeout: result === "timeout" }));
    focusCancel();
  };

  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-labelledby={`${id}-t`}
      aria-describedby={`${id}-d`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) dismiss();
      }}
      className="m-auto w-full max-w-lg rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal"
    >
      <div className="flex flex-col gap-4">
        <h2 id={`${id}-t`} className="ds-heading2">
          확인되지 않은 변경 버리기
        </h2>
        <p id={`${id}-d`} className="ds-body3">
          이 문서의 확인되지 않은 변경과 새로 고른 이미지가 사라집니다. 마지막으로 확인된 저장 상태로 돌아갑니다.
        </p>
        {error.text && (
          <p key={error.key} role="alert" data-alert-key={error.timeout ? DISCARD_TIMEOUT_ALERT : undefined} className="ds-caption1 text-status-negative-text">
            {error.text}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button data-cancel variant="outline" size="sm" aria-disabled={busy || undefined} onClick={() => !busy && dismiss()}>
            취소
          </Button>
          <Button size="sm" aria-busy={busy || undefined} aria-disabled={busy || undefined} onClick={() => void run()}>
            {busy ? "버리는 중…" : "버리기"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

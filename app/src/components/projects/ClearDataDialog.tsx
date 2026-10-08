import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ClearResult } from "../../features/projects/clearBrowserData";
import { BUSY_TEXT, FAIL_TEXT } from "../../features/projects/dialogText";
import { Button } from "../ds/Button";

/**
 * "이 브라우저 데이터 지우기" 대화상자(P1C-SPEC 1.6 · AC-C08) — 조작 뒤 청크(영역의 버튼을 눌러야 받는다).
 * 네이티브 `dialog` + `showModal()` · h2 = 접근 이름 · 열 때 포커스 = "취소" · Esc = 취소 · 바깥 클릭 닫기 0(닫는 경로는 취소·Esc뿐).
 * 진행 중 = "지우는 중…" aria-disabled(누름은 핸들러가 막는다) · Esc 무시. 실패는 대화상자 안 `role=alert`(시도마다 새로 낭독).
 * 포커스 복귀(여는 버튼)는 여는 쪽이 맡는다 — 닫을 때 modal을 먼저 `close()`한다(열린 modal 바깥은 inert라 언마운트 전 focus가 무시된다). P2 백업 문장은 파일 묶음 출시 전이라 두지 않는다.
 */
export default function ClearDataDialog({
  count,
  clear,
  onClose,
}: {
  /** 지금 목록의 프로젝트 수 */
  readonly count: number;
  readonly clear: () => Promise<ClearResult>;
  readonly onClose: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  /** 연타 막기 — 상태는 다음 렌더까지 옛 값이라 ref로 */
  const running = useRef(false);
  const [error, setError] = useState({ text: "", key: 0 });

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  // 열 때 포커스 = "취소"(위험 쪽이 아닌 버튼)
  useLayoutEffect(() => dialog.current?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus(), []);

  const dismiss = () => {
    dialog.current?.close();
    onClose();
  };

  const run = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    const result = await clear();
    // 성공 = 새로고침 이동 중 — "지우는 중…" 유지
    if (result === "done") return;
    running.current = false;
    setBusy(false);
    setError((e) => ({ text: result === "busy" ? BUSY_TEXT : FAIL_TEXT, key: e.key + 1 }));
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) dismiss();
      }}
      className="m-auto w-full max-w-lg rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal"
    >
      <div className="flex flex-col gap-4">
        <h2 id={`${id}-title`} className="ds-heading2">
          이 브라우저 데이터를 지울까요?
        </h2>
        <p className="ds-body3">이 브라우저에 저장된 아래 항목을 모두 지웁니다. 되돌릴 수 없습니다.</p>
        <ul className="ds-body3 list-disc pl-5">
          <li>{count > 0 ? `프로젝트 ${count}개와 각 편집 문서` : "프로젝트"}</li>
          <li>스냅샷</li>
          <li>문서에 넣은 이미지</li>
          <li>확정한 프로필(모든 버전)과 만든 3안</li>
        </ul>
        <p className="ds-caption1 text-label-alternative">비교 보드와 보관함은 따로 저장하지 않아 지운 뒤 함께 비워집니다. 내려받은 파일은 그대로 남습니다.</p>
        {error.text && (
          <p key={error.key} role="alert" className="ds-caption1 text-status-negative-text">
            {error.text}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button data-cancel variant="outline" onClick={() => !busy && dismiss()}>
            취소
          </Button>
          <Button aria-disabled={busy || undefined} onClick={() => void run()}>
            {busy ? "지우는 중…" : "모두 지우기"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

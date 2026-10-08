import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { DeleteResult } from "../../features/projects/deleteProject";
import { BUSY_TEXT, FAIL_TEXT } from "../../features/projects/dialogText";
import { Button } from "../ds/Button";

const UNREADABLE_TEXT = "저장된 데이터를 읽지 못해 지우지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다";
const RELOAD_TEXT = " 이 화면을 새로 불러옵니다.";

/**
 * 프로젝트 삭제 확인 대화상자(P1D-SPEC 1.3 J-S13~J-S15 · 1.6) — 조작 뒤 청크(줄의 "삭제"를 눌러야 받는다).
 * 네이티브 `dialog` + `showModal()` · h2 = 접근 이름 · 열 때 포커스 = "취소" · Esc = 취소 · 바깥 클릭 닫기 0.
 * 진행 중 = "지우는 중…" aria-disabled · Esc 무시. 실패는 대화상자 안 `role=alert`(시도마다 새로 낭독).
 * 쓰기 탭이라 싱크를 멈춘 뒤 실패면 문장 끝에 새로고침 안내를 붙이고, 닫을 때 onClose(true) — 여는 쪽이 새로고침 이동한다.
 * 닫을 때 modal을 먼저 `close()`한다(열린 modal 바깥은 inert라 언마운트 전 포커스 복귀가 무시된다).
 */
export default function DeleteProjectDialog({
  name,
  hasDoc,
  remove,
  onClose,
}: {
  readonly name: string;
  /** 편집 문서가 있으면 목록 첫 줄 "편집 문서와 스냅샷" */
  readonly hasDoc: boolean;
  readonly remove: () => Promise<DeleteResult>;
  /** reload = 멈춘 뒤 실패라 새로고침 이동이 필요 */
  readonly onClose: (reload: boolean) => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  /** 연타 막기 — 상태는 다음 렌더까지 옛 값이라 ref로 */
  const running = useRef(false);
  const stopped = useRef(false);
  const [error, setError] = useState({ text: "", key: 0 });

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  useLayoutEffect(() => dialog.current?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus(), []);

  const dismiss = () => {
    dialog.current?.close();
    onClose(stopped.current);
  };

  const run = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    const result = await remove();
    // 성공 = 새로고침 이동 중 — "지우는 중…" 유지
    if (result.status === "done") return;
    stopped.current ||= result.stopped;
    running.current = false;
    setBusy(false);
    const text = result.status === "busy" ? BUSY_TEXT : result.status === "unreadable" ? UNREADABLE_TEXT : FAIL_TEXT;
    setError((e) => ({ text: stopped.current ? text + RELOAD_TEXT : text, key: e.key + 1 }));
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
          &apos;{name}&apos; 프로젝트를 지울까요?
        </h2>
        <p className="ds-body3">이 브라우저에서 아래 항목을 함께 지웁니다. 되돌릴 수 없습니다.</p>
        <ul className="ds-body3 list-disc pl-5">
          {hasDoc && <li>편집 문서와 스냅샷</li>}
          <li>문서에 넣은 이미지</li>
          <li>확정한 프로필(모든 버전)과 만든 3안</li>
        </ul>
        <p className="ds-caption1 text-label-alternative">
          다른 프로젝트와 내려받은 파일은 그대로 남습니다. 지운 뒤 이 화면을 새로 불러오므로 비교 보드와 보관함도 비워집니다.
        </p>
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
            {busy ? "지우는 중…" : "프로젝트 지우기"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

import { useId, useLayoutEffect, useRef, useState } from "react";
import { EXPORT_TOO_LARGE } from "../../features/projectFile/format";
import { Button } from "../ds/Button";

const MB = 1024 * 1024;
/** X-S03 큰 파일 경고 기준 [추정 — 메일·메신저 첨부 한도대] */
const LARGE_BYTES = 50 * MB;

export type MakeResult = { readonly status: "ok"; readonly blob: Blob } | { readonly status: "unreadable" | "gone" | "failed" | "too-large" };

const FAIL_TEXT: Readonly<Record<Exclude<MakeResult["status"], "ok">, string>> = {
  unreadable: "저장된 데이터를 읽지 못해 파일을 만들지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다",
  gone: "이 프로젝트를 찾지 못했습니다 — 다른 탭에서 지웠을 수 있습니다. 새로고침하세요",
  failed: "파일을 만들지 못했습니다 — 다시 시도하세요",
  "too-large": EXPORT_TOO_LARGE,
};

/**
 * 프로젝트 파일 내보내기 대화상자(P2-SPEC 4.1 X-S01~X-S06 · 5절 EX) — 조작 뒤 청크(줄의 "파일로 내보내기"를 눌러야 받는다).
 * 네이티브 `dialog` + `showModal()` · h2 = 접근 이름 · 열 때 포커스 = "파일 만들기"(비파괴) · Esc = 취소 · 바깥 클릭 닫기 0.
 * 만드는 중 = "만드는 중…" aria-disabled · 연타 무시 · Esc 무시. 50MB 이상이면 EX-8과 "내려받기"를 한 번 더 묻는다.
 * 실패는 대화상자 안 `role=alert`(시도마다 key를 바꿔 다시 낭독). 성공 = 내려받기 → `close()` 먼저 → onClose(true).
 */
export default function ExportProjectFileDialog({
  name,
  hasDoc,
  make,
  save,
  onClose,
}: {
  readonly name: string;
  /** 편집 문서가 있으면 목록 첫 줄 "편집 문서와 스냅샷" */
  readonly hasDoc: boolean;
  readonly make: () => Promise<MakeResult>;
  /** 내려받기 시작(부모 문서 a[download]) */
  readonly save: (blob: Blob) => void;
  /** done = 내려받기를 시작했다(여는 쪽이 EX-9 알림) */
  readonly onClose: (done: boolean) => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  /** 연타 막기 — 상태는 다음 렌더까지 옛 값이라 ref로 */
  const running = useRef(false);
  const [large, setLarge] = useState<Blob | null>(null);
  const [error, setError] = useState({ text: "", key: 0 });

  // showModal()은 첫 포커스 대상(취소)으로 옮기므로 연 뒤에 "파일 만들기"로 — 순서가 바뀌면 실제 브라우저에서 취소가 잡힌다(Ego Lite 실측)
  useLayoutEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    el?.querySelector<HTMLButtonElement>("[data-make]")?.focus();
  }, []);
  useLayoutEffect(() => {
    if (large) dialog.current?.querySelector<HTMLButtonElement>("[data-download]")?.focus();
  }, [large]);

  const dismiss = (done: boolean) => {
    dialog.current?.close();
    onClose(done);
  };
  const deliver = (blob: Blob) => {
    save(blob);
    dismiss(true);
  };

  const run = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    const result = await make();
    running.current = false;
    setBusy(false);
    if (result.status !== "ok") {
      setError((e) => ({ text: FAIL_TEXT[result.status], key: e.key + 1 }));
      return;
    }
    if (result.blob.size >= LARGE_BYTES) setLarge(result.blob);
    else deliver(result.blob);
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) dismiss(false);
      }}
      className="m-auto w-full max-w-lg rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal"
    >
      <div className="flex flex-col gap-4">
        <h2 id={`${id}-title`} className="ds-heading2">
          &apos;{name}&apos; 프로젝트를 파일로 내보낼까요?
        </h2>
        <p className="ds-body3">이 프로젝트를 다른 브라우저나 기기에서 가져올 수 있는 파일 1개로 내려받습니다.</p>
        <ul className="ds-body3 list-disc pl-5">
          {hasDoc && <li>편집 문서와 스냅샷</li>}
          <li>문서에 넣은 이미지</li>
          <li>확정한 프로필(모든 버전)</li>
        </ul>
        <p className="ds-caption1 text-label-alternative">
          마지막으로 저장된 내용이 들어갑니다. 비교 보드·보관함·만든 3안은 들어가지 않습니다 — 3안은 가져온 뒤 프로필 화면에서 다시 만들 수 있습니다.
        </p>
        <p className="ds-caption1 text-label-alternative">파일에 이미지와 문구가 그대로 들어 있습니다 — 공유할 때 주의하세요.</p>
        {large && <p className="ds-caption1 text-label-normal">파일이 {Math.ceil(large.size / MB)}MB입니다 — 메일이나 메신저로 보내기 어려울 수 있습니다.</p>}
        {error.text && (
          <p key={error.key} role="alert" className="ds-caption1 text-status-negative-text">
            {error.text}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => !busy && dismiss(false)}>
            취소
          </Button>
          {large ? (
            <Button data-download onClick={() => deliver(large)}>
              내려받기
            </Button>
          ) : (
            <Button data-make aria-disabled={busy || undefined} onClick={() => void run()}>
              {busy ? "만드는 중…" : "파일 만들기"}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}

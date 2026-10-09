import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CheckedFile, CheckResult } from "../../features/projectFile/checkFile";
import { importMessage, type ImportResult } from "../../features/projectFile/writeImport";
import { Button } from "../ds/Button";

const RELOAD_TEXT = " 이 화면을 새로 불러옵니다.";
const KB = 1024;
const MB = KB * KB;

type Phase = { readonly kind: "checking" } | { readonly kind: "ready"; readonly file: CheckedFile } | { readonly kind: "invalid"; readonly text: string };

const pad = (n: number) => String(n).padStart(2, "0");
/** 내보낸 날(사용자 로컬 날짜) — 날짜로 못 읽으면 문자열 앞 10자 */
function exportedDay(iso: string): string {
  const day = new Date(iso);
  return Number.isNaN(day.getTime()) ? iso.slice(0, 10) : `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** IM-13 파일 크기(P2-SPEC Jarvis 결정 2) — 1MB 미만 KB 올림 정수(최소 1KB) · 이상 MB 소수 1자리 올림 · 정수 산술 */
function fileSizeLabel(bytes: number): string {
  return bytes < MB ? `${Math.max(1, Math.ceil(bytes / KB))}KB` : `${(Math.ceil((bytes * 10) / MB) / 10).toFixed(1)}MB`;
}

/** IM-13 목록 */
const summaryItems = (file: CheckedFile): string[] => [
  `편집 문서 ${file.doc ? "있음" : "없음"}`,
  `스냅샷 ${file.doc?.snapshots.length ?? 0}개`,
  `이미지 ${file.images.length}개`,
  `파일 ${fileSizeLabel(file.size)}`,
  `${exportedDay(file.exportedAt)} 내보냄`,
];

const FOCUS: Readonly<Record<Phase["kind"], string>> = { checking: "[data-cancel]", ready: "[data-import]", invalid: "[data-pick]" };

/**
 * 프로젝트 파일 가져오기 대화상자(P2-SPEC 4.2 I-S02~I-S08) — 조작 뒤 청크(파일을 골라야 받는다).
 * 확인 중(취소만) → 요약(포커스 = 가져오기) 또는 검증 실패(alert · 포커스 = 다른 파일 고르기) → 쓰는 중(Esc 무시) → 성공 = 새로고침 이동.
 * 쓰기 실패는 대화상자 안 `role=alert`(시도마다 새로 낭독) · 멈춘 뒤 실패면 새로고침 안내 + 닫을 때 onClose(true).
 * 닫을 때 modal을 먼저 `close()`한다(열린 modal 바깥은 inert라 언마운트 전 포커스 복귀가 무시된다).
 */
export default function ImportProjectFileDialog({
  file,
  check,
  write,
  onPickAgain,
  onClose,
}: {
  readonly file: Pick<Blob, "size" | "text">;
  readonly check: (file: Pick<Blob, "size" | "text">) => Promise<CheckResult>;
  readonly write: (file: CheckedFile) => Promise<ImportResult>;
  /** "다른 파일 고르기" — 대화상자를 닫은 뒤 파일 선택기를 다시 연다(같은 클릭 안에서) */
  readonly onPickAgain: () => void;
  /** reload = 멈춘 뒤 실패라 새로고침 이동이 필요 */
  readonly onClose: (reload: boolean) => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "checking" });
  const [busy, setBusy] = useState(false);
  /** 연타 막기 — 상태는 다음 렌더까지 옛 값이라 ref로 */
  const running = useRef(false);
  const stopped = useRef(false);
  /** 닫은 뒤(언마운트 전) 끝난 확인 결과도 버린다 */
  const closed = useRef(false);
  const [error, setError] = useState({ text: "", key: 0 });

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  useEffect(() => {
    // 닫은 뒤 늦게 끝난 확인 결과는 버린다
    let alive = true;
    void check(file).then((result) => alive && !closed.current && setPhase(result.ok ? { kind: "ready", file: result.file } : { kind: "invalid", text: result.message }));
    return () => {
      alive = false;
    };
  }, [check, file]);
  useLayoutEffect(() => dialog.current?.querySelector<HTMLButtonElement>(FOCUS[phase.kind])?.focus(), [phase.kind]);

  const dismiss = () => {
    closed.current = true;
    dialog.current?.close();
    onClose(stopped.current);
  };
  const pickAgain = () => {
    dialog.current?.close();
    onPickAgain();
  };

  const run = async (checked: CheckedFile) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    const result = await write(checked);
    // 성공 = 새로고침 이동 중 — "가져오는 중…" 유지
    if (result.status === "done") return;
    stopped.current ||= result.stopped;
    running.current = false;
    setBusy(false);
    const text = importMessage(result.status);
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
          프로젝트 파일 가져오기
        </h2>
        {phase.kind === "checking" && <p className="ds-body3">파일을 확인하는 중…</p>}
        {phase.kind === "invalid" && (
          <p role="alert" className="ds-body3 text-status-negative-text">
            {phase.text}
          </p>
        )}
        {phase.kind === "ready" && (
          <>
            <p className="ds-body3">&apos;{phase.file.project.name}&apos; 프로젝트를 새 프로젝트로 추가합니다.</p>
            <ul className="ds-body3 list-disc pl-5">
              {summaryItems(phase.file).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="ds-caption1 text-label-alternative">지금 있는 프로젝트는 바뀌지 않습니다. 같은 파일을 다시 가져오면 프로젝트가 하나 더 생깁니다.</p>
          </>
        )}
        {error.text && (
          <p key={error.key} role="alert" className="ds-caption1 text-status-negative-text">
            {error.text}
          </p>
        )}
        <div className="flex justify-end gap-2">
          {phase.kind === "invalid" ? (
            <>
              <Button data-pick variant="outline" onClick={pickAgain}>
                다른 파일 고르기
              </Button>
              <Button variant="assistive" onClick={dismiss}>
                닫기
              </Button>
            </>
          ) : (
            <Button data-cancel variant="outline" onClick={() => !busy && dismiss()}>
              취소
            </Button>
          )}
          {phase.kind === "ready" && (
            <Button data-import aria-disabled={busy || undefined} onClick={() => void run(phase.file)}>
              {busy ? "가져오는 중…" : "가져오기"}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}

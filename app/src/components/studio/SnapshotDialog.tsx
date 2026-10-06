import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import type { ProjectRepository, SnapshotReason } from "../../data/projectRepository";
import { Button } from "../ds/Button";
import type { Snapshot, SnapshotLayerProps } from "./useSnapshots";

const CAPTION = "ds-caption1 text-label-alternative";
const RECENT = 10;
const REASON: Record<SnapshotReason, string> = { export: "내보내기 전", restore: "복원 전", conflict: "충돌 보존", restart: "새로 시작 전" };
const kindText = (s: Snapshot) => (s.kind === "manual" ? "수동" : s.kind === "published" ? "게시" : `자동${s.reason ? ` · ${REASON[s.reason]}` : ""}`);
const timeText = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * 스냅샷 대화상자(EDITOR-REST SPEC r1 3.2 · 7절 · ER-AC-S1·S7·S9) — 조작 뒤 청크(툴바 "스냅샷"을 눌러야 받는다).
 * 네이티브 `dialog` + `showModal()` · 열 때 포커스 = 이름 입력 · Esc·"닫기" = 닫기(포커스는 부르는 쪽이 "스냅샷"으로) · 바깥 클릭 닫기 0.
 * "지금 상태 저장"·"미리보기" = 저장 먼저(`flushed`) → 저장됐을 때만 `createSnapshot`·미리보기(실패면 대화상자 안 문장). 목록 = 최신 먼저 10개 + "이전 스냅샷 N개 더 보기".
 */
export default function SnapshotDialog({
  repository,
  projectId,
  isDoc,
  flushed,
  onCreated,
  onPreview,
  onClose,
}: {
  readonly repository: ProjectRepository;
  readonly projectId: string;
  readonly isDoc: SnapshotLayerProps["isDoc"];
  readonly flushed: () => Promise<boolean>;
  readonly onCreated: (name: string) => void;
  readonly onPreview: (snapshot: Snapshot) => void;
  readonly onClose: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<readonly Snapshot[]>();
  const [all, setAll] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const load = useCallback(
    () => repository.listSnapshots(projectId).then((items) => setList(items.flatMap((s) => (isDoc(s.doc) ? [{ ...s, doc: s.doc }] : [])))),
    [repository, projectId, isDoc],
  );
  useLayoutEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    input.current?.focus();
  }, []);
  useEffect(() => void load(), [load]);
  // "더 보기"는 누르면 사라진다 — 포커스를 새로 보인 첫 스냅샷의 "미리보기"로(포커스 유실 0)
  useLayoutEffect(() => {
    if (all) dialog.current?.querySelectorAll<HTMLElement>("li button")[RECENT]?.focus();
  }, [all]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setError("");
    try {
      if (!(await flushed())) return setError("저장하지 못해 스냅샷을 만들지 않았습니다");
      const created = await repository.createSnapshot(projectId, input.current?.value || undefined);
      if (input.current) input.current.value = "";
      onCreated(created.name);
      await load();
    } catch {
      setError("스냅샷을 만들지 못했습니다 · 다시 시도해 주세요");
    } finally {
      busy.current = false;
    }
  };

  // 저장 먼저 — 저장됐을 때만 미리보기(잠금 중 미저장 변경이 남지 않게 · Codex r2 P2)
  const preview = async (snapshot: Snapshot) => {
    if (busy.current) return;
    busy.current = true;
    setError("");
    const ok = await flushed().catch(() => false);
    busy.current = false;
    if (!ok) return setError("저장하지 못해 미리보기를 열지 않았습니다");
    onPreview(snapshot);
  };

  const recent = [...(list ?? [])].reverse();
  const shown = all ? recent : recent.slice(0, RECENT);
  const older = recent.length - shown.length;
  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-full max-w-lg rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal"
    >
      <div className="flex flex-col gap-4">
        <h2 id={`${id}-title`} className="ds-heading2">
          스냅샷
        </h2>
        <form onSubmit={(event) => void save(event)} className="flex flex-wrap items-end gap-2">
          <label className="ds-label flex min-w-0 flex-1 flex-col gap-1">
            이름(30자까지 · 비우면 "수동 · 시:분")
            <input ref={input} maxLength={30} aria-describedby={error ? `${id}-error` : undefined} className="ds-body3 h-9 rounded-md border border-line-strong bg-background-normal px-2" />
          </label>
          <Button type="submit" size="sm">
            지금 상태 저장
          </Button>
        </form>
        {error && (
          <p id={`${id}-error`} role="alert" className="ds-body3">
            {error}
          </p>
        )}
        {list?.length === 0 && <p className={CAPTION}>아직 스냅샷이 없습니다</p>}
        <ul aria-label="스냅샷 목록" className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {shown.map((s) => (
            <li key={s.snapshotId} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-fill-normal">
              <div className="min-w-0 flex-1">
                <p className="ds-label truncate">{s.name}</p>
                <p className={CAPTION}>
                  {kindText(s)} · {timeText(s.createdAt)} · 프로필 v{s.profileVersion} · {s.candidateId}안
                </p>
              </div>
              <Button variant="outline" size="sm" aria-label={`${s.name} 미리보기`} onClick={() => void preview(s)}>
                미리보기
              </Button>
            </li>
          ))}
        </ul>
        {older > 0 && (
          <Button variant="outline" size="sm" onClick={() => setAll(true)}>
            이전 스냅샷 {older}개 더 보기
          </Button>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </dialog>
  );
}

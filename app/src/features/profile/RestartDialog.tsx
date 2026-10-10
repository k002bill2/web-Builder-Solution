/**
 * "새로 시작" 대화상자 (RESTART SPEC r2 3.2·3.3·3.3.1·5.2·6·7 · MQ-S1·S2·S3·S6·S7 ★A) — 조작 뒤 청크. 편집 시작 판정(`startEdit`)도 이 청크에 있다.
 * 네이티브 `dialog` + `showModal()` · 열 때 포커스 = 제목(결과 문장을 먼저 읽게) · Esc·"취소" = 닫기(쓰기 0) · 진행 중 Esc·연타 무시.
 * 결과 알림은 대화상자 안 `role=alert` 한 자리(showModal 중 바깥은 inert). 실패는 3.3.1 순서 — 커밋 확인 먼저(양성 R-E4 · 확인 불가 R-E5),
 * 음성일 때만 코드·사유(STALE_DOC 재판정 R-E1/R-E1b · UNKNOWN_VARIANT · 잠금 R-E2/R-E2b · 그 밖 R-E3). 다시 시도 = 같은 인자(멱등).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../../components/ds/Button";
import { useProfileRepository } from "../../data/ProfileRepositoryContext";
import type { ProjectRepository, StudioEntryState } from "../../data/projectRepository";
import { committed, contrastFails, remember, shapeOf, type RestartOpen } from "./restartFlow";
import { RESTART_TEXT as T, TAB_REASON, contrastText } from "./restartText";

export { startEdit } from "./restartFlow";

const FULL = "w-full md:w-auto";
/** ready = 처음 · same = STALE_DOC 최신이 고른 안(R-E1b) · unconfirmed = R-E4 · unknown = R-E5 */
type Mode = "ready" | "same" | NonNullable<RestartOpen["held"]>;

export default function RestartDialog({
  repo,
  projectId,
  profileId,
  open,
  go,
  onClose,
}: {
  readonly repo: ProjectRepository;
  readonly projectId: string;
  readonly profileId: string;
  readonly open: RestartOpen;
  readonly go: (state: StudioEntryState) => void;
  readonly onClose: () => void;
}) {
  const { selected, version } = open;
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const profiles = useProfileRepository();
  const [doc, setDoc] = useState(open.doc);
  const [mode, setMode] = useState<Mode>(open.held ?? "ready");
  const [busy, setBusy] = useState(false);
  /** 연타 막기 — 상태는 다음 렌더까지 옛 값이라 ref로 */
  const running = useRef(false);
  const [alert, setAlert] = useState(
    open.held && { text: open.held === "unconfirmed" ? T.unconfirmed(open.doc) : T.unknown, retry: false, key: 0 },
  );
  /** R-D5 — 그 줄을 계산한 문서 버전과 함께(STALE_DOC로 doc이 바뀌면 옛 줄을 쓰지 않는다) */
  const [contrast, setContrast] = useState<{ readonly from: number; readonly text?: string }>();
  const held = mode === "unconfirmed" || mode === "unknown";

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  // 열 때 · 주 버튼이 사라지는 상태 전환 때 포커스 = 제목(7절)
  useLayoutEffect(() => title.current?.focus(), [mode]);
  useEffect(() => {
    if (doc.profileVersion === version) return;
    let live = true;
    profiles.getProfile(profileId).then(
      (series) => {
        const now = series?.versions.find((v) => v.version === doc.profileVersion);
        const next = series?.versions.find((v) => v.version === version);
        if (live && now && next) setContrast({ from: now.version, text: contrastText(now.version, contrastFails(now), next.version, contrastFails(next)) });
      },
      () => undefined,
    );
    return () => void (live = false);
  }, [profiles, profileId, doc.profileVersion, version]);

  const dismiss = () => {
    if (running.current) return;
    dialog.current?.close();
    onClose();
  };
  const show = (text: string, retry: boolean) => setAlert((a) => ({ text, retry, key: (a?.key ?? 0) + 1 }));

  /** 3.3.1 — 커밋 확인 양성·불가 = 기억하고 R-E4·R-E5 · 음성 = 기억 지우고 코드·사유로 */
  const settle = (error: unknown, check: "yes" | "no" | "unknown") => {
    if (check !== "no") {
      const state = check === "yes" ? "unconfirmed" : "unknown";
      remember(repo, projectId, { selected, version, doc, held: state });
      setMode(state);
      return show(state === "unconfirmed" ? T.unconfirmed(doc) : T.unknown, false);
    }
    remember(repo, projectId);
    setMode("ready");
    const { code, alert: text, doc: latest, message = "" } = shapeOf(error);
    if (code === "STALE_DOC" && latest) {
      setDoc(latest);
      if (latest.candidateId === selected) setMode("same");
      return show(latest.candidateId === selected ? T.staleSame(latest) : T.stale(latest.revision), false);
    }
    if (code === "UNKNOWN_VARIANT") return show(text || T.failed, false);
    if (code === "INFRA" && message.endsWith(TAB_REASON.readonly)) return show(T.readonly, true);
    if (code === "INFRA" && message.endsWith(TAB_REASON.stale)) return show(T.staleTab, false);
    const cut = message.indexOf(" — ");
    show(code === "INFRA" && cut >= 0 ? `${T.failed} · ${message.slice(cut + 3)}` : T.failed, true);
  };

  const run = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const started = await repo.startDoc(projectId, version, selected, "restart", doc.revision);
      remember(repo, projectId);
      // 성공 state = editNotice만(RS-D9 — changes가 있으면 편집기가 R-N1을 접는다)
      return go({ editNotice: T.done(selected, version, doc, started.changeNotice) });
    } catch (error: unknown) {
      settle(error, await committed(repo, projectId, { selected, version, doc }));
    }
    running.current = false;
    setBusy(false);
  };
  const openEditor = () => !running.current && go({ editNotice: mode === "same" ? T.openedAt(doc, version) : T.opened(doc) });

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      className="m-auto w-full max-w-lg rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal"
    >
      <div className="flex flex-col gap-4">
        <h2 ref={title} id={`${id}-title`} tabIndex={-1} className="ds-heading2 focus:outline-none">
          {T.title(selected)}
        </h2>
        <p className="ds-body3">{T.current(doc)}</p>
        <p className="ds-body3">{T.result(selected, version)}</p>
        <p className="ds-body3">{T.undo}</p>
        {contrast?.from === doc.profileVersion && contrast.text && doc.profileVersion !== version && <p className="ds-body3">{contrast.text}</p>}
        <p className="ds-caption1 text-label-alternative">{T.keep}</p>
        {alert && (
          <div key={alert.key} role="alert" className="flex flex-col items-start gap-2">
            <p className="ds-body3 text-status-negative-text">{alert.text}</p>
            {alert.retry && mode === "ready" && (
              <Button size="sm" variant="outline" aria-disabled={busy || undefined} onClick={() => void run()}>
                {T.retry}
              </Button>
            )}
          </div>
        )}
        {/* DOM = 취소 → (편집기 열기) → 주 버튼(대화상자 관례 RS-D4) · <768 세로 쌓기 주 버튼 맨 위(col-reverse) · ≥768 끝 정렬 한 줄 */}
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="outline" className={FULL} aria-disabled={busy || undefined} onClick={dismiss}>
            {T.cancel}
          </Button>
          {!held && (
            <Button variant="outline" className={FULL} aria-disabled={busy || undefined} onClick={openEditor}>
              {T.open(doc)}
            </Button>
          )}
          {mode !== "same" && (
            <Button className={FULL} aria-busy={busy || undefined} aria-disabled={busy || undefined} onClick={() => void run()}>
              {busy ? T.starting : held ? T.retry : T.start(selected)}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}

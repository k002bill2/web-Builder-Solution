/**
 * "새로 시작" 대화상자 (RESTART SPEC r1 3.2·3.3·5.2·6·7 · MQ-S1·S2·S3 ★A) — 조작 뒤 청크(편집 시작 → DOC_EXISTS · 다른 안일 때만 받는다).
 * 네이티브 `dialog` + `showModal()` · 열 때 포커스 = 제목(결과 문장을 먼저 읽게) · Esc·"취소" = 닫기(쓰기 0) · 진행 중 Esc·연타 무시.
 * 결과 알림은 대화상자 안 `role=alert` 한 자리(showModal 중 바깥은 inert). 분기:
 * 성공 = 이동(R-N1) · STALE_DOC = 최신 doc으로 다시 채움 + R-E1 · UNKNOWN_VARIANT = 저장소 문장 · 쓰기 전 거부(잠금 readonly R-E2 · stale R-E2b) ·
 * 커밋 뒤 미확인(메모리 문서가 이미 새 문서 — getDoc으로 확인) R-E4 · 그 밖 R-E3. 다시 시도 = 같은 인자(멱등).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../../components/ds/Button";
import { useProfileRepository } from "../../data/ProfileRepositoryContext";
import type { DocHead, StudioEntryState } from "../../data/projectRepository";
import type { ProjectLoader } from "../../data/ProfileRepositoryContext";
import { READ_ONLY_TAB, STALE_TAB } from "../../data/persistence/infra";
import { effectiveProfile } from "../../domain/effectiveProfile";
import { checkProfileContrast } from "../../domain/profileContrast";
import type { ProfileVersion } from "../../domain/profile";
import { RESTART_TEXT as T, contrastText } from "./restartText";

/** 편집기 게이트 대비 줄(engine/gate/contrastRow `contrastIssues`)과 같은 판정 — 적용 값 · 다섯 역할 · enhanced면 강화 기준. 엔진은 프로필 청크에서 import하지 않는다(엔진 import 가드) */
const ROLES = ["primary", "surface", "ink", "muted", "bg"] as const;
const failsOf = ({ base, adjustments }: ProfileVersion) => {
  const applied = effectiveProfile(base, adjustments);
  const palette = ROLES.map((role) => ({ role, hex: applied.color_tokens[role].$value }));
  const level = adjustments.contrast === "enhanced" ? "enhanced" : "aa";
  return checkProfileContrast(palette, applied.component_choices.card_style?.surfaceTone, level).filter((c) => !c.pass).length;
};
const FULL = "w-full md:w-auto";

export default function RestartDialog({
  projectId,
  profileId,
  version,
  selected,
  doc: opened,
  load,
  go,
  onClose,
}: {
  readonly projectId: string;
  readonly profileId: string;
  /** 보는 버전 = 새 문서의 프로필 버전 */
  readonly version: number;
  readonly selected: string;
  /** DOC_EXISTS가 동봉한 지금 문서 */
  readonly doc: DocHead;
  readonly load: ProjectLoader;
  readonly go: (state: StudioEntryState) => void;
  readonly onClose: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const profiles = useProfileRepository();
  const [doc, setDoc] = useState(opened);
  const [busy, setBusy] = useState(false);
  /** 연타 막기 — 상태는 다음 렌더까지 옛 값이라 ref로 */
  const running = useRef(false);
  const [alert, setAlert] = useState<{ readonly text: string; readonly retry: boolean; readonly key: number }>();
  /** 커밋 뒤 미확인 — 이 탭 메모리는 이미 새 문서 */
  const [unconfirmed, setUnconfirmed] = useState(false);
  /** R-D5 — 그 줄을 계산한 문서 버전과 함께(STALE_DOC로 doc이 바뀌면 옛 줄을 쓰지 않는다) */
  const [contrast, setContrast] = useState<{ readonly from: number; readonly text?: string }>();

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  useLayoutEffect(() => title.current?.focus(), []);
  // R-D5 — 두 버전의 대비 결과(편집기 게이트와 같은 판정). 못 읽으면 줄 없음
  useEffect(() => {
    if (doc.profileVersion === version) return;
    let live = true;
    profiles.getProfile(profileId).then(
      (series) => {
        const now = series?.versions.find((v) => v.version === doc.profileVersion);
        const next = series?.versions.find((v) => v.version === version);
        if (live && now && next) setContrast({ from: now.version, text: contrastText(now.version, failsOf(now), next.version, failsOf(next)) });
      },
      () => undefined,
    );
    return () => void (live = false);
  }, [profiles, profileId, doc.profileVersion, version]);

  const dismiss = () => {
    dialog.current?.close();
    onClose();
  };
  const show = (text: string, retry: boolean) => setAlert((a) => ({ text, retry, key: (a?.key ?? 0) + 1 }));

  const run = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    const before = doc;
    let repo: Awaited<ReturnType<ProjectLoader>> | undefined;
    try {
      repo = await load();
      const started = await repo.startDoc(projectId, version, selected, "restart", before.revision);
      return go({ changes: started.changes, editNotice: T.done(selected, version, before, started.changeNotice) });
    } catch (error: unknown) {
      const { code, alert: text, doc: latest, message = "" } = (error ?? {}) as { code?: string; alert?: string; doc?: DocHead; message?: string };
      if (code === "STALE_DOC" && latest) {
        setDoc(latest);
        show(T.stale(latest.revision), false);
      } else if (code === "UNKNOWN_VARIANT") show(text || T.failed, false);
      else if (await committed(repo, before)) {
        setUnconfirmed(true);
        show(T.unconfirmed, true);
      } else if (code === "INFRA" && message.includes(READ_ONLY_TAB)) show(T.readonly, true);
      else if (code === "INFRA" && message.includes(STALE_TAB)) show(T.staleTab, false);
      else show(T.failed, true);
    }
    running.current = false;
    setBusy(false);
  };
  /** 실패 뒤 메모리 문서가 이 요청의 새 문서인가 — 커밋 뒤 flush·응답 실패(R-E4) */
  const committed = async (repo: Awaited<ReturnType<ProjectLoader>> | undefined, before: DocHead) => {
    const now = await repo?.getDoc(projectId).catch(() => undefined);
    return Boolean(now && now.revision === before.revision + 1 && now.candidateId === selected && now.profileVersion === version);
  };
  const open = () => {
    if (running.current) return;
    go({ editNotice: unconfirmed ? T.opened(selected, version) : T.opened(doc.candidateId, doc.profileVersion) });
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        if (!running.current) dismiss();
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
            {alert.retry && (
              <Button size="sm" variant="outline" aria-disabled={busy || undefined} onClick={() => void run()}>
                {T.retry}
              </Button>
            )}
          </div>
        )}
        {/* DOM = 취소 → 편집기 열기 → 새로 시작(대화상자 관례) · <768 세로 쌓기 주 버튼 맨 위(col-reverse) · ≥768 끝 정렬 한 줄 */}
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="outline" className={FULL} aria-disabled={busy || undefined} onClick={() => !running.current && dismiss()}>
            {T.cancel}
          </Button>
          <Button variant="outline" className={FULL} aria-disabled={busy || undefined} onClick={open}>
            {unconfirmed ? T.openUnconfirmed(selected, version) : T.open(doc)}
          </Button>
          {!unconfirmed && (
            <Button className={FULL} aria-busy={busy || undefined} aria-disabled={busy || undefined} onClick={() => void run()}>
              {busy ? T.starting : T.start(selected)}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}

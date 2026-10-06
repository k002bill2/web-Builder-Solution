import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { ProjectRepository } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { UseDocSave } from "../../features/studio/useDocSave";
import { Button } from "../ds/Button";
import type { Snapshot, SnapshotLayerProps } from "./useSnapshots";

const REASON_ID = "snapshot-preview-reason";
const LOCK = "button, input, select, textarea";
const BLOCKED = ["click", "keydown", "beforeinput", "input", "change"] as const;

/**
 * 편집 잠금(ER SPEC r1 3.2 · 7절 "비활성") — 편집 틀 안 컨트롤 전부 `aria-disabled` + 같은 이유. 미리보기 Callout · 탭 · 미리보기 폭(`data-preview-keep`)은 그대로.
 * 탭 전환 등으로 새로 그려진 컨트롤도 잠근다(MutationObserver). 누르기·입력은 capture에서 막는다(Tab 이동은 그대로). 끝나면 원래 속성으로 돌린다.
 */
function lockEditing(host: HTMLElement | null) {
  if (!host) return undefined;
  const saved = new Map<Element, readonly [string | null, string | null]>();
  const lock = () => {
    for (const el of host.querySelectorAll(LOCK)) {
      if (saved.has(el) || el.closest("[data-preview-keep]") || el.getAttribute("role") === "tab") continue;
      saved.set(el, [el.getAttribute("aria-disabled"), el.getAttribute("aria-describedby")]);
      el.setAttribute("aria-disabled", "true");
      el.setAttribute("aria-describedby", REASON_ID);
    }
  };
  const block = (event: Event) => {
    const el = event.target instanceof Element ? event.target.closest(LOCK) : null;
    if (!el || !saved.has(el) || (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    event.stopPropagation();
  };
  lock();
  const observer = new MutationObserver(lock);
  observer.observe(host, { childList: true, subtree: true });
  for (const type of BLOCKED) host.addEventListener(type, block, true);
  return () => {
    observer.disconnect();
    for (const type of BLOCKED) host.removeEventListener(type, block, true);
    saved.forEach(([disabled, described], el) => {
      if (disabled === null) el.removeAttribute("aria-disabled");
      else el.setAttribute("aria-disabled", disabled);
      if (described === null) el.removeAttribute("aria-describedby");
      else el.setAttribute("aria-describedby", described);
    });
  };
}

/**
 * 스냅샷 미리보기 Callout(EDITOR-REST SPEC r1 3.2 · ER-AC-S3·S4·S10) — 조작 뒤 청크. 캔버스는 부르는 쪽이 스냅샷 문서로 그린다(같은 렌더 경로).
 * 열면 포커스 = Callout 제목. "이 스냅샷으로 복원" = 저장 훅 경로(`save.adopt` — 저장 먼저 · revision·스케줄러 동기화) →
 * 알림 문장의 "복원 전" 이름은 목록 마지막에서 읽는다(er-3a 계약). 실패 = `role=alert` 1회 · 포커스는 남는 복원 버튼 그대로.
 */
export default function SnapshotPreview({
  snapshot,
  root,
  save,
  repository,
  projectId,
  isDoc,
  onBack,
  onRestored,
}: {
  readonly snapshot: Snapshot;
  readonly root: RefObject<HTMLElement | null>;
  readonly save: UseDocSave;
  readonly repository: ProjectRepository;
  readonly projectId: string;
  readonly isDoc: SnapshotLayerProps["isDoc"];
  readonly onBack: () => void;
  readonly onRestored: (before: PageDoc, after: PageDoc, text: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const [failed, setFailed] = useState(false);
  // 복원 요청 중에는 돌아가기도 잠근다 — 돌아가 입력하면 늦게 온 복원 결과가 그 입력을 덮는다(Codex r1 P1)
  const [restoring, setRestoring] = useState(false);
  useLayoutEffect(() => {
    const title = box.current?.querySelector<HTMLElement>("h3");
    if (!title) return;
    title.tabIndex = -1;
    title.focus();
  }, []);
  useLayoutEffect(() => lockEditing(root.current), [root]);

  const restore = async () => {
    if (busy.current) return;
    busy.current = true;
    setFailed(false);
    setRestoring(true);
    const before = save.doc;
    try {
      const after = await save.adopt(async (revision) => {
        const restored = await repository.restoreSnapshot(projectId, snapshot.snapshotId, revision);
        if (!isDoc(restored)) throw new Error("복원 결과가 편집 문서 모양이 아닙니다");
        return restored;
      });
      if (!after) throw new Error("저장하지 못해 복원하지 않았습니다");
      const kept = (await repository.listSnapshots(projectId)).at(-1)?.name;
      onRestored(before, after, `스냅샷 '${snapshot.name}'으로 복원했습니다 · 복원 전 상태는 '${kept}'에 있습니다`);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setRestoring(false);
    }
  };

  return (
    <div ref={box} data-preview-keep className="px-4 pt-3">
      {/* ds/Callout 대신 같은 토큰의 자체 마크업 — Callout→Icon import가 진입 공통 청크를 다시 나눈다(실측 +0.4KB · REPORT) */}
      <div className="flex flex-col gap-1.5 rounded-md bg-status-informative-bg p-3.5 text-label-normal">
        <h3 className="ds-label">{`스냅샷 '${snapshot.name}'를 보고 있습니다 · 편집은 멈췄습니다`}</h3>
        <div className="ds-body3">
          <p id={REASON_ID}>스냅샷을 보는 중에는 편집할 수 없습니다</p>
          {restoring && <p>복원하는 중입니다 · 끝나면 편집으로 돌아갑니다</p>}
          {failed && <p role="alert">복원하지 못했습니다 · 다시 시도</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void restore()}>
            이 스냅샷으로 복원
          </Button>
          <Button variant="outline" size="sm" aria-disabled={restoring || undefined} onClick={() => !busy.current && onBack()}>
            편집으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}

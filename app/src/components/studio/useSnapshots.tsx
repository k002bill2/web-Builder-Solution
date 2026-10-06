import { useCallback, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { ProjectRepository, ProjectSnapshot } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { isPageDoc } from "../../features/studio/studioRepository";
import type { UseDocSave } from "../../features/studio/useDocSave";
import { Button } from "../ds/Button";
import { SnapshotLayerLoader } from "./SnapshotLayerLoader";

export type Snapshot = ProjectSnapshot<PageDoc>;
const SNAPSHOT_BUTTON_ID = "studio-snapshot"; // SnapshotLayer.tsx와 같은 값(진입 청크에서 값을 import하지 않는다)

export interface SnapshotState {
  readonly open?: boolean;
  readonly preview?: Snapshot;
  /** 참조 집합에 드는 스냅샷 문서 — 목록은 생성·복원·내보내기·충돌 해결 뒤에만 읽는다 */
  readonly held: readonly PageDoc[];
  /** 복원 직후 알림 줄 "되돌리기" 1건(조작 뒤 청크가 만든다) — 지금 문서가 복원 결과일 때만 보인다 */
  readonly undo?: { readonly before: PageDoc; readonly after: PageDoc; readonly run: () => void };
}

export interface SnapshotContext {
  readonly repository: ProjectRepository;
  readonly projectId: string;
  readonly save: UseDocSave;
  readonly root: RefObject<HTMLElement | null>;
  readonly heading: RefObject<HTMLElement | null>;
  readonly onNotice: (text: string) => void;
}

export interface SnapshotLayerProps extends SnapshotContext {
  readonly state: SnapshotState;
  readonly setState: Dispatch<SetStateAction<SnapshotState>>;
  readonly refresh: () => void;
  /** 진입 청크의 `isPageDoc` — 조작 뒤 청크가 직접 import하면 StudioPage 청크와 그 의존이 진입 청크의 미리 받기 목록에 붙는다(실측 — REPORT) */
  readonly isDoc: typeof isPageDoc;
}

/**
 * 스냅샷 연결(EDITOR-REST SPEC r1 3.2 · 7절). 미리보기 중 = 캔버스가 스냅샷 문서 · 편집 입력 무시(자동 저장 0).
 * 참조 집합 = 스냅샷 문서 전부 + 되돌릴 복원 직전 문서.
 */
export function useSnapshots(ctx: SnapshotContext) {
  const { repository, projectId, save } = ctx;
  const [state, setState] = useState<SnapshotState>({ held: [] });
  // 목록 읽기 실패는 참조 집합을 그대로 둔다(편집을 막지 않는다)
  const refresh = useCallback(
    () =>
      void Promise.resolve()
        .then(() => repository.listSnapshots(projectId))
        .then((list) => setState((s) => ({ ...s, held: list.map((x) => x.doc).filter(isPageDoc) })), () => undefined),
    [repository, projectId],
  );
  const { preview, undo } = state;
  const held = useMemo(() => (undo ? [...state.held, undo.before] : state.held), [state.held, undo]);
  // 편집 경계(Codex r2 P1) — 미리보기를 열고 닫을 때마다 새 구간. 진행 중 비동기 편집(이미지 변환)은 시작 당시 콜백을 쥐고 있으므로
  // 그 콜백도 최신 구간(ref)을 본다: 미리보기 중이거나 미리보기를 지난(복원 포함) 작업은 거절(false) — 부르는 쪽이 반영하지 않는다
  const span = useMemo(() => ({ locked: preview !== undefined }), [preview]);
  const current = useRef(span);
  useLayoutEffect(() => void (current.current = span), [span]);
  // 안정 참조 — 구간이 바뀔 때만 새 함수(useSectionOps 등 의존 콜백이 렌더마다 다시 만들어지지 않게)
  const { edit: write } = save;
  const edit = useCallback(
    (next: PageDoc) => {
      if (span.locked || current.current !== span) return false;
      write(next);
      return true;
    },
    [span, write],
  );
  return {
    preview,
    refresh,
    held,
    edit,
    onUndo: undo?.after === save.doc ? undo.run : undefined,
    button: (
      <Button id={SNAPSHOT_BUTTON_ID} variant="outline" size="sm" className="flex-none aria-disabled:cursor-not-allowed aria-disabled:text-label-disable" onClick={() => setState((s) => ({ ...s, open: true }))}>
        스냅샷
      </Button>
    ),
    // 대화상자 · 미리보기는 조작 뒤 청크(SnapshotLayerLoader) — 진입 청크에는 상태·버튼·참조 집합만 둔다(번들 실측 — REPORT)
    layer: (state.open || preview) && <SnapshotLayerLoader {...ctx} state={state} setState={setState} refresh={refresh} isDoc={isPageDoc} />,
  };
}

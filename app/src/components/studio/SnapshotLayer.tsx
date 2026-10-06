import SnapshotDialog from "./SnapshotDialog";
import SnapshotPreview from "./SnapshotPreview";
import type { SnapshotLayerProps, SnapshotState } from "./useSnapshots";

/** 툴바 "스냅샷" 버튼 id — useSnapshots.tsx와 같은 값 */
const focusButton = () => document.getElementById("studio-snapshot")?.focus();

/**
 * 스냅샷 대화상자 · 미리보기 Callout — 조작 뒤 청크(툴바 "스냅샷"을 눌러야 받는다 · ER-AC-S8).
 * 복원 = 저장 훅 경로(`save.adopt`) · 알림 줄 "되돌리기" 1건 = 복원 직전 문서를 새 편집으로(새 revision).
 * 대화상자는 `showModal()`(최상위 층)이라 캔버스 머리에 함께 두어도 화면 위치는 같다 — 좁은 폭 탭·분할에서도 1개만 그린다.
 */
export default function SnapshotLayer({ repository, projectId, save, root, heading, onNotice, state, setState, refresh, isDoc }: SnapshotLayerProps) {
  const patch = (next: Partial<SnapshotState>) => setState((s) => ({ ...s, ...next }));
  const restored = (before: SnapshotState["held"][number], after: SnapshotState["held"][number], text: string) => {
    const run = () => {
      save.edit(before);
      patch({ undo: undefined });
      onNotice("복원을 되돌렸습니다");
      heading.current?.focus();
    };
    patch({ preview: undefined, undo: { before, after, run } });
    onNotice(text);
    refresh();
    heading.current?.focus();
  };
  return (
    <>
      {state.open && (
        <SnapshotDialog
          repository={repository}
          projectId={projectId}
          isDoc={isDoc}
          flushed={save.flushed}
          onCreated={(name) => {
            onNotice(`스냅샷 '${name}'를 저장했습니다`);
            refresh();
          }}
          // 저장 먼저 — 미리보기 중에는 자동 저장이 나가지 않게(ER-AC-S3)
          onPreview={(snapshot) => void save.flushed().then(() => patch({ open: false, preview: snapshot }))}
          onClose={() => {
            patch({ open: false });
            focusButton();
          }}
        />
      )}
      {state.preview && (
        <SnapshotPreview
          key={state.preview.snapshotId}
          snapshot={state.preview}
          root={root}
          save={save}
          repository={repository}
          projectId={projectId}
          isDoc={isDoc}
          onBack={() => {
            patch({ preview: undefined });
            focusButton();
          }}
          onRestored={restored}
        />
      )}
    </>
  );
}

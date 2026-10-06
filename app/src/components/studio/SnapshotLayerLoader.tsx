import { lazy, Suspense } from "react";
import type { SnapshotLayerProps } from "./useSnapshots";

/** 대화상자 · 미리보기 · 복원 · 되돌리기 처리 — 조작 뒤 청크 1개(ER-AC-S8). 훅 파일에 lazy 컴포넌트를 두지 않는다(fast refresh 규칙) */
const SnapshotLayer = lazy(() => import("./SnapshotLayer"));

export function SnapshotLayerLoader(props: SnapshotLayerProps) {
  return (
    <Suspense fallback={null}>
      <SnapshotLayer {...props} />
    </Suspense>
  );
}

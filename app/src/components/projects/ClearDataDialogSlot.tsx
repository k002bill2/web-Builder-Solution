import { useMemo } from "react";
import { createClearer, type ClearDeps } from "../../features/projects/clearBrowserData";
import ClearDataDialog from "./ClearDataDialog";

/** 지우기 대화상자 + 흐름 본문을 한 조작 뒤 청크로 묶는다(P1C-SPEC 1.6 · 3절) — 열 때 지우기 1개(대기 중 삭제 요청을 재시도가 공유) */
export default function ClearDataDialogSlot({ count, deps, onClose }: { readonly count: number; readonly deps: ClearDeps; readonly onClose: () => void }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clearer = useMemo(() => createClearer(deps), []);
  return <ClearDataDialog count={count} clear={clearer.clear} onClose={onClose} />;
}

import { useMemo } from "react";
import { clearerFor, type ClearDeps } from "../../features/projects/clearBrowserData";
import ClearDataDialog from "./ClearDataDialog";

/** 지우기 대화상자 + 흐름 본문을 한 조작 뒤 청크로 묶는다(P1C-SPEC 1.6 · 3절) — 지우기는 탭당 1개(다시 열어도 보유 잠금·대기 중 삭제 요청을 공유) */
export default function ClearDataDialogSlot({ count, deps, onClose }: { readonly count: number; readonly deps: ClearDeps; readonly onClose: () => void }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clearer = useMemo(() => clearerFor(deps), []);
  return <ClearDataDialog count={count} clear={clearer.clear} onClose={onClose} />;
}

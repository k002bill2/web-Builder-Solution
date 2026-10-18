import { Button } from "../ds/Button";
import { Callout } from "../ds/Callout";
import { DEV_SERVER_UNSUPPORTED } from "../../features/studio/staticHtml/devServer";
import { EXPORT_RELOAD, exportChunk } from "../../features/studio/exportFlowFails";

/**
 * 재시도 가능 실패(E-S27 · m2a 3.2 B) = alert + 다시 시도. 내보내기 청크(exportFlow)·결과 청크(ExportAfter)를 받지 못한 경우에도
 * 떠야 하므로 조작 뒤 청크가 아니라 편집기 청크에 둔다(M2A-3a Codex P2-1 r2 — 실패한 청크에 기대는 안내는 뜨지 않는다).
 * 내보내기 청크를 2회 연속 받지 못했으면 새로고침 안내(B-M4A-08) — 다시 시도도 남긴다(새 URL로 다시 받아 일시 끊김이면 복구된다).
 */
export function ExportRetryAlert({ onRetry, reason }: { readonly onRetry: () => void; readonly reason?: string }) {
  // dev 서버 사유는 다시 눌러도 같은 실패 — 안내만 둔다. dev 전용 분기라 빌드에서는 문장째 빠진다(편집기 진입 청크 예산)
  const retry = !(import.meta.env.DEV && reason === DEV_SERVER_UNSUPPORTED);
  return (
    <div role="alert">
      <Callout
        tone="negative"
        title="내보내지 못했습니다"
        action={
          retry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          )
        }
      >
        {exportChunk.fails > 1 ? EXPORT_RELOAD : reason}
      </Callout>
    </div>
  );
}

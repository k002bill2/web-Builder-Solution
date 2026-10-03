import { Button } from "../ds/Button";
import { Callout } from "../ds/Callout";

/**
 * 재시도 가능 실패(E-S27 · m2a 3.2 B) = alert + 다시 시도. 내보내기 청크(exportFlow)·결과 청크(ExportAfter)를 받지 못한 경우에도
 * 떠야 하므로 조작 뒤 청크가 아니라 편집기 청크에 둔다(M2A-3a Codex P2-1 r2 — 실패한 청크에 기대는 안내는 뜨지 않는다).
 */
export function ExportRetryAlert({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div role="alert">
      <Callout
        tone="negative"
        title="내보내지 못했습니다"
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        }
      />
    </div>
  );
}

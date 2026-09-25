import { useCallback, useState } from "react";

/**
 * effect 안의 비동기 실패를 렌더 단계로 던져 가장 가까운 오류 경계(RouteErrorBoundary)가 잡게 한다.
 * 저장소가 데이터 청크를 지연 로드하므로 조회가 네트워크 오류로 실패할 수 있다 (Codex R2).
 */
export function useThrowToBoundary(): (error: unknown) => void {
  const [, setState] = useState(0);
  return useCallback((error: unknown) => {
    setState(() => {
      throw error;
    });
  }, []);
}

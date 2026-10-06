import { useEffect, useState } from "react";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";
import type { DesignReference } from "../../domain/reference";
import { useCatalogReferenceRepository } from "../catalog/useCatalogRepository";
import type { CompareTray } from "./compareTray";

/**
 * 트레이 id를 레퍼런스로 풀어낸다. 현재 필터와 무관하게 담긴 항목을 모두 보여주기 위해 단건 조회를 쓴다.
 * 저장소 = 카탈로그 목록과 같은 큐레이션 + 생성 카드(생성 카드를 담아도 트레이에 보이게 — M3P-1 Codex P2-1).
 */
export function useTrayReferences(tray: CompareTray): readonly DesignReference[] {
  const repository = useCatalogReferenceRepository();
  const fail = useThrowToBoundary();
  const [references, setReferences] = useState<readonly DesignReference[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(tray.map((id) => repository.getById(id))).then(
      (found) => {
        if (!cancelled) setReferences(found.filter((r): r is DesignReference => r !== undefined));
      },
      (error: unknown) => {
        if (!cancelled) fail(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, tray, fail]);
  return references;
}

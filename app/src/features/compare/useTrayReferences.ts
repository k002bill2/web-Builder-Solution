import { useEffect, useState } from "react";
import { useReferenceRepository } from "../../data/ReferenceRepositoryContext";
import type { DesignReference } from "../../domain/reference";
import type { CompareTray } from "./compareTray";

/** 트레이 id를 레퍼런스로 풀어낸다. 현재 필터와 무관하게 담긴 항목을 모두 보여주기 위해 단건 조회를 쓴다. */
export function useTrayReferences(tray: CompareTray): readonly DesignReference[] {
  const repository = useReferenceRepository();
  const [references, setReferences] = useState<readonly DesignReference[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(tray.map((id) => repository.getById(id))).then((found) => {
      if (!cancelled) setReferences(found.filter((r): r is DesignReference => r !== undefined));
    });
    return () => {
      cancelled = true;
    };
  }, [repository, tray]);
  return references;
}

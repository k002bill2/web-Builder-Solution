import { useEffect, useState } from "react";
import { useReferenceRepository } from "../../data/ReferenceRepositoryContext";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";
import type { DesignReference, ReferenceQuery } from "../../domain/reference";

interface ListState {
  readonly query: ReferenceQuery;
  readonly items: readonly DesignReference[];
}

/** 조회 조건이 바뀌면 저장소에서 다시 읽는다. 응답 전에는 이전 결과를 유지한다. */
export function useReferenceList(query: ReferenceQuery) {
  const repository = useReferenceRepository();
  const fail = useThrowToBoundary();
  const [state, setState] = useState<ListState | null>(null);
  useEffect(() => {
    let cancelled = false;
    repository.list(query).then(
      (items) => {
        if (!cancelled) setState({ query, items });
      },
      (error: unknown) => {
        if (!cancelled) fail(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, query, fail]);
  return { items: state?.items ?? [], loaded: state !== null, pending: state?.query !== query };
}

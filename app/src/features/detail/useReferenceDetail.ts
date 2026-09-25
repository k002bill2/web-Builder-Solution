import { useEffect, useState } from "react";
import { useReferenceRepository } from "../../data/ReferenceRepositoryContext";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";
import type { DesignReference } from "../../domain/reference";
import type { ReferenceDetail, SimilarGroup } from "../../domain/referenceDetail";

interface Loaded {
  readonly id: string;
  readonly reference: DesignReference | undefined;
  readonly detail: ReferenceDetail | undefined;
  readonly similar: readonly SimilarGroup[];
}

export type ReferenceDetailState =
  | { readonly status: "loading" }
  | { readonly status: "not-found" }
  | {
      readonly status: "ready";
      readonly reference: DesignReference;
      readonly detail: ReferenceDetail;
      readonly similar: readonly SimilarGroup[];
    };

/**
 * id의 레퍼런스·상세·유사 그룹을 함께 읽는다.
 * 응답이 현재 id의 것일 때만 쓰므로, id가 바뀌면(유사 레퍼런스 이동) 이전 내용 대신 로딩 상태가 된다.
 */
export function useReferenceDetail(id: string): ReferenceDetailState {
  const repository = useReferenceRepository();
  const fail = useThrowToBoundary();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([repository.getById(id), repository.getDetail(id), repository.getSimilar(id)]).then(
      ([reference, detail, similar]) => {
        if (!cancelled) setLoaded({ id, reference, detail, similar });
      },
      (error: unknown) => {
        if (!cancelled) fail(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, id, fail]);

  if (!loaded || loaded.id !== id) return { status: "loading" };
  if (!loaded.reference || !loaded.detail) return { status: "not-found" };
  return { status: "ready", reference: loaded.reference, detail: loaded.detail, similar: loaded.similar };
}

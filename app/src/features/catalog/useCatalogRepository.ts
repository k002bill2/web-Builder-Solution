import { useMemo } from "react";
import { createDeferredReferenceRepository } from "../../data/deferredReferenceRepository";
import { useReferenceRepository } from "../../data/ReferenceRepositoryContext";
import { createMemoryReferenceRepository, type ReferenceRepository } from "../../data/referenceRepository";

/**
 * 생성 레퍼런스 카드 로더 — 큐레이션 6개로 쓴 카탈로그 동작 테스트가 빈 목록으로 바꿔 끼운다(SPEC m3p 8.3 "큐레이션 6개만 주입").
 * 생성 포함 목록은 CatalogGenerated.test가 실제 로더로 확인한다.
 */
export const GENERATED_CARDS = {
  load: async () => (await import("../../fixtures/generatedReferences")).generatedReferenceFixtures,
};

/**
 * 카탈로그 목록 저장소 = 큐레이션(노출 규칙 적용 뒤 `base.list()`) + 생성 레퍼런스 카드(라우트 쪽 로더 — SPEC m3p 6절 · MQ-M3P-7 A).
 * 목록·facet만 쓰므로 생성 카드 청크만 처음 조회할 때 받는다(상세·비교 청크는 상세 화면·보드가 받는다 — data/generatedCatalog).
 */
export function useCatalogReferenceRepository(): ReferenceRepository {
  const base = useReferenceRepository();
  return useMemo(
    () => createDeferredReferenceRepository(async () => createMemoryReferenceRepository([...(await base.list()), ...(await GENERATED_CARDS.load())])),
    [base],
  );
}

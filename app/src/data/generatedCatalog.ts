/**
 * 생성 레퍼런스 청크(SPEC m3p 6절 · MQ-M3P-7 A) — 픽스처 3벌과 병합 함수. main·공통 지연 저장소는 받지 않는다.
 * 부르는 곳(각자 `import()` — 작은 공유 청크를 만들지 않으려고 로더를 모듈로 빼지 않는다): 상세 훅(useReferenceDetail) · 보드에 카탈로그 밖 id를 담을 때
 * (memoryCompareBoardRepository). 카탈로그 목록(useCatalogRepository)·프로필 생성 출처(useProfileDetail)는 카드 픽스처 청크만 받는다
 */
import type { ComparisonCatalog } from "../domain/comparisonCells";
import { generatedReferenceComparisonAttributes, generatedReferenceDetailFixtures } from "../fixtures/generatedReferenceDetails";
import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { createMemoryReferenceRepository, type ReferenceRepository } from "./referenceRepository";
import { createSharedLoader } from "./sharedLoader";

/**
 * 큐레이션 저장소 + 생성 레퍼런스. 목록·생성 id는 합친 저장소(필터·정렬·유사 추천 노출 규칙 그대로), 큐레이션 id의 상세·유사 추천은 원래 저장소.
 * 큐레이션 목록은 `base.list()`(노출 규칙 적용 뒤)에서 읽는다 — 원래 저장소가 테스트 주입이어도 같은 규칙.
 */
export function withGeneratedReferences(base: ReferenceRepository): ReferenceRepository {
  const merged = createSharedLoader(async () =>
    createMemoryReferenceRepository([...(await base.list()), ...generatedReferenceFixtures], generatedReferenceDetailFixtures),
  );
  const generatedIds = new Set(generatedReferenceFixtures.map((r) => r.id));
  const of = async (id: string) => (generatedIds.has(id) ? merged() : base);
  return {
    list: async (query) => (await merged()).list(query),
    getById: async (id) => (await of(id)).getById(id),
    getDetail: async (id) => (await of(id)).getDetail(id),
    getSimilar: async (id) => (await of(id)).getSimilar(id),
  };
}

/** 비교 보드 카탈로그 + 생성 레퍼런스 (보드에 생성 레퍼런스를 담을 때만 — memoryCompareBoardRepository) */
export function withGeneratedCatalog(catalog: ComparisonCatalog): ComparisonCatalog {
  return {
    references: [...catalog.references, ...generatedReferenceFixtures],
    details: { ...catalog.details, ...generatedReferenceDetailFixtures },
    attributes: { ...catalog.attributes, ...generatedReferenceComparisonAttributes },
  };
}

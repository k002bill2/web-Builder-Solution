import { colorFamilyOf } from "../domain/colorFamily";
import {
  EXPOSED_LICENSE_STATUSES,
  type DesignReference,
  type LicenseStatus,
  type ReferenceQuery,
  type SortKey,
} from "../domain/reference";
import { SIMILAR_KINDS, SIMILAR_LIMIT, type ReferenceDetail, type SimilarGroup } from "../domain/referenceDetail";

/** 화면이 의존하는 유일한 데이터 경계. 백엔드 연결 시 이 인터페이스를 유지한다 (ADR-001). */
export interface ReferenceRepository {
  list(query?: ReferenceQuery): Promise<readonly DesignReference[]>;
  getById(id: string): Promise<DesignReference | undefined>;
  /** 상세 화면 데이터 (FR-CAT-03). 비노출·없는 id는 undefined. */
  getDetail(id: string): Promise<ReferenceDetail | undefined>;
  /** 유사 업종·콘셉트·레이아웃 3그룹. 그룹마다 자기 자신·비노출 제외, 최대 6개 (T-API-CAT-04). */
  getSimilar(id: string): Promise<readonly SimilarGroup[]>;
}

/** FR-CAT-04: internal·licensed 만 노출한다. 다른 모든 필터보다 먼저 적용된다. */
function isExposed(ref: DesignReference): boolean {
  return (EXPOSED_LICENSE_STATUSES as readonly LicenseStatus[]).includes(ref.licenseStatus);
}

/** 선택이 비어 있으면 제약 없음, 아니면 하나라도 겹치면 통과 (그룹 안 OR). */
function anyOf<T>(selected: readonly T[] | undefined, values: readonly T[]): boolean {
  return !selected || selected.length === 0 || selected.some((s) => values.includes(s));
}

function matches(ref: DesignReference, q: ReferenceQuery): boolean {
  return (
    (q.industry === undefined || ref.industry === q.industry) &&
    anyOf(q.audience, ref.audience) &&
    anyOf(q.concept, ref.visualTags) &&
    anyOf(q.layout, [ref.layoutType]) &&
    anyOf(q.purpose, ref.purpose) &&
    anyOf(q.license, [ref.licenseStatus]) &&
    (q.motion === undefined || ref.motionLevel === q.motion) &&
    anyOf(q.color, [colorFamilyOf(ref.colorPalette.primary)]) &&
    anyOf(q.device, ref.devices)
  );
}

const totalScore = (ref: DesignReference) => ref.scores.accessibility + ref.scores.performance;

const COMPARATORS: Record<SortKey, (a: DesignReference, b: DesignReference) => number> = {
  score: (a, b) => totalScore(b) - totalScore(a),
  latest: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

export function createMemoryReferenceRepository(
  records: readonly DesignReference[],
  details: Readonly<Record<string, ReferenceDetail>> = {},
): ReferenceRepository {
  const exposed = records.filter(isExposed);
  const byId = new Map(exposed.map((ref) => [ref.id, ref]));
  const detailOf = (id: string) => (byId.has(id) ? details[id] : undefined);

  /** 큐레이션 id 목록 → 자기 자신·중복·비노출·없는 id 제거 후 상한까지. */
  const resolveSimilar = (selfId: string, ids: readonly string[]) =>
    [...new Set(ids)]
      .filter((id) => id !== selfId)
      .flatMap((id) => byId.get(id) ?? [])
      .slice(0, SIMILAR_LIMIT);

  return {
    async list(query = {}) {
      const found = exposed.filter((ref) => matches(ref, query));
      return query.sort ? [...found].sort(COMPARATORS[query.sort]) : found;
    },
    async getById(id) {
      return byId.get(id);
    },
    async getDetail(id) {
      return detailOf(id);
    },
    async getSimilar(id) {
      const similar = detailOf(id)?.similar;
      return SIMILAR_KINDS.map((kind) => ({ kind, items: similar ? resolveSimilar(id, similar[kind]) : [] }));
    },
  };
}

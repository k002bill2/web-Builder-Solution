import {
  EXPOSED_LICENSE_STATUSES,
  type DesignReference,
  type LicenseStatus,
  type ReferenceQuery,
  type SortKey,
} from "../domain/reference";

/** 화면이 의존하는 유일한 데이터 경계. 백엔드 연결 시 이 인터페이스를 유지한다 (ADR-001). */
export interface ReferenceRepository {
  list(query?: ReferenceQuery): Promise<readonly DesignReference[]>;
  get(id: string): Promise<DesignReference | undefined>;
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
    (q.motion === undefined || ref.motionLevel === q.motion)
  );
}

const totalScore = (ref: DesignReference) => ref.scores.accessibility + ref.scores.performance;

const COMPARATORS: Record<SortKey, (a: DesignReference, b: DesignReference) => number> = {
  score: (a, b) => totalScore(b) - totalScore(a),
  latest: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

export function createMemoryReferenceRepository(records: readonly DesignReference[]): ReferenceRepository {
  const exposed = records.filter(isExposed);
  return {
    async list(query = {}) {
      const found = exposed.filter((ref) => matches(ref, query));
      return query.sort ? [...found].sort(COMPARATORS[query.sort]) : found;
    },
    async get(id) {
      return exposed.find((ref) => ref.id === id);
    },
  };
}

/**
 * 추천 점수 (RECO-SPEC r1 2절 · 7a — scoring_version reco-v1). 순수 함수 — LLM·저장소·Date·Math.random·로캘 정렬 0.
 * 입력 = 카탈로그 필터 4축(업종·목적·타깃·콘셉트). 품질 2항목은 순위 점수 밖(RQ-02 B, 만점 70) — 근거 표시만.
 */
import type { AudienceId, DesignReference, IndustryId, PurposeId, ReferenceQuery, VisualTagId } from "./reference";

export const RECO_SCORING_VERSION = "reco-v1";
/** 엔진 반환 개수(FR-SEL-03 · T-REC-01). 화면 첫 노출은 3(RQ-07 A) */
export const RECO_LIMIT = 5;
export const RECO_REASON_COUNT = 3;

export type RecoItemKey = "industry" | "purpose" | "mood" | "sections" | "audience" | "accessibility" | "performance";
export type RecoReasonState = "match" | "partial" | "miss" | "no-input" | "unmeasured";
/** 필수 섹션 판정이 있는 목적(R-04 booking · R-03 inquiry). sales는 판정 규칙 없음 → k에서 뺀다(RQ-06) */
export type SectionFitPurpose = "booking" | "inquiry";
/** 레퍼런스 id → 충족 목적 (엔진 판정 파생 표 — recommendSectionFit.ts) */
export type RecoSectionFit = Readonly<Record<string, readonly SectionFitPurpose[]>>;

/** 2.1 표 항목 순서 = 근거 동점 정렬 순서 */
export const RECO_ITEMS: readonly RecoItemKey[] = Object.freeze(["industry", "purpose", "mood", "sections", "audience", "accessibility", "performance"]);
/** 순위 점수 만점(RQ-02 B — 품질 2항목 0, 합 70) */
export const RECO_WEIGHTS: Readonly<Record<RecoItemKey, number>> = Object.freeze({
  industry: 15,
  purpose: 10,
  mood: 10,
  sections: 20,
  audience: 15,
  accessibility: 0,
  performance: 0,
});

export interface RecoBrief {
  readonly industry?: IndustryId;
  /** 중복 제거 + 코드 단위 사전순 */
  readonly purpose: readonly PurposeId[];
  readonly audience: readonly AudienceId[];
  readonly mood: readonly VisualTagId[];
}

export interface RecoReason {
  readonly item: RecoItemKey;
  readonly points: number;
  readonly max: number;
  /** 일치 값 id(코드 순) */
  readonly matched: readonly string[];
  readonly state: RecoReasonState;
  /** 문구 키 `reco.reason.<item>.<state>` (문안은 키 표 — Hemingway) */
  readonly key: string;
  /** 품질 항목 측정값(0~100) — 측정했을 때만. 순위 점수에는 넣지 않는다 */
  readonly value?: number;
}

export interface RecoResult {
  readonly referenceId: string;
  readonly total: number;
  readonly max: number;
  /** 정확히 3개 — (점수 내림차순, 항목 순) */
  readonly reasons: readonly RecoReason[];
  /** 7항목 — 항목 순 */
  readonly breakdown: readonly RecoReason[];
}

/** 총점 만점 = 배점 합(RQ-02 B → 70) */
const RECO_MAX = RECO_ITEMS.reduce((sum, item) => sum + RECO_WEIGHTS[item], 0);
const SECTION_FIT_PURPOSES: readonly SectionFitPurpose[] = Object.freeze(["booking", "inquiry"]);
const MOOD_POINTS_PER_MATCH = 5;
const EMPTY: readonly string[] = Object.freeze([]);

/** 코드 단위 비교 — localeCompare 금지(로캘 의존) */
const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** 중복 제거 + 코드 단위 사전순 + 동결(입력 순서가 결과를 바꾸지 않게) */
function normalize<T extends string>(values: readonly T[] | undefined): readonly T[] {
  return Object.freeze([...new Set(values ?? [])].sort(byCodeUnit));
}

function normalizeBrief(industry: IndustryId | undefined, purpose?: readonly PurposeId[], audience?: readonly AudienceId[], mood?: readonly VisualTagId[]): RecoBrief {
  return Object.freeze({
    ...(industry === undefined ? {} : { industry }),
    purpose: normalize(purpose),
    audience: normalize(audience),
    mood: normalize(mood),
  });
}

function reason(item: RecoItemKey, points: number, state: RecoReasonState, matched: readonly string[] = EMPTY, value?: number): RecoReason {
  return Object.freeze({
    item,
    points,
    max: RECO_WEIGHTS[item],
    matched: Object.freeze([...matched]),
    state,
    key: `reco.reason.${item}.${state}`,
    ...(value === undefined ? {} : { value }),
  });
}

/** wanted가 정렬돼 있으므로 결과도 코드 순 */
const intersect = <T extends string>(wanted: readonly T[], have: readonly T[]): readonly T[] => wanted.filter((v) => have.includes(v));

function industryReason(wanted: IndustryId | undefined, have: IndustryId): RecoReason {
  if (wanted === undefined) return reason("industry", 0, "no-input");
  return wanted === have ? reason("industry", RECO_WEIGHTS.industry, "match", [have]) : reason("industry", 0, "miss");
}

/** purpose·audience — 교집합이 있으면 만점 */
function overlapReason<T extends string>(item: "purpose" | "audience", wanted: readonly T[], have: readonly T[]): RecoReason {
  if (wanted.length === 0) return reason(item, 0, "no-input");
  const matched = intersect(wanted, have);
  return matched.length > 0 ? reason(item, RECO_WEIGHTS[item], "match", matched) : reason(item, 0, "miss");
}

/** 교집합 × 5, 최대 10 — 2개 이상 match · 1개 partial */
function moodReason(wanted: readonly VisualTagId[], have: readonly VisualTagId[]): RecoReason {
  if (wanted.length === 0) return reason("mood", 0, "no-input");
  const matched = intersect(wanted, have);
  const points = Math.min(matched.length * MOOD_POINTS_PER_MATCH, RECO_WEIGHTS.mood);
  const state: RecoReasonState = matched.length >= 2 ? "match" : matched.length === 1 ? "partial" : "miss";
  return reason("mood", points, state, matched);
}

/** 판정 규칙 있는 목적 k개 중 충족 m개 — sales는 k에서 뺀다(RQ-06). 표에 없는 id = 충족 0 */
function sectionsReason(purpose: readonly PurposeId[], satisfied: readonly SectionFitPurpose[]): RecoReason {
  const judged = SECTION_FIT_PURPOSES.filter((p) => purpose.includes(p));
  if (judged.length === 0) return reason("sections", 0, "no-input");
  const matched = judged.filter((p) => satisfied.includes(p));
  if (matched.length === 0) return reason("sections", 0, "miss");
  if (matched.length === judged.length) return reason("sections", RECO_WEIGHTS.sections, "match", matched);
  return reason("sections", matched.length * Math.floor(RECO_WEIGHTS.sections / judged.length), "partial", matched);
}

/** 품질 항목은 순위 점수 밖(RQ-02 B) — 측정값만 그대로 싣고, 미측정은 숫자를 만들지 않는다 */
function qualityReason(item: "accessibility" | "performance", scores: DesignReference["scores"]): RecoReason {
  if ("status" in scores) return reason(item, 0, "unmeasured");
  return reason(item, 0, "match", EMPTY, scores[item]);
}

function scoreReference(brief: RecoBrief, ref: DesignReference, fit: RecoSectionFit): RecoResult {
  const satisfied = Object.hasOwn(fit, ref.id) ? (fit[ref.id] ?? []) : [];
  const breakdown: readonly RecoReason[] = Object.freeze([
    industryReason(brief.industry, ref.industry),
    overlapReason("purpose", brief.purpose, ref.purpose),
    moodReason(brief.mood, ref.visualTags),
    sectionsReason(brief.purpose, satisfied),
    overlapReason("audience", brief.audience, ref.audience),
    qualityReason("accessibility", ref.scores),
    qualityReason("performance", ref.scores),
  ]);
  // 안정 정렬 → 동점은 RECO_ITEMS 순서 유지
  const reasons = Object.freeze([...breakdown].sort((a, b) => b.points - a.points).slice(0, RECO_REASON_COUNT));
  const total = breakdown.reduce((sum, r) => sum + r.points, 0);
  return Object.freeze({ referenceId: ref.id, total, max: RECO_MAX, reasons, breakdown });
}

/** 카탈로그 필터 → 추천 입력(정규화). 레이아웃·라이선스·모션 등은 점수에 쓰지 않는다 */
export function parseRecoBrief(filters: Pick<ReferenceQuery, "industry" | "purpose" | "audience" | "concept">): RecoBrief {
  return normalizeBrief(filters.industry, filters.purpose, filters.audience, filters.concept);
}

/** 업종·목적 둘 다 없으면 계산하지 않는다(근거 부족) */
export function hasRecoBrief(brief: RecoBrief): boolean {
  return brief.industry !== undefined || brief.purpose.length > 0;
}

/** 노출 후보만 · 총점 내림차순 · 동점 id 코드 단위 오름차순 · 총점 0 제외 · 최대 RECO_LIMIT · 동결 새 배열 */
export function recommend(brief: RecoBrief, references: readonly DesignReference[], fit: RecoSectionFit): readonly RecoResult[] {
  if (!hasRecoBrief(brief)) return Object.freeze([]);
  const normalized = normalizeBrief(brief.industry, brief.purpose, brief.audience, brief.mood);
  const ranked = references
    .filter((ref) => ref.licenseStatus !== "external_observed")
    .map((ref) => scoreReference(normalized, ref, fit))
    .filter((result) => result.total > 0)
    .sort((a, b) => b.total - a.total || byCodeUnit(a.referenceId, b.referenceId));
  return Object.freeze(ranked.slice(0, RECO_LIMIT));
}

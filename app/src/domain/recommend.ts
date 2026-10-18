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

/** 카탈로그 필터 → 추천 입력(정규화). 레이아웃·라이선스·모션 등은 점수에 쓰지 않는다 */
export function parseRecoBrief(filters: Pick<ReferenceQuery, "industry" | "purpose" | "audience" | "concept">): RecoBrief {
  void filters;
  throw new Error("E1 미구현");
}

/** 업종·목적 둘 다 없으면 계산하지 않는다(근거 부족) */
export function hasRecoBrief(brief: RecoBrief): boolean {
  void brief;
  throw new Error("E1 미구현");
}

/** 노출 후보만 · 총점 내림차순 · 동점 id 코드 단위 오름차순 · 총점 0 제외 · 최대 RECO_LIMIT · 동결 새 배열 */
export function recommend(brief: RecoBrief, references: readonly DesignReference[], fit: RecoSectionFit): readonly RecoResult[] {
  void brief;
  void references;
  void fit;
  throw new Error("E1 미구현");
}

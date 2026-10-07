/**
 * 3안 구조안 생성 타입 (DS-2A-04 SPEC 6.2 · 4). 가벼운 타입·상수만 — 계산(`composeCandidates`·`lintPlan`)은 생성 클릭 뒤 청크.
 * 생성은 **저장된 프로필 버전의 적용된 값**으로만 한다(2.1). 잡 모양(요청 → 상태 → 결과)이라 M2 서버 생성기는 구현만 바꾼다(4.1).
 *
 * L4c 연결 이음새 — `toEngineCandidate`: 엔진 `createDocFromCandidate(plan, profileVersion, start)`의 첫 인자
 * (`candidateId`·`sections`·`libraryVersion`·`generatorVersion`)와 같은 구조 타입을 만든다. engine을 import하지 않는다
 * (화면 런타임 import 0 — `engineImportGuard`). 편집 시작(startDoc)은 2a-05 a1 — 여기서는 모양만 맞춘다.
 */
import type { MotionPreset, SectionPlanEntry } from "./compareBoard";

export type CandidateId = "A" | "B" | "C";
export const CANDIDATE_IDS: readonly CandidateId[] = Object.freeze(["A", "B", "C"] as const);
export type GridStyle = "grid-3" | "grid-2" | "masonry";
export type JobState = "queued" | "running" | "succeeded" | "partial" | "failed";
/** NOT_FOUND = 없는 프로필 버전·잡(저장소 경계) */
export type GenerationErrorCode = "UNSUPPORTED_COMBINATION" | "SCHEMA_INVALID" | "JOB_TIMEOUT" | "INFRA" | "NOT_FOUND";

/** 구조안 생성기 버전 (4.5). M2 = 서버 생성기 버전 */
export const GENERATOR_VERSION = "preview-1";

export interface CandidateAxes {
  readonly heroVariant: string;
  readonly grid: GridStyle;
  readonly typeScale: number;
}

export interface PlannedSection extends SectionPlanEntry {
  readonly motion: MotionPreset;
}

export type LintRule = "R-01" | "R-02" | "R-03" | "R-04" | "R-07" | "R-08" | "R-12";

export interface LintIssue {
  readonly rule: LintRule;
  /** block = 발행 차단 대상(2a-04는 경고로만 표시) · info = 정보 */
  readonly severity: "block" | "info";
  /** 원인 · 대체안 */
  readonly message: string;
  readonly sectionIndex?: number;
}

export interface CandidatePlan {
  readonly id: CandidateId;
  readonly axes: CandidateAxes;
  readonly sections: readonly PlannedSection[];
  /** FR-GEN-05 3줄: 적용 규칙 · 축 변경 · 제외 후보 */
  readonly summary: readonly [string, string, string];
  /** 전체 로그 */
  readonly log: readonly string[];
  readonly lint: readonly LintIssue[];
  /** FNV-1a 8자리 (profileDraft와 같은 함수) */
  readonly hash: string;
}

export type CandidateFailure = {
  readonly id: CandidateId;
  readonly status: "failed";
  readonly errorCode: GenerationErrorCode;
  readonly retryable: boolean;
  readonly message: string;
};

export type CandidateResult =
  | { readonly id: CandidateId; readonly status: "succeeded"; readonly plan: CandidatePlan }
  | CandidateFailure
  | { readonly id: CandidateId; readonly status: "pending" };

/** 생성기가 끝낸 결과(보류 없음) — composeCandidates 출력 */
export type ComposedResult = Exclude<CandidateResult, { readonly status: "pending" }>;

export interface GenerationJob {
  readonly jobId: string;
  readonly profileId: string;
  readonly version: number;
  readonly libraryVersion: string;
  readonly generatorVersion: string;
  readonly seed: string;
  readonly state: JobState;
  /** 항상 A·B·C 3개 */
  readonly candidates: readonly CandidateResult[];
  readonly selected?: CandidateId;
}

/** 종료 상태 — 화면 조회(1초 간격)를 멈춘다 (6.3) */
/** 후보 진행 상태 → 잡 상태(메모리 생성 저장소 getJob · 영속 잡 검증 jobRecord가 함께 쓴다) — pending 있음 = running · 전부 성공 = succeeded · 일부 = partial · 0 = failed */
export function stateOf(candidates: readonly Pick<CandidateResult, "status">[]): JobState {
  if (candidates.some((c) => c.status === "pending")) return "running";
  const ok = candidates.filter((c) => c.status === "succeeded").length;
  return ok === candidates.length ? "succeeded" : ok > 0 ? "partial" : "failed";
}

export const isTerminal = (state: JobState): boolean => state === "succeeded" || state === "partial" || state === "failed";

/** 엔진 `createDocFromCandidate` 첫 인자와 같은 구조 (L4c 이음새, 2a-05 8.2) */
export interface EngineCandidateInput {
  readonly candidateId: string;
  readonly sections: readonly SectionPlanEntry[];
  readonly libraryVersion: string;
  readonly generatorVersion: string;
}

export function toEngineCandidate(job: GenerationJob, plan: CandidatePlan): EngineCandidateInput {
  return {
    candidateId: plan.id,
    sections: plan.sections.map(({ type, variant }) => ({ type, variant })),
    libraryVersion: job.libraryVersion,
    generatorVersion: job.generatorVersion,
  };
}

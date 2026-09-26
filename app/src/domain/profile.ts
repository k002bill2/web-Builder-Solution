/**
 * 디자인 프로필 버전 타입 (DS-2A-04 SPEC 6.2). 가벼운 타입만 둔다 — zod·계산은 엔진 청크.
 * 버전 = 보드 유래 `base` + 프로필 화면 소유 `adjustments`, 번호는 계열 하나 (6.1-1·2).
 * `compareBoard.ts`와는 서로 `import type`만 한다(런타임 순환 0, P-B5).
 */
import type { DesignProfileInput, MotionPreset } from "./compareBoard";
import type { ContrastCheckId } from "./contrast";
import type { PurposeId } from "./reference";
import type { PaletteRole } from "./referenceDetail";

export type Density = "comfortable" | "compact";
export type ContrastLevel = "aa" | "enhanced";
export type ProfileOrigin = "board" | "board-reconfirm" | "adjust" | "revert";

export interface PaletteCorrection {
  readonly role: PaletteRole;
  /** #RRGGBB (적용 당시 base 값) */
  readonly from: string;
  readonly to: string;
  readonly check: ContrastCheckId;
}

/** 프로필 화면 소유 필드. 없으면 base 값 그대로 */
export interface ProfileAdjustments {
  readonly density?: Density;
  readonly contrast?: ContrastLevel;
  readonly motion?: MotionPreset;
  readonly purpose?: PurposeId | "none";
  readonly corrections?: readonly PaletteCorrection[];
}

export type CarryOverKey = "density" | "contrast" | "motion" | "purpose" | "correction";
export interface CarryOverItem {
  readonly key: CarryOverKey;
  /** correction만 */
  readonly role?: PaletteRole;
  /** 지운 항목만 */
  readonly reason?: "board-changed" | "palette-changed" | "new-contrast-failure";
}

/** 불변 레코드 (FR-PRF-03). 적용된 값 = effectiveProfile(base, adjustments) — 2a-04b */
export interface ProfileVersion {
  readonly profileId: string;
  readonly version: number;
  readonly origin: ProfileOrigin;
  /** revert 대상 · 이어받은 버전 */
  readonly basedOn?: number;
  /** board·board-reconfirm만 */
  readonly boardRevision?: number;
  /** 기준 레퍼런스(ProfileSummary) — 보드 확정 = 초안 값, 되돌리기 = 대상 버전 값 복사 (SPEC 10.0 A-Q1) */
  readonly baseReferenceId: string;
  readonly base: DesignProfileInput;
  readonly adjustments: ProfileAdjustments;
  /** board-reconfirm만 — 버전 요약 문장 (2a-04b) */
  readonly dropped?: readonly CarryOverItem[];
  readonly createdAt: string;
}

export interface ProfileSeries {
  readonly profileId: string;
  /** 오름차순 */
  readonly versions: readonly ProfileVersion[];
  readonly latestVersion: number;
}

export interface ProfileSummary {
  readonly profileId: string;
  readonly latestVersion: number;
  readonly baseReferenceId: string;
  readonly updatedAt: string;
}

/** 테마 허용 범위 — 지금은 기본 1벌, M2에서 무드별 */
export interface AdjustmentRange {
  readonly density: readonly Density[];
  readonly contrast: readonly ContrastLevel[];
  readonly motion: readonly MotionPreset[];
  /** "기본 범위" · 무드 이름 */
  readonly source: string;
}

/**
 * 기본 범위 1벌 — 모든 옵션 허용, 모션 L3는 생성 상한 밖이라 없음 (3.4). M2에서 무드별.
 * 가벼운 상수라 여기 둔다 — 범위 조회(getAdjustmentRange)가 쓰기 본문(zod) 청크를 받지 않게 (2a-04b2 번들)
 */
export const DEFAULT_ADJUSTMENT_RANGE: AdjustmentRange = Object.freeze({
  density: Object.freeze(["comfortable", "compact"] as const),
  contrast: Object.freeze(["aa", "enhanced"] as const),
  motion: Object.freeze(["L0", "L1", "L2"] as const),
  source: "기본 범위",
});

export type ProfileErrorCode = "NOT_FOUND" | "STALE_PROFILE" | "RANGE_VIOLATION" | "SCHEMA_INVALID";

/** 계열 최신 — 보드 ConfirmedRef.latest · 보드 쓰기의 STALE_PROFILE 오류 동봉 */
export interface ProfileHead {
  readonly version: number;
  readonly base: DesignProfileInput;
  readonly adjustments: ProfileAdjustments;
}

/** 보드 재확정 이어받기 계획 — 보드 패널(P-S25)과 저장소가 같은 값을 쓴다 (6.1-3, 2a-04b) */
export interface CarryOverPlan {
  readonly kept: readonly CarryOverItem[];
  readonly dropped: readonly CarryOverItem[];
  /** 새 버전에 저장될 조정 = kept만 */
  readonly adjustments: ProfileAdjustments;
}

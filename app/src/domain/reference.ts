/** 카탈로그 레퍼런스 도메인 타입 — TRD 4.1 DesignReference 중 시안 1a가 쓰는 필드. */

import type { ColorFamily } from "./colorFamily";

export type LicenseStatus = "internal" | "licensed" | "external_observed";
/** MVP 카탈로그에 노출 가능한 라이선스 (FR-CAT-04). */
export type ExposedLicenseStatus = Exclude<LicenseStatus, "external_observed">;
export const EXPOSED_LICENSE_STATUSES: readonly ExposedLicenseStatus[] = Object.freeze(["internal", "licensed"]);

export type IndustryId = "cafe-fnb" | "beauty" | "medical" | "fitness" | "professional" | "education" | "retail";
export type AudienceId = "age-20-30" | "family" | "b2b";
export type PurposeId = "booking" | "inquiry" | "sales";
export type LayoutTypeId = "fullbleed" | "split" | "center" | "grid" | "text" | "image";
/** TRD motion_level(L0~L3) 대신 목업 표기 3단계(낮음·중간·높음)를 쓴다. */
export type MotionLevel = "low" | "mid" | "high";
/** 지원 디바이스 (FR-CAT-01 디바이스 필터). */
export type DeviceId = "desktop" | "mobile" | "responsive";
export type VisualTagId =
  | "minimal"
  | "warm"
  | "sophisticated"
  | "bold"
  | "trust"
  | "clean"
  | "lively"
  | "bright"
  | "formal"
  | "restrained"
  | "friendly"
  | "handmade";

export interface ColorPalette {
  /** 대표색 (목업 c1) */
  readonly primary: string;
  /** 표면색 (목업 c2) */
  readonly surface: string;
  /** 잉크색 (목업 c3) */
  readonly ink: string;
}

export interface BenchmarkScores {
  readonly accessibility: number;
  readonly performance: number;
  /** ISO 날짜 (YYYY-MM-DD) */
  readonly measuredAt: string;
}

export interface DesignReference {
  readonly id: string;
  /** 비교 보드 열 표기 (A~F) */
  readonly key: string;
  readonly slug: string;
  readonly title: string;
  readonly licenseStatus: LicenseStatus;
  readonly industry: IndustryId;
  readonly audience: readonly AudienceId[];
  readonly purpose: readonly PurposeId[];
  readonly visualTags: readonly VisualTagId[];
  readonly layoutType: LayoutTypeId;
  readonly colorPalette: ColorPalette;
  readonly motionLevel: MotionLevel;
  readonly responsive: boolean;
  readonly devices: readonly DeviceId[];
  readonly scores: BenchmarkScores;
  /** ISO 날짜 — 최신순 정렬 기준 */
  readonly createdAt: string;
}

export type SortKey = "score" | "latest";

/** 카탈로그 조회 조건. 배열 필드는 그룹 안 OR, 필드끼리는 AND. */
export interface ReferenceQuery {
  readonly industry?: IndustryId;
  readonly audience?: readonly AudienceId[];
  readonly concept?: readonly VisualTagId[];
  readonly layout?: readonly LayoutTypeId[];
  readonly purpose?: readonly PurposeId[];
  readonly license?: readonly ExposedLicenseStatus[];
  readonly motion?: MotionLevel;
  /** 대표색 계열 (팔레트 primary에서 계산) */
  readonly color?: readonly ColorFamily[];
  readonly device?: readonly DeviceId[];
  readonly sort?: SortKey;
}

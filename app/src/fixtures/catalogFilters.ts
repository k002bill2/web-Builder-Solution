import type {
  AudienceId,
  ExposedLicenseStatus,
  IndustryId,
  LayoutTypeId,
  MotionLevel,
  PurposeId,
  SortKey,
  VisualTagId,
} from "../domain/reference";

/** 목업 renderVals()의 필터·정렬·탭 정의 (Design Studio Mockups.dc.html 665~672행). URL에는 id를 쓴다. */

export interface Option<T extends string> {
  readonly id: T;
  readonly label: string;
}

export const INDUSTRY_LABELS: Readonly<Record<IndustryId, string>> = Object.freeze({
  "cafe-fnb": "카페·F&B",
  beauty: "뷰티",
  medical: "의료",
  fitness: "피트니스",
  professional: "전문서비스",
  education: "교육",
  retail: "리테일",
});

/** 목업 industries 칩 순서. "전체"는 화면에서 앞에 붙인다. */
export const INDUSTRY_ORDER: readonly IndustryId[] = Object.freeze([
  "cafe-fnb",
  "beauty",
  "medical",
  "fitness",
  "professional",
  "education",
  "retail",
]);

export const LAYOUT_LABELS: Readonly<Record<LayoutTypeId, string>> = Object.freeze({
  fullbleed: "풀블리드 히어로",
  split: "스플릿 히어로",
  center: "센터 히어로",
  grid: "그리드 히어로",
  text: "텍스트 히어로",
  image: "이미지 히어로",
});

export const VISUAL_TAG_LABELS: Readonly<Record<VisualTagId, string>> = Object.freeze({
  minimal: "미니멀",
  warm: "따뜻한",
  sophisticated: "세련된",
  bold: "대담한",
  trust: "신뢰",
  clean: "깔끔한",
  lively: "활기찬",
  bright: "밝은",
  formal: "격식",
  restrained: "절제",
  friendly: "친근한",
  handmade: "수제",
});

export const MOTION_LABELS: Readonly<Record<MotionLevel, string>> = Object.freeze({
  low: "낮음",
  mid: "중간",
  high: "높음",
});

export type FilterGroupKey = "audience" | "concept" | "layout" | "purpose" | "license";

interface FilterGroup<K extends FilterGroupKey, T extends string> {
  readonly key: K;
  readonly name: string;
  readonly options: readonly Option<T>[];
}

export type AnyFilterGroup =
  | FilterGroup<"audience", AudienceId>
  | FilterGroup<"concept", VisualTagId>
  | FilterGroup<"layout", LayoutTypeId>
  | FilterGroup<"purpose", PurposeId>
  | FilterGroup<"license", ExposedLicenseStatus>;

export const FILTER_GROUPS: readonly AnyFilterGroup[] = Object.freeze([
  {
    key: "audience",
    name: "타깃",
    options: [
      { id: "age-20-30", label: "20~30대" },
      { id: "family", label: "가족" },
      { id: "b2b", label: "B2B" },
    ],
  },
  {
    key: "concept",
    name: "콘셉트",
    options: [
      { id: "minimal", label: "미니멀" },
      { id: "warm", label: "따뜻한" },
      { id: "bold", label: "대담한" },
    ],
  },
  {
    key: "layout",
    name: "레이아웃",
    options: [
      { id: "fullbleed", label: "풀블리드 히어로" },
      { id: "split", label: "스플릿" },
      { id: "grid", label: "그리드" },
    ],
  },
  {
    key: "purpose",
    name: "콘텐츠 목적",
    options: [
      { id: "booking", label: "예약" },
      { id: "inquiry", label: "문의" },
      { id: "sales", label: "판매" },
    ],
  },
  {
    key: "license",
    name: "라이선스",
    options: [
      { id: "internal", label: "internal" },
      { id: "licensed", label: "licensed" },
    ],
  },
]);

export const MOTION_OPTIONS: readonly Option<MotionLevel>[] = Object.freeze([
  { id: "low", label: "낮음" },
  { id: "mid", label: "중간" },
  { id: "high", label: "높음" },
]);

export const SORT_OPTIONS: readonly Option<SortKey>[] = Object.freeze([
  { id: "score", label: "점수순" },
  { id: "latest", label: "최신순" },
]);

export type CatalogTab = "all" | "rec" | "saved";

export const CATALOG_TABS: readonly Option<CatalogTab>[] = Object.freeze([
  { id: "all", label: "전체" },
  { id: "rec", label: "추천" },
  { id: "saved", label: "저장함" },
]);

/** 목업 GNB의 현재 사용자 (인증은 범위 밖). */
export const CURRENT_USER = Object.freeze({ name: "강영환" });

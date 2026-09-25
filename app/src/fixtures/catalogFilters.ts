import type { ColorFamily } from "../domain/colorFamily";
import type {
  AudienceId,
  DeviceId,
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

export const PURPOSE_LABELS: Readonly<Record<PurposeId, string>> = Object.freeze({
  booking: "예약",
  inquiry: "문의",
  sales: "판매",
});

export const MOTION_LABELS: Readonly<Record<MotionLevel, string>> = Object.freeze({
  low: "낮음",
  mid: "중간",
  high: "높음",
});

export const COLOR_FAMILY_LABELS: Readonly<Record<ColorFamily, string>> = Object.freeze({
  neutral: "무채색",
  warm: "따뜻한 계열",
  green: "그린 계열",
  cool: "차가운 계열",
});

export const DEVICE_LABELS: Readonly<Record<DeviceId, string>> = Object.freeze({
  desktop: "데스크톱",
  mobile: "모바일",
  responsive: "반응형",
});

export type FilterGroupKey = "audience" | "concept" | "layout" | "purpose" | "license" | "color" | "device";

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
  | FilterGroup<"license", ExposedLicenseStatus>
  | FilterGroup<"color", ColorFamily>
  | FilterGroup<"device", DeviceId>;

const optionsOf = <T extends string>(labels: Readonly<Record<T, string>>): Option<T>[] =>
  (Object.keys(labels) as T[]).map((id) => ({ id, label: labels[id] }));

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

/** 목업 레일에 없는 FR-CAT-01 필터 — 레일 맨 아래, 모션 강도 다음에 같은 체크박스 그룹으로 둔다 (M1-UI-02 작업 2). */
export const TRAILING_FILTER_GROUPS: readonly AnyFilterGroup[] = Object.freeze([
  { key: "color", name: "색상", options: optionsOf(COLOR_FAMILY_LABELS) },
  { key: "device", name: "디바이스", options: optionsOf(DEVICE_LABELS) },
]);

export const ALL_FILTER_GROUPS: readonly AnyFilterGroup[] = Object.freeze([...FILTER_GROUPS, ...TRAILING_FILTER_GROUPS]);

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

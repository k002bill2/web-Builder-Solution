/**
 * internal 조합 생성기 입력 표 (SPEC m3p 2.1 · 2.3) — 저장소 안 추상 값만. 외부 사이트·색 추출·실존 상호 0.
 * 생성기는 빌드 전에 한 번 돌고 결과만 픽스처로 커밋한다(2.4) — 이 파일은 앱 청크에 들어가지 않는다(생성기·테스트만 import).
 */
import type { SectionType } from "./compareBoard";
import type { AudienceId, IndustryId, LayoutTypeId, PurposeId, VisualTagId } from "./reference";

export const INTERNAL_GENERATOR_VERSION = "internal-compose-1";
/** 생성 레퍼런스 createdAt — 실행 시각을 쓰지 않는다(결정성) */
export const GENERATOR_DATE = "2026-10-06";
/** 한 번 실행 출력 상한 (2.3 — 번들 6절 예산 기준) */
export const OUTPUT_LIMIT = 24;
/** 업종당 후보 시도 상한 (2.5) */
export const MAX_ATTEMPTS = 32;

/** 생성기 전용 팔레트 표 (2.1) — 5역할. 대비 AA(게이트와 같은 checkProfileContrast) 실패 팔레트는 보정하지 않고 표에서 뺀다 */
export interface InternalPalette {
  readonly id: string;
  /** 비교 보드 팔레트 셀 보조 이름 */
  readonly note: string;
  readonly primary: string;
  readonly surface: string;
  readonly ink: string;
  readonly muted: string;
  readonly bg: string;
}

export const INTERNAL_PALETTES: readonly InternalPalette[] = [
  { id: "espresso", note: "에스프레소", primary: "#6B4226", surface: "#F6EEE6", ink: "#2A211B", muted: "#6E5A4C", bg: "#FFFFFF" },
  { id: "forest", note: "포레스트", primary: "#2F6B4F", surface: "#EAF4EE", ink: "#1E2A24", muted: "#4F6359", bg: "#FFFFFF" },
  { id: "navy", note: "네이비", primary: "#1E3A6E", surface: "#EBF0F8", ink: "#1A2233", muted: "#4E5A6E", bg: "#FFFFFF" },
  { id: "plum", note: "플럼", primary: "#6A2C5B", surface: "#F7ECF3", ink: "#2B1D27", muted: "#6B5565", bg: "#FFFFFF" },
  { id: "teal", note: "틸", primary: "#0F6E73", surface: "#E6F4F4", ink: "#142526", muted: "#4A6264", bg: "#FFFFFF" },
  { id: "brick", note: "브릭", primary: "#A13D2D", surface: "#FBEEEA", ink: "#2D1C18", muted: "#6E5550", bg: "#FFFFFF" },
  { id: "indigo", note: "인디고", primary: "#3F3D9E", surface: "#EEEEFA", ink: "#1D1C33", muted: "#57566E", bg: "#FFFFFF" },
  { id: "olive", note: "올리브", primary: "#5A6324", surface: "#F3F4E6", ink: "#23261A", muted: "#5C604A", bg: "#FFFFFF" },
  { id: "slate", note: "슬레이트", primary: "#3D4B5C", surface: "#EEF1F4", ink: "#1C232B", muted: "#56616E", bg: "#FFFFFF" },
  { id: "rose", note: "로즈", primary: "#B0304F", surface: "#FCEEF1", ink: "#2E1B20", muted: "#6F5359", bg: "#FFFFFF" },
  { id: "ocean", note: "오션", primary: "#1565A6", surface: "#E8F2FA", ink: "#15212C", muted: "#4C5D6C", bg: "#FFFFFF" },
  { id: "amber", note: "앰버", primary: "#8A5A00", surface: "#FFF5E0", ink: "#2B2215", muted: "#6B5B40", bg: "#FFFFFF" },
];

/** 레이아웃 축 = hero 변형 1:1 (2.1) */
export const HERO_OF_LAYOUT: Readonly<Record<LayoutTypeId, string>> = {
  fullbleed: "fullbleed-left",
  split: "split",
  center: "center",
  grid: "grid",
  text: "text",
  image: "image",
};
export const LAYOUT_ORDER: readonly LayoutTypeId[] = ["fullbleed", "split", "center", "grid", "text", "image"];
/** 제목용 짧은 레이아웃 이름 ("교육 · 신뢰 센터형") */
export const LAYOUT_SHORT: Readonly<Record<LayoutTypeId, string>> = {
  fullbleed: "풀블리드",
  split: "분할",
  center: "센터",
  grid: "그리드",
  text: "텍스트",
  image: "이미지",
};

/** 뼈대 템플릿 슬롯 — hero는 레이아웃 축이 채운다. 변형 이름은 비교 보드 이름(ENGINE_VARIANT_MAP 키) */
export interface SkeletonSlot {
  readonly type: SectionType;
  readonly variants: readonly string[];
}

const HERO_SLOT: SkeletonSlot = { type: "hero", variants: [] };
const FOOTERS = ["biz-extended", "biz-extended-map", "minimal-biz"];

/** 목적별 뼈대 3종 (2.1) — 본문 6개(R-01 5~9) · Hero 첫 본문(R-02) · 예약 폼(R-04) · 문의 후반 1/3(R-03) · 사업자정보 Footer(R-12) */
export const SKELETON_TEMPLATES: Readonly<Record<PurposeId, readonly SkeletonSlot[]>> = {
  booking: [
    { type: "header", variants: ["sticky-right-cta", "sticky-hamburger", "transparent"] },
    HERO_SLOT,
    { type: "about", variants: ["split", "story", "team-grid-3"] },
    { type: "services", variants: ["grid-3", "list", "schedule-table"] },
    { type: "testimonials", variants: ["quotes-2", "carousel"] },
    { type: "faq", variants: ["accordion"] },
    { type: "contact", variants: ["booking"] },
    { type: "footer", variants: FOOTERS },
  ],
  inquiry: [
    { type: "header", variants: ["sticky-right-cta", "sticky-two-tier", "sticky-hamburger"] },
    HERO_SLOT,
    { type: "services", variants: ["list", "cards-3", "grid-2"] },
    { type: "about", variants: ["team-grid-2", "text", "story"] },
    { type: "portfolio", variants: ["case-list", "grid-3", "insights-grid-3"] },
    { type: "faq", variants: ["accordion"] },
    { type: "contact", variants: ["form", "map-form"] },
    { type: "footer", variants: FOOTERS },
  ],
  sales: [
    { type: "header", variants: ["sticky-right-cta", "transparent", "sticky-hamburger"] },
    HERO_SLOT,
    { type: "services", variants: ["grid-3", "masonry", "cards-3"] },
    { type: "portfolio", variants: ["masonry", "grid-2", "grid-3"] },
    { type: "pricing", variants: ["tiers-2", "cards"] },
    { type: "testimonials", variants: ["quotes-2", "carousel"] },
    { type: "contact", variants: ["order-form", "form"] },
    { type: "footer", variants: FOOTERS },
  ],
};

/** 대상 업종 (MQ-M3P-2 A) — 목적·타깃·콘셉트 허용 묶음. count = 생성 수(기존 포함 업종당 4) */
export interface IndustrySpec {
  readonly industry: IndustryId;
  readonly count: number;
  readonly purposes: readonly PurposeId[];
  readonly audiences: readonly (readonly AudienceId[])[];
  readonly concepts: readonly (readonly [VisualTagId, VisualTagId])[];
}

export const INDUSTRY_SPECS: readonly IndustrySpec[] = [
  { industry: "cafe-fnb", count: 2, purposes: ["sales", "booking"], audiences: [["age-20-30"], ["family"]], concepts: [["warm", "handmade"], ["minimal", "warm"], ["lively", "friendly"]] },
  { industry: "beauty", count: 3, purposes: ["booking", "sales"], audiences: [["age-20-30"], ["age-20-30", "family"]], concepts: [["sophisticated", "minimal"], ["bright", "lively"], ["warm", "restrained"]] },
  { industry: "medical", count: 3, purposes: ["booking", "inquiry"], audiences: [["family"], ["age-20-30"]], concepts: [["trust", "clean"], ["clean", "friendly"], ["restrained", "trust"]] },
  { industry: "professional", count: 3, purposes: ["inquiry"], audiences: [["b2b"]], concepts: [["formal", "trust"], ["minimal", "restrained"], ["sophisticated", "clean"]] },
  { industry: "education", count: 4, purposes: ["inquiry", "booking"], audiences: [["family"], ["age-20-30"]], concepts: [["friendly", "bright"], ["trust", "clean"], ["lively", "friendly"], ["formal", "trust"]] },
];

export const AUDIENCE_NOTES: Readonly<Record<AudienceId, string>> = { "age-20-30": "20~30대", family: "가족 단위", b2b: "기업 고객" };

/** 카드 축 (KitCardStyle 4종 · 밝은 카드만 — 어두운 카드 대비 C-3을 표에서 따로 보지 않는다) */
export const CARD_AXIS: readonly { readonly style: string; readonly label: string }[] = [
  { style: "bordered-lg", label: "보더 · 16px" },
  { style: "bordered-md", label: "보더 · 12px" },
  { style: "elevated", label: "엘리베이티드 · 라이트" },
  { style: "flat", label: "플랫 · 구분선" },
];
export const MEDIA_RATIOS: readonly string[] = ["16:9", "4:5", "1:1"];
export const SPACING_AXIS: readonly { readonly name: "comfortable" | "compact"; readonly sectionGap: number }[] = [
  { name: "comfortable", sectionGap: 96 },
  { name: "compact", sectionGap: 64 },
];
export const TYPE_SCALES: readonly number[] = [1.2, 1.25];
export const MOTION_NOTES = { low: "페이드 200ms", mid: "슬라이드 300ms" } as const;

/** header 변형별 메뉴·모바일 문구 (2.2 비교 menuLabel·mobile · 상세 mobileFlow) */
export const HEADER_TEXT: Readonly<Record<string, { readonly menu: string; readonly mobile: { readonly label: string; readonly value: string }; readonly flow: string }>> = {
  "sticky-right-cta": { menu: "5개 · 우측 CTA", mobile: { label: "단일 컬럼 · 하단 CTA", value: "single-column-bottom-cta" }, flow: "햄버거 메뉴" },
  "sticky-hamburger": { menu: "4개 · 모바일 햄버거", mobile: { label: "단일 컬럼 · 스티키 CTA", value: "single-column-sticky-cta" }, flow: "햄버거 메뉴" },
  "sticky-two-tier": { menu: "6개 · 2단", mobile: { label: "2컬럼 카드", value: "two-column-cards" }, flow: "2단 메뉴 접기" },
  transparent: { menu: "5개 · 투명 헤더", mobile: { label: "단일 컬럼 · 하단 탭 메뉴", value: "single-column-bottom-tabs" }, flow: "하단 탭 메뉴" },
};


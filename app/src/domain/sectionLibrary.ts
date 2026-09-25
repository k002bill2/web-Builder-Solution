/**
 * 우리 섹션 라이브러리 — 비교 보드가 바인딩하는 header·hero·footer 변형 (SPEC 8.2 라이브러리 호환).
 * 모든 셀 바인딩은 하나의 `version`으로 해석한다. 없어진 변형은 `variantMigrations`로 결정적으로 바꾸고,
 * 대응이 없으면 선택 불가(unavailableReason 'library')다.
 * 백엔드 연결 전 임시 정의 — 실제 정본은 섹션 패키지(TRD 4.4 SectionRegistry)다.
 */
import type { BoundSectionType } from "./compareBoard";

export interface VariantDef {
  readonly label: string;
  /** footer만: 사업자정보 포함 여부 (R-12) */
  readonly hasBusinessInfo?: boolean;
  /** footer만: 사업자정보가 없을 때 확정 시 바꿀 같은 모양의 확장 변형 (R-12 대체안) */
  readonly businessInfoVariant?: string;
}

export interface SectionLibrary {
  readonly version: string;
  readonly sections: Readonly<Record<BoundSectionType, Readonly<Record<string, VariantDef>>>>;
  /** 이전 변형 → 현재 변형 */
  readonly variantMigrations: Readonly<Partial<Record<BoundSectionType, Readonly<Record<string, string>>>>>;
}

/** 기준 레퍼런스에 Footer가 없을 때 끝에 붙이는 기본 Footer (R-01, SPEC 3.3) */
export const DEFAULT_FOOTER_VARIANT = "biz-extended";

export const SECTION_LIBRARY: SectionLibrary = Object.freeze({
  version: "1.4",
  sections: {
    header: {
      "sticky-right-cta": { label: "고정 헤더 · 우측 CTA" },
      "sticky-hamburger": { label: "고정 헤더 · 햄버거 메뉴" },
      "sticky-two-tier": { label: "고정 헤더 · 2단 메뉴" },
      transparent: { label: "투명 헤더" },
    },
    hero: {
      "fullbleed-left": { label: "풀블리드 이미지 + 좌측 카피" },
      split: { label: "스플릿 (카피 / 이미지)" },
      center: { label: "센터 정렬 카피" },
      grid: { label: "그리드 (이미지 타일 + 카피)" },
      text: { label: "텍스트 중심 카피" },
      image: { label: "대형 이미지 + 하단 카피" },
    },
    footer: {
      "biz-extended": { label: "확장형 사업자정보", hasBusinessInfo: true },
      "biz-extended-map": { label: "확장형 + 지도", hasBusinessInfo: true },
      minimal: { label: "미니멀 · 링크만", hasBusinessInfo: false, businessInfoVariant: "minimal-biz" },
      "minimal-biz": { label: "미니멀 + 사업자정보 한 줄", hasBusinessInfo: true },
    },
  },
  variantMigrations: {},
});

/** 변형을 현재 라이브러리에서 해석한다. 없으면 대응표, 그것도 없으면 undefined. */
export function resolveVariant(
  library: SectionLibrary,
  sectionType: BoundSectionType,
  variant: string,
): { readonly variant: string; readonly def: VariantDef } | undefined {
  const defs = library.sections[sectionType];
  const current = defs[variant] ? variant : library.variantMigrations[sectionType]?.[variant];
  const def = current === undefined ? undefined : defs[current];
  return current !== undefined && def ? { variant: current, def } : undefined;
}

/**
 * 섹션 레지스트리 — `type + variant`로 조회한다(TRD 4.4 SectionRegistry, 렌더 제외).
 * 유형 이름(`name`)은 SPEC 5.2·5.4 화면 문장의 표기("Hero", "Services")를 따른다.
 */
import { SECTION_TYPES, type SectionType } from "../contracts/pageDoc";
import type { SectionDefinition, SectionTypeInfo } from "../contracts/sectionDefinition";
import { deepFreeze } from "../freeze";
import { BODY_DEFINITIONS } from "./bodySections";
import { BOUND_DEFINITIONS } from "./boundSections";

const TYPE_TEXT: Readonly<Record<SectionType, { readonly name: string; readonly description: string }>> = {
  header: { name: "Header", description: "페이지 맨 위 브랜드와 메뉴" },
  hero: { name: "Hero", description: "첫 화면 대표 문구와 행동 버튼" },
  about: { name: "About", description: "브랜드 소개" },
  services: { name: "Services", description: "제공하는 서비스 소개" },
  portfolio: { name: "Portfolio", description: "작업 사례 이미지 모음" },
  statistics: { name: "Statistics", description: "핵심 수치 강조" },
  testimonials: { name: "Testimonials", description: "고객 후기" },
  pricing: { name: "Pricing", description: "요금 안내" },
  faq: { name: "FAQ", description: "자주 묻는 질문과 답변" },
  contact: { name: "Contact", description: "문의·예약 폼" },
  "cta-band": { name: "CTA Band", description: "행동을 권하는 가로 띠" },
  footer: { name: "Footer", description: "페이지 맨 아래 사업자정보와 링크" },
};

export const SECTION_DEFINITIONS: readonly SectionDefinition[] = deepFreeze([
  ...BOUND_DEFINITIONS.header,
  ...BOUND_DEFINITIONS.hero,
  ...BODY_DEFINITIONS,
  ...BOUND_DEFINITIONS.footer,
]);

const infoOf = (type: SectionType): SectionTypeInfo => ({
  type,
  ...TYPE_TEXT[type],
  variants: SECTION_DEFINITIONS.filter((d) => d.type === type).map((d) => d.variant),
});

export const SECTION_TYPE_INFO: Readonly<Record<SectionType, SectionTypeInfo>> = deepFreeze({
  header: infoOf("header"),
  hero: infoOf("hero"),
  about: infoOf("about"),
  services: infoOf("services"),
  portfolio: infoOf("portfolio"),
  statistics: infoOf("statistics"),
  testimonials: infoOf("testimonials"),
  pricing: infoOf("pricing"),
  faq: infoOf("faq"),
  contact: infoOf("contact"),
  "cta-band": infoOf("cta-band"),
  footer: infoOf("footer"),
});

const BY_KEY: ReadonlyMap<string, SectionDefinition> = new Map(SECTION_DEFINITIONS.map((d) => [`${d.type}/${d.variant}`, d]));

/** 라이브러리 순서(SECTION_TYPES) — 섹션 추가 대화상자 유형 목록 */
export function listSectionTypes(): readonly SectionTypeInfo[] {
  return SECTION_TYPES.map((type) => SECTION_TYPE_INFO[type]);
}

export function getSectionDefinition(type: SectionType, variant: string): SectionDefinition | undefined {
  return BY_KEY.get(`${type}/${variant}`);
}

export function isSectionType(value: unknown): value is SectionType {
  return typeof value === "string" && (SECTION_TYPES as readonly string[]).includes(value);
}

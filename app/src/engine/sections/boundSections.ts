/**
 * header · hero · footer 정의 — 변형 키·이름표·사업자정보 여부는 domain/sectionLibrary에서 파생한다(같은 키, 복제 없음).
 * 엔진이 더하는 것은 변형별 슬롯·풀블리드 여부뿐이다. 라이브러리에 변형이 늘면 SLOTS 표에 없어 모듈 로드(테스트) 때 오류로 드러난다.
 */
import { SECTION_LIBRARY } from "../../domain/sectionLibrary";
import type { BoundSectionType } from "../../domain/compareBoard";
import type { SectionDefinition, SlotSchema } from "../contracts/sectionDefinition";
import { image, link, long, short } from "./slots";

const brand = short("brand", "브랜드 이름", 24, { required: true, text: "브랜드 이름" });
const nav = link("nav", "메뉴 항목", 80, { required: true, recommended: 60, text: "소개 · 서비스 · 문의" });
const headerCta = link("cta", "버튼 문구", 16, { required: true, recommended: 10, text: "문의하기" });

const heroTitle = short("title", "제목", 40, { required: true, recommended: 28, text: "한 문장으로 소개하는 제목" });
const heroSubtitle = long("subtitle", "부제", 120, { recommended: 80, text: "무엇을 누구에게 제공하는지 한두 문장으로 적습니다." });
const heroCta = link("cta", "버튼 문구", 16, { required: true, recommended: 10, text: "시작하기" });
const heroImage = image("image", "대표 이미지");

const footerLinks = link("links", "하단 링크", 80, { recommended: 60, text: "이용약관 · 개인정보처리방침" });
const bizInfo = long("businessInfo", "사업자정보", 200, { required: true, text: "상호 · 대표 · 사업자등록번호 · 주소" });
const bizLine = short("businessInfo", "사업자정보 한 줄", 100, { required: true, recommended: 80, text: "상호 · 사업자등록번호" });
const copyright = short("copyright", "저작권 문구", 60, { text: "© 브랜드 이름" });

type BoundSpec = Readonly<Record<string, { readonly slots: SlotSchema; readonly fullBleed?: boolean }>>;

const SLOTS: Readonly<Record<BoundSectionType, BoundSpec>> = {
  header: {
    "sticky-right-cta": { slots: [brand, nav, headerCta] },
    "sticky-hamburger": { slots: [brand, nav] },
    "sticky-two-tier": { slots: [brand, nav, link("utility", "보조 메뉴", 40, { text: "로그인 · 고객센터" })] },
    transparent: { slots: [brand, nav] },
  },
  hero: {
    "fullbleed-left": { slots: [heroTitle, heroSubtitle, heroCta, heroImage], fullBleed: true },
    split: { slots: [heroTitle, heroSubtitle, heroCta, heroImage] },
    center: { slots: [heroTitle, heroSubtitle, heroCta] },
    grid: { slots: [heroTitle, heroSubtitle, heroCta, heroImage] },
    text: { slots: [heroTitle, heroSubtitle, heroCta] },
    image: { slots: [heroTitle, heroSubtitle, heroCta, heroImage], fullBleed: true },
  },
  footer: {
    "biz-extended": { slots: [bizInfo, footerLinks, copyright] },
    "biz-extended-map": { slots: [bizInfo, footerLinks, image("map", "지도 이미지"), copyright] },
    minimal: { slots: [footerLinks, copyright] },
    "minimal-biz": { slots: [footerLinks, bizLine] },
  },
};

const MAX_MOTION = { header: "L1", hero: "L2", footer: "L0" } as const;
const HEADING = { header: null, hero: 1, footer: null } as const;

function defsOf(type: BoundSectionType): SectionDefinition[] {
  return Object.entries(SECTION_LIBRARY.sections[type]).map(([variant, lib]) => {
    const spec = SLOTS[type][variant];
    if (!spec) throw new Error(`엔진 슬롯 정의 없음: ${type}/${variant} (sectionLibrary와 맞추세요)`);
    return {
      type,
      variant,
      label: lib.label,
      schemaVersion: 1,
      slots: spec.slots,
      constraints: { maxMotion: MAX_MOTION[type], fullBleed: spec.fullBleed === true },
      a11y: { headingLevel: HEADING[type], altRequired: spec.slots.some((s) => s.kind === "image") },
      ...(type === "footer" ? { hasBusinessInfo: lib.hasBusinessInfo === true } : {}),
    };
  });
}

export const BOUND_DEFINITIONS: Readonly<Record<BoundSectionType, readonly SectionDefinition[]>> = {
  header: defsOf("header"),
  hero: defsOf("hero"),
  footer: defsOf("footer"),
};

/**
 * 페이지 문서 계약 (DS-2A-05 SPEC 8.1 · TRD 4.5 page_doc). 타입만 — 값·검증은 engine/validate, 연산은 engine/ops.
 * 프로젝트당 문서 1개(Q3). 모든 연산은 이 값을 바꾸지 않고 새 문서를 돌려준다(8.2).
 */
import type { MotionPreset } from "../../domain/compareBoard";

/** TRD 4.4 SectionType — 12 type */
export const SECTION_TYPES = [
  "header",
  "hero",
  "about",
  "services",
  "portfolio",
  "statistics",
  "testimonials",
  "pricing",
  "faq",
  "contact",
  "cta-band",
  "footer",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

/** 섹션 모션 — 편집기는 L0~L2만(R-07 L3 = 0) */
export type SectionMotion = MotionPreset;

/**
 * R-05 인접 섹션 배경 톤. 엔진이 `normalizeDoc`으로만 정한다(사용자 편집 대상 아님).
 * SPEC 8.1 필드 목록에 없는 값 — REPORT 개정 요청 ①.
 */
export type SectionTone = "base" | "alt";

/**
 * 이미지 출처 — 외부 URL 문자열은 저장하지 않는다(PRD 원칙 4).
 *  - placeholder: 자체 플레이스홀더 패턴 id
 *  - local: 사용자 로컬 이미지 참조 id(EQ-3 — 실제 파일 보관은 저장소 몫)
 */
export type ImageSource =
  | { readonly kind: "placeholder"; readonly patternId: string }
  | { readonly kind: "local"; readonly assetId: string };

export interface ImageSlotValue {
  readonly kind: "image";
  /** 끄면 색 면으로 보이고 대체텍스트 검사에서 빠진다(B-18) */
  readonly enabled: boolean;
  readonly source: ImageSource;
  readonly alt: string;
  /** 장식 이미지 — 대체텍스트 없이 둔다(R-09 통과) */
  readonly decorative: boolean;
}

/** 글자 슬롯 = 문자열, 이미지 슬롯 = ImageSlotValue */
export type SlotValue = string | ImageSlotValue;

export interface SectionInstance {
  /** 연산을 지나도 변하지 않는 id — 선택·포커스·알림이 이것을 따른다 */
  readonly instanceId: string;
  readonly type: SectionType;
  readonly variant: string;
  readonly motion: SectionMotion;
  readonly tone: SectionTone;
  /** 슬롯 키 → 값. 키는 섹션 정의 스키마에 있는 것만. 없는 키 = 빈 값(게이트 R-13이 판정) */
  readonly slots: Readonly<Record<string, SlotValue>>;
}

/** 문서 단위 SEO 메타(R-11). canonical은 2a-05b */
export interface PageMeta {
  readonly title: string;
  readonly description: string;
}
export type PageMetaField = keyof PageMeta;

export interface PageDoc {
  readonly projectId: string;
  /** 저장마다 +1 — 저장소가 정한다(연산은 바꾸지 않는다) */
  readonly revision: number;
  /** 내용 해시(TRD doc_hash) = hashDoc(doc). hash·revision·updatedAt은 해시 대상이 아니다 */
  readonly hash: string;
  /** 테마 = 프로필 버전(Q3) */
  readonly profileVersion: number;
  /** 안(Q3) */
  readonly candidateId: string;
  readonly libraryVersion: string;
  readonly generatorVersion: string;
  readonly meta: PageMeta;
  readonly sections: readonly SectionInstance[];
  /** 저장소가 정한다(연산은 바꾸지 않는다 — 결정성) */
  readonly updatedAt: string;
}

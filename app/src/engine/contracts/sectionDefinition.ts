/**
 * 섹션 정의 계약 (TRD 4.4 SectionDefinition · SPEC 8.1 슬롯 스키마·섹션 정의).
 * 엔진 계약은 데이터만 — 렌더·카탈로그 전용 필드(`render`·`provenance` 등)는 뺐다(REPORT 표).
 */
import type { SectionMotion, SectionType } from "./pageDoc";

/** 짧은 글 · 긴 글 · 링크 라벨 · 이미지 (SPEC 5.6) */
export type SlotKind = "short-text" | "long-text" | "link-label" | "image";

export interface SlotSchemaEntry {
  readonly key: string;
  /** 한국어 이름표 — 필드 라벨 */
  readonly label: string;
  readonly kind: SlotKind;
  /** 상한 — 넘으면 게이트 R-13 차단(입력은 막지 않는다). 이미지 슬롯은 대체텍스트 상한 */
  readonly maxLength: number;
  /** 권장 길이 — 넘으면 FR-EDT-05 경고. TRD 4.4에 없는 값(REPORT 개정 요청 ②) */
  readonly recommendedLength?: number;
  readonly required: boolean;
  /** 섹션을 추가·변형 교체할 때 넣는 기본 글자(TRD 6.2 기본 슬롯 콘텐츠). 이미지 슬롯은 플레이스홀더 */
  readonly defaultText?: string;
}

/** 순서 있는 슬롯 목록(필드 표시 순서) */
export type SlotSchema = readonly SlotSchemaEntry[];

export type HeadingLevel = 1 | 2 | 3;

export interface SectionDefinition {
  readonly type: SectionType;
  readonly variant: string;
  /** 변형 이름표(한국어) */
  readonly label: string;
  readonly schemaVersion: number;
  readonly slots: SlotSchema;
  readonly constraints: {
    readonly maxMotion: SectionMotion;
    /** R-05 풀블리드 연속 판정용(보정 방식은 설계 질문 Q-1) */
    readonly fullBleed: boolean;
  };
  readonly a11y: {
    /** 섹션 머리 헤딩 수준(R-10). 헤딩이 없는 섹션(header·footer)은 null */
    readonly headingLevel: HeadingLevel | null;
    readonly altRequired: boolean;
  };
  /** footer만 — 사업자정보 포함 여부(R-12) */
  readonly hasBusinessInfo?: boolean;
  /** contact만 — 예약 변형 여부(R-04) */
  readonly reservation?: boolean;
}

/** 유형 단위 정보 — 섹션 추가 대화상자(5.3) */
export interface SectionTypeInfo {
  readonly type: SectionType;
  /** 화면 문장 속 섹션 이름("Hero", "Services" — SPEC 5.2·5.4 문장 표기) */
  readonly name: string;
  /** 한 줄 설명(한국어) */
  readonly description: string;
  /** 변형 id 목록(라이브러리 순서) */
  readonly variants: readonly string[];
}

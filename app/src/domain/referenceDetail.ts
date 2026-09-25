/** 레퍼런스 상세 (FR-CAT-03) — 목업 1a-02가 보여주는 섹션 구성·토큰 요약·모바일 구조·유사 추천 데이터. */
import type { DesignReference } from "./reference";

export type PaletteRole = "primary" | "surface" | "ink" | "muted" | "bg";
export type SimilarKind = "industry" | "concept" | "layout";

/** 유사 추천 그룹 순서 (목업 similarGroups 순서). */
export const SIMILAR_KINDS: readonly SimilarKind[] = Object.freeze(["industry", "concept", "layout"]);
/** 그룹마다 최대 개수 (PRD FR-CAT-03 수용 기준). */
export const SIMILAR_LIMIT = 6;

export interface SectionEntry {
  readonly name: string;
  readonly variant: string;
}

export interface PaletteEntry {
  readonly role: PaletteRole;
  readonly hex: string;
}

export interface ReferenceDetail {
  /** 메타 줄의 타깃 표기 (예: "20~30대 여성") */
  readonly audienceNote: string;
  /** 메타 줄 끝의 제작 출처 (예: "우리 섹션 라이브러리 v1.4로 제작") */
  readonly buildNote: string;
  /** 페이지 섹션 순서 */
  readonly sections: readonly SectionEntry[];
  /** 첫 항목은 대표색(primary) */
  readonly palette: readonly PaletteEntry[];
  /** 본문 대비 (예: 7.2 → "7.2:1") */
  readonly bodyContrast: number;
  readonly typography: {
    readonly family: string;
    readonly headingWeight: number;
    readonly bodyWeight: number;
    readonly scale: number;
  };
  readonly spacing: {
    /** 기본 그리드 (예: "8pt") */
    readonly grid: string;
    /** 섹션 간격 px */
    readonly sectionGap: number;
  };
  /** 대표 모션 (예: "페이드 200ms") */
  readonly motionNote: string;
  readonly mobileFlow: readonly string[];
  /** 점수 측정 도구 (예: "Lighthouse 12") */
  readonly measuredWith: string;
  /** 큐레이션한 유사 레퍼런스 id — 노출 규칙(자기 제외·비노출 제외·6개 상한)은 저장소가 적용한다. */
  readonly similar: Readonly<Record<SimilarKind, readonly string[]>>;
}

export interface SimilarGroup {
  readonly kind: SimilarKind;
  readonly items: readonly DesignReference[];
}

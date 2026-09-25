/**
 * 비교 보드 도메인 타입 (SPEC 8.1 · ADR-005).
 * 이 파일은 트레이(공통 청크)도 쓰므로 가벼운 타입·상수·순수 함수만 둔다 — zod·대비 계산은 넣지 않는다.
 */
import type { AllowedFontId } from "./fonts";
import type { DesignReference, MotionLevel } from "./reference";
import type { PaletteEntry } from "./referenceDetail";

export type ComparisonRowId =
  | "hero" | "menu" | "cta" | "sectionCount" | "palette" | "font"
  | "card" | "imageRatio" | "motion" | "mobile" | "footer" | "quality";
export type RowRole = "pick" | "global" | "info";
export type PickableRowId = Exclude<ComparisonRowId, "sectionCount" | "quality">;

export interface ComparisonRowDef {
  readonly id: ComparisonRowId;
  /** 행 머리글 ("Hero 구성") */
  readonly label: string;
  /** 알림 문장용 짧은 이름 ("Hero") — "B를 빼서 Hero·카드 선택 해제" */
  readonly shortLabel: string;
  readonly role: RowRole;
  readonly required?: boolean;
}

/** 행 순서·역할의 단일 정의. 화면·검증·프로필 매핑이 함께 쓴다. */
export const COMPARISON_ROWS: readonly ComparisonRowDef[] = Object.freeze([
  { id: "hero", label: "Hero 구성", shortLabel: "Hero", role: "pick", required: true },
  { id: "menu", label: "메뉴 구조", shortLabel: "메뉴", role: "pick" },
  { id: "cta", label: "CTA 위치", shortLabel: "CTA", role: "pick" },
  { id: "sectionCount", label: "섹션 수", shortLabel: "섹션 수", role: "info" },
  { id: "palette", label: "팔레트", shortLabel: "팔레트", role: "global" },
  { id: "font", label: "폰트", shortLabel: "폰트", role: "global" },
  { id: "card", label: "카드 스타일", shortLabel: "카드", role: "pick" },
  { id: "imageRatio", label: "이미지 비율", shortLabel: "이미지 비율", role: "pick" },
  { id: "motion", label: "모션", shortLabel: "모션", role: "pick" },
  { id: "mobile", label: "모바일 구조", shortLabel: "모바일", role: "pick" },
  { id: "footer", label: "Footer", shortLabel: "Footer", role: "pick" },
  { id: "quality", label: "접근성·성능", shortLabel: "접근성·성능", role: "info" },
] satisfies ComparisonRowDef[]);

export const PICKABLE_ROW_IDS: readonly PickableRowId[] = Object.freeze(
  COMPARISON_ROWS.filter((r) => r.role !== "info").map((r) => r.id as PickableRowId),
);

export function rowDef(id: ComparisonRowId): ComparisonRowDef {
  const def = COMPARISON_ROWS.find((r) => r.id === id);
  if (!def) throw new Error(`알 수 없는 비교 행: ${id}`);
  return def;
}

/** TRD 4.4 SectionType */
export type SectionType =
  | "header" | "hero" | "about" | "services" | "portfolio" | "statistics"
  | "testimonials" | "pricing" | "faq" | "contact" | "cta-band" | "footer";
export type BoundSectionType = "header" | "hero" | "footer";
export type ChoiceField = "cta_placement" | "media_ratio" | "mobile_pattern";
export type CtaPlacement = "hero-inline" | "hero-center" | "header-fixed" | "sticky-bottom";
export type SurfaceTone = "light" | "dark";

export interface SectionPlanEntry {
  readonly type: SectionType;
  readonly variant: string;
}

/** 셀이 가리키는 우리 쪽 실체. 표시 문자열(label)과 분리한다 (FR-SEL-02). */
export type CellBinding =
  | { readonly kind: "section"; readonly sectionType: BoundSectionType; readonly variant: string }
  | { readonly kind: "choice"; readonly field: ChoiceField; readonly value: string }
  | { readonly kind: "card"; readonly style: string; readonly surfaceTone: SurfaceTone }
  | { readonly kind: "palette"; readonly palette: readonly PaletteEntry[] }
  | { readonly kind: "typography"; readonly family: string; readonly headingWeight: number; readonly bodyWeight: number; readonly scale: number }
  | { readonly kind: "motion"; readonly level: MotionLevel };

export interface ComparisonCell {
  /** "스플릿 (카피 / 이미지)" · 없으면 "없음" */
  readonly label: string;
  /** null = 선택 불가(없음·info 행·라이브러리에 없는 변형) */
  readonly binding: CellBinding | null;
  /** footer만 */
  readonly meta?: { readonly hasBusinessInfo?: boolean };
  /** 현재 라이브러리 버전에 없는 변형 (SPEC 8.2 · AC-26) · 허용 목록 밖 폰트 (ADR-005 D1) */
  readonly unavailableReason?: "library" | "license";
}

/** 레퍼런스 1개의 비교 데이터. */
export interface ReferenceComparison {
  readonly referenceId: string;
  readonly cells: Readonly<Record<ComparisonRowId, ComparisonCell>>;
  readonly sectionPlan: readonly SectionPlanEntry[];
  /** spacing_tokens 출처 (SPEC 8.3: 기준 레퍼런스 상세의 spacing) */
  readonly spacing: { readonly grid: string; readonly sectionGap: number };
}

export type ColumnStatus = "available" | "withdrawn" | "missing";

/** `getComparison` 결과 1건. 회수·없음을 버리지 않고 상태로 돌려준다 (SPEC 8.2). */
export interface ComparisonResult {
  readonly referenceId: string;
  readonly status: ColumnStatus;
  readonly reference?: DesignReference;
  readonly comparison?: ReferenceComparison;
}

export const COLUMN_LABELS = Object.freeze(["A", "B", "C", "D", "E", "F"] as const);
export type ColumnLabel = (typeof COLUMN_LABELS)[number];

export interface BoardColumn {
  readonly referenceId: string;
  /** 보드가 부여, 빼도 다른 열은 불변 */
  readonly label: ColumnLabel;
}

/** 행 → 레퍼런스 id. 열 문자가 아니라 id로 저장 (P-6). */
export type Picks = Readonly<Partial<Record<PickableRowId, string>>>;

export interface CustomStyle {
  /** /^#[0-9A-F]{6}$/ (대문자 정규화) */
  readonly primaryColor?: string;
  readonly fontFamily?: AllowedFontId;
}

export interface ConfirmedRef {
  readonly profileId: string;
  readonly version: number;
  /** 확정한 보드 revision */
  readonly revision: number;
}

export interface CompareBoard {
  readonly id: string;
  /** ADR-005 Q1 — 확정 시 붙인다 */
  readonly projectId?: string;
  /** ≤ COMPARE_LIMIT, 추가 순서 */
  readonly columns: readonly BoardColumn[];
  readonly picks: Picks;
  readonly custom: CustomStyle;
  readonly confirmed?: ConfirmedRef;
  /** 변경마다 1씩 증가. 조건부 저장·확정의 기준 (8.2) */
  readonly revision: number;
  readonly updatedAt: string;
}

/** 자동 저장 상태 (S-12) */
export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** 초안 상태 태그 (2.4 · S-15 · S-16) */
export type DraftStatus =
  | { readonly kind: "unconfirmed"; readonly nextVersion: 1 }
  | { readonly kind: "confirmed"; readonly version: number }
  | { readonly kind: "changed"; readonly version: number; readonly nextVersion: number };

/** DesignProfile.selection_mode (ADR-005 Q5) */
export type SelectionMode = "template" | "mix";
export type MotionPreset = "L0" | "L1" | "L2";

/** DTCG semantic 색 토큰 */
export type ColorTokens = Readonly<Record<PaletteEntry["role"], { readonly $type: "color"; readonly $value: string }>> & {
  readonly $extensions?: { readonly seed: string };
};

/** 초안 → DesignProfile 입력 (TRD 4.3 + selection_mode). */
export interface DesignProfileInput {
  readonly source_reference_ids: readonly string[];
  readonly visual_direction: string;
  readonly layout_direction: string;
  readonly color_tokens: ColorTokens;
  readonly typography_tokens: { readonly family: string; readonly headingWeight: number; readonly bodyWeight: number; readonly scale: number };
  readonly spacing_tokens: { readonly grid: string; readonly sectionGap: number };
  readonly motion_preset: MotionPreset;
  readonly component_choices: {
    readonly hero?: { readonly section: "hero"; readonly variant: string };
    readonly header?: { readonly section: "header"; readonly variant: string };
    readonly footer?: { readonly section: "footer"; readonly variant: string };
    readonly cta_placement?: string;
    readonly card_style?: { readonly style: string; readonly surfaceTone: SurfaceTone };
    readonly media_ratio?: string;
    readonly mobile_pattern?: string;
  };
  readonly section_plan: readonly SectionPlanEntry[];
  readonly library_version: string;
  readonly seed: string;
  readonly selection_mode: SelectionMode;
}

export type CompareBoardErrorCode = "STALE_BOARD" | "UNSUPPORTED_COMBINATION" | "SCHEMA_INVALID" | "LICENSE_BLOCKED";

export function emptyBoard(id: string, updatedAt: string): CompareBoard {
  return { id, columns: [], picks: {}, custom: {}, revision: 0, updatedAt };
}

/** 비어 있는 가장 앞 문자. 6개가 차면 undefined. */
export function nextColumnLabel(columns: readonly BoardColumn[]): ColumnLabel | undefined {
  const used = new Set(columns.map((c) => c.label));
  return COLUMN_LABELS.find((label) => !used.has(label));
}

export function draftStatusOf(board: CompareBoard): DraftStatus {
  const confirmed = board.confirmed;
  if (!confirmed) return { kind: "unconfirmed", nextVersion: 1 };
  if (confirmed.revision === board.revision) return { kind: "confirmed", version: confirmed.version };
  return { kind: "changed", version: confirmed.version, nextVersion: confirmed.version + 1 };
}

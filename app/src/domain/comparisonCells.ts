/**
 * 레퍼런스 → 비교 보드 12행 셀 값 (SPEC 2.3 · 8.1 · 8.5).
 * 섹션·토큰 값은 레퍼런스·상세에서 계산하고, 상세에 없는 속성(메뉴·CTA·카드·이미지 비율·모바일)은 비교 픽스처에서 받는다.
 */
import type {
  BoundSectionType,
  ComparisonCell,
  ComparisonResult,
  ComparisonRowId,
  CtaPlacement,
  ReferenceComparison,
  SectionPlanEntry,
  SurfaceTone,
} from "./compareBoard";
import { PENDING_LICENSE, isAllowedFontFamily } from "./fonts";
import { EXPOSED_LICENSE_STATUSES, type DesignReference, type MotionLevel } from "./reference";
import type { ReferenceDetail } from "./referenceDetail";
import { resolveVariant, type SectionLibrary } from "./sectionLibrary";

/** 상세 데이터에 없는 비교 속성 (SPEC 8.5 데이터 공백). internal은 composition에서, licensed는 큐레이터가 입력한다. */
export interface ComparisonAttributes {
  /** 우리 섹션 유형·변형으로 옮긴 섹션 순서 */
  readonly sectionPlan: readonly SectionPlanEntry[];
  readonly menuLabel: string;
  readonly cta: { readonly label: string; readonly value: CtaPlacement };
  readonly card: { readonly label: string; readonly style: string; readonly surfaceTone: SurfaceTone };
  readonly imageRatio: string;
  readonly mobile: { readonly label: string; readonly value: string };
  /** 팔레트 셀 보조 이름 ("크림") */
  readonly paletteNote: string;
}

export interface ComparisonSource {
  readonly reference: DesignReference;
  readonly detail: ReferenceDetail;
  readonly attributes: ComparisonAttributes;
}

export const EMPTY_CELL_LABEL = "없음";
export const LIBRARY_UNAVAILABLE_LABEL = "현재 라이브러리에 없는 변형";
export const FONT_LICENSE_PENDING_LABEL = PENDING_LICENSE;
export const MOTION_LABELS: Readonly<Record<MotionLevel, string>> = Object.freeze({ low: "낮음", mid: "중간", high: "높음" });

const EMPTY: ComparisonCell = Object.freeze({ label: EMPTY_CELL_LABEL, binding: null });
const UNAVAILABLE: ComparisonCell = Object.freeze({
  label: LIBRARY_UNAVAILABLE_LABEL,
  binding: null,
  unavailableReason: "library",
});

/** header·hero·footer 셀: sectionPlan의 변형을 현재 라이브러리로 해석한다. label을 주면 그것을 표시한다(메뉴 행). */
function sectionCell(
  plan: readonly SectionPlanEntry[],
  sectionType: BoundSectionType,
  library: SectionLibrary,
  label?: string,
): ComparisonCell {
  const entry = plan.find((s) => s.type === sectionType);
  if (!entry) return EMPTY;
  const resolved = resolveVariant(library, sectionType, entry.variant);
  if (!resolved) return UNAVAILABLE;
  const binding = { kind: "section", sectionType, variant: resolved.variant } as const;
  const cell = { label: label ?? resolved.def.label, binding };
  return sectionType === "footer" ? { ...cell, meta: { hasBusinessInfo: resolved.def.hasBusinessInfo === true } } : cell;
}

/** ADR-005 D1: 허용 목록 밖 폰트는 "라이선스 확인 중" + 선택 불가 (AC-26과 같은 처리) */
function fontCell(t: ReferenceDetail["typography"]): ComparisonCell {
  const label = `${t.family} ${t.headingWeight} / ${t.bodyWeight}`;
  if (!isAllowedFontFamily(t.family)) return { label: `${label} · ${FONT_LICENSE_PENDING_LABEL}`, binding: null, unavailableReason: "license" };
  return { label, binding: { kind: "typography", ...t } };
}

export function buildReferenceComparison(
  { reference, detail, attributes: a }: ComparisonSource,
  library: SectionLibrary,
): ReferenceComparison {
  const primary = detail.palette.find((p) => p.role === "primary")?.hex ?? reference.colorPalette.primary;
  const t = detail.typography;
  const s = reference.scores;
  const cells: Record<ComparisonRowId, ComparisonCell> = {
    hero: sectionCell(a.sectionPlan, "hero", library),
    menu: sectionCell(a.sectionPlan, "header", library, a.menuLabel),
    cta: { label: a.cta.label, binding: { kind: "choice", field: "cta_placement", value: a.cta.value } },
    sectionCount: { label: `${a.sectionPlan.length}개`, binding: null },
    palette: {
      label: `${primary.toUpperCase()} · ${a.paletteNote}`,
      binding: { kind: "palette", palette: detail.palette.map((p) => ({ role: p.role, hex: p.hex.toUpperCase() })) },
    },
    font: fontCell(t),
    card: { label: a.card.label, binding: { kind: "card", style: a.card.style, surfaceTone: a.card.surfaceTone } },
    imageRatio: { label: a.imageRatio, binding: { kind: "choice", field: "media_ratio", value: a.imageRatio } },
    motion: { label: MOTION_LABELS[reference.motionLevel], binding: { kind: "motion", level: reference.motionLevel } },
    mobile: { label: a.mobile.label, binding: { kind: "choice", field: "mobile_pattern", value: a.mobile.value } },
    footer: sectionCell(a.sectionPlan, "footer", library),
    quality: { label: `접근성 ${s.accessibility} · 성능 ${s.performance} (측정일 ${s.measuredAt})`, binding: null },
  };
  return { referenceId: reference.id, cells, sectionPlan: a.sectionPlan, spacing: detail.spacing };
}

/** 한 행에서 모든 열 값이 같은지 ("모두 같음" 캡션). 열이 없으면 false. */
export function isRowUniform(rowId: ComparisonRowId, comparisons: readonly ReferenceComparison[]): boolean {
  const first = comparisons[0];
  return first !== undefined && comparisons.every((c) => c.cells[rowId].label === first.cells[rowId].label);
}

/** 비교 데이터 출처 — 레퍼런스 전체(비노출 포함)와 상세·비교 속성 */
export interface ComparisonCatalog {
  readonly references: readonly DesignReference[];
  readonly details: Readonly<Record<string, ReferenceDetail>>;
  readonly attributes: Readonly<Record<string, ComparisonAttributes>>;
}

/**
 * id 목록 → 비교 결과. 회수(비노출 전환)·없음을 버리지 않고 상태로 돌려준다 (SPEC 8.2).
 * 회수된 레퍼런스는 머리글 표시를 위해 reference·comparison을 함께 준다(셀은 흐리게 읽기용).
 */
export function resolveComparisons(
  ids: readonly string[],
  catalog: ComparisonCatalog,
  library: SectionLibrary,
): readonly ComparisonResult[] {
  return ids.map((referenceId): ComparisonResult => {
    const reference = catalog.references.find((r) => r.id === referenceId);
    const detail = catalog.details[referenceId];
    const attributes = catalog.attributes[referenceId];
    if (!reference || !detail || !attributes) return { referenceId, status: "missing" };
    const status = (EXPOSED_LICENSE_STATUSES as readonly string[]).includes(reference.licenseStatus) ? "available" : "withdrawn";
    return { referenceId, status, reference, comparison: buildReferenceComparison({ reference, detail, attributes }, library) };
  });
}

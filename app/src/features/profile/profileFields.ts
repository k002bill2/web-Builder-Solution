/**
 * 프로필 값 표시 행 (DS-2A-04 3.1 표 순서). 첫 화면(값 목록)과 엔진(비교·요약)이 같은 행을 쓴다 — 비교 표 순서 = 3.1 표 순서.
 * 화면은 적용된 값(effectiveProfile)을 넘긴다(2a-04b2, 엔진 profileDiff.valueRows). 선택 값 이름표(Q2)는 엔진이 `labels`로 넘긴다 —
 * 이름표 표를 첫 화면 청크에 싣지 않으려고 인자로 받는다.
 */
import type { ElementField, ElementLabels } from "../../domain/elementLibrary";
import type { DesignProfileInput, MotionPreset, SectionType } from "../../domain/compareBoard";
import type { LayoutTypeId, VisualTagId } from "../../domain/reference";
import type { PaletteRole } from "../../domain/referenceDetail";
import { SECTION_LIBRARY, resolveVariant } from "../../domain/sectionLibrary";
import { LAYOUT_LABELS, VISUAL_TAG_LABELS } from "../../fixtures/catalogFilters";

export interface FieldRow {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  /** 변형 키 등 보조 표기 */
  readonly caption?: string;
}

export const PALETTE_ROLES: readonly PaletteRole[] = ["primary", "surface", "ink", "muted", "bg"];
export const PALETTE_ROLE_LABELS: Readonly<Record<PaletteRole, string>> = Object.freeze({
  primary: "대표색",
  surface: "면",
  ink: "본문 글자",
  muted: "보조 글자",
  bg: "배경",
});
export const MOTION_PRESET_LABELS: Readonly<Record<MotionPreset, string>> = Object.freeze({ L0: "L0 없음", L1: "L1 낮음", L2: "L2 중간" });
export const SELECTION_MODE_LABELS = Object.freeze({ template: "템플릿 그대로", mix: "스타일 조합" });
export const SECTION_TYPE_LABELS: Readonly<Record<SectionType, string>> = Object.freeze({
  header: "Header", hero: "Hero", about: "About", services: "Services", portfolio: "Portfolio", statistics: "Statistics",
  testimonials: "Testimonials", pricing: "Pricing", faq: "FAQ", contact: "Contact", "cta-band": "CTA 밴드", footer: "Footer",
});

const librarySection = (label: string, key: string, type: "hero" | "header" | "footer", variant: string | undefined): FieldRow => {
  if (!variant) return { key, label, value: "없음" };
  return { key, label, value: resolveVariant(SECTION_LIBRARY, type, variant)?.def.label ?? variant, caption: variant };
};

/** 선택 값 — 이름표가 있으면 이름표 + 키 캡션(M-06), 없으면 저장된 값 그대로 */
const choice = (key: string, label: string, field: ElementField, value: string | undefined, labels: ElementLabels | undefined): FieldRow => {
  if (!value) return { key, label, value: "없음" };
  const named = labels?.[field][value];
  return named ? { key, label, value: named, caption: value } : { key, label, value };
};

function cardRow(card: NonNullable<DesignProfileInput["component_choices"]["card_style"]>, labels: ElementLabels | undefined): FieldRow {
  const row = choice("card", "카드 스타일", "card_style", card.style, labels);
  return { ...row, value: `${row.value} · ${card.surfaceTone === "dark" ? "어두운" : "밝은"} 카드` };
}

/** 섹션 한 줄 "Hero · 풀블리드 이미지 + 좌측 카피" — 라이브러리 밖 유형은 변형 키 그대로 */
export function sectionLabel(type: SectionType, variant: string): string {
  const bound = type === "header" || type === "hero" || type === "footer" ? resolveVariant(SECTION_LIBRARY, type, variant)?.def.label : undefined;
  return `${SECTION_TYPE_LABELS[type]} · ${bound ?? variant}`;
}

export function profileFieldRows(p: DesignProfileInput, titleOf: (referenceId: string) => string, labels?: ElementLabels): readonly FieldRow[] {
  const c = p.component_choices;
  const t = p.typography_tokens;
  const card = c.card_style;
  return [
    { key: "visual", label: "시각 방향", value: VISUAL_TAG_LABELS[p.visual_direction as VisualTagId] ?? p.visual_direction },
    { key: "layout", label: "레이아웃 방향", value: LAYOUT_LABELS[p.layout_direction as LayoutTypeId] ?? p.layout_direction },
    librarySection("Hero", "hero", "hero", c.hero?.variant),
    librarySection("메뉴", "header", "header", c.header?.variant),
    choice("cta", "CTA 위치", "cta_placement", c.cta_placement, labels),
    card ? cardRow(card, labels) : { key: "card", label: "카드 스타일", value: "없음" },
    choice("media", "이미지 비율", "media_ratio", c.media_ratio, labels),
    choice("mobile", "모바일 구조", "mobile_pattern", c.mobile_pattern, labels),
    librarySection("Footer", "footer", "footer", c.footer?.variant),
    { key: "typography", label: "타이포그래피", value: `${t.family} · 제목 ${t.headingWeight} / 본문 ${t.bodyWeight} · 비율 ${t.scale}` },
    { key: "spacing", label: "간격", value: `그리드 ${p.spacing_tokens.grid} · 섹션 간격 ${p.spacing_tokens.sectionGap}` },
    { key: "motion", label: "모션", value: MOTION_PRESET_LABELS[p.motion_preset] },
    { key: "sections", label: "섹션 구성", value: `섹션 ${p.section_plan.length} · ${p.section_plan.map((s) => sectionLabel(s.type, s.variant)).join(" → ")}` },
    { key: "sources", label: "출처", value: p.source_reference_ids.map(titleOf).join(" · ") },
    { key: "meta", label: "생성 정보", value: `라이브러리 ${p.library_version} · seed ${p.seed} · ${SELECTION_MODE_LABELS[p.selection_mode]}` },
    ...PALETTE_ROLES.map((role) => ({ key: `palette-${role}`, label: `${PALETTE_ROLE_LABELS[role]} (${role})`, value: p.color_tokens[role].$value.toUpperCase() })),
  ];
}

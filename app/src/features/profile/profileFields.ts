/**
 * 프로필 값 표시 행 (DS-2A-04 3.1 표 순서). 첫 화면(값 목록)과 엔진(비교·요약)이 같은 행을 쓴다 — 비교 표 순서 = 3.1 표 순서.
 * 적용된 값(effectiveProfile)은 2a-04b — 지금은 조정이 없어 base를 그대로 보인다.
 */
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

/** 섹션 한 줄 "Hero · 풀블리드 이미지 + 좌측 카피" — 라이브러리 밖 유형은 변형 키 그대로 */
export function sectionLabel(type: SectionType, variant: string): string {
  const bound = type === "header" || type === "hero" || type === "footer" ? resolveVariant(SECTION_LIBRARY, type, variant)?.def.label : undefined;
  return `${SECTION_TYPE_LABELS[type]} · ${bound ?? variant}`;
}

export function profileFieldRows(p: DesignProfileInput, titleOf: (referenceId: string) => string): readonly FieldRow[] {
  const c = p.component_choices;
  const t = p.typography_tokens;
  const card = c.card_style;
  return [
    { key: "visual", label: "시각 방향", value: VISUAL_TAG_LABELS[p.visual_direction as VisualTagId] ?? p.visual_direction },
    { key: "layout", label: "레이아웃 방향", value: LAYOUT_LABELS[p.layout_direction as LayoutTypeId] ?? p.layout_direction },
    librarySection("Hero", "hero", "hero", c.hero?.variant),
    librarySection("메뉴", "header", "header", c.header?.variant),
    // 선택 값(CTA·이미지 비율·모바일)은 라이브러리 이름표가 없어 저장된 값을 그대로 보인다 (REPORT 설계 질문)
    { key: "cta", label: "CTA 위치", value: c.cta_placement ?? "없음" },
    { key: "card", label: "카드 스타일", value: card ? `${card.style} · ${card.surfaceTone === "dark" ? "어두운" : "밝은"} 카드` : "없음" },
    { key: "media", label: "이미지 비율", value: c.media_ratio ?? "없음" },
    { key: "mobile", label: "모바일 구조", value: c.mobile_pattern ?? "없음" },
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

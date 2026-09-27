/**
 * 초안 → DesignProfile 매핑 (SPEC 3.2·8.3 · TRD 4.3). 같은 입력이면 같은 출력(결정성).
 * 보드 초안 패널·대비 경고·저장소 확정이 모두 이 함수 하나를 쓴다(AC-24).
 */
import {
  COLUMN_LABELS,
  PICKABLE_ROW_IDS,
  rowDef,
  type BoundSectionType,
  type CellBinding,
  type ColorTokens,
  type ColumnLabel,
  type CompareBoard,
  type ComparisonCell,
  type ComparisonResult,
  type DesignProfileInput,
  type MotionPreset,
  type PickableRowId,
  type SectionPlanEntry,
  type SurfaceTone,
} from "./compareBoard";
import { EMPTY_CELL_LABEL } from "./comparisonCells";
import { fontFamilyOf } from "./fonts";
import { derivePalette } from "./palette";
import type { MotionLevel } from "./reference";
import type { PaletteEntry } from "./referenceDetail";
import { DEFAULT_FOOTER_VARIANT, SECTION_LIBRARY } from "./sectionLibrary";

export type DraftSource =
  | { readonly kind: "pick" | "default"; readonly referenceId: string; readonly columnLabel: ColumnLabel; readonly title: string }
  /** 사용자 대표색·폰트 */
  | { readonly kind: "custom" }
  /** 기준 레퍼런스에 값이 없어 기본값 (Footer: 라이브러리 기본 Footer · 폰트: Pretendard · 그 외: 없음) */
  | { readonly kind: "fallback" }
  /** Hero 전 — 기본값을 계산할 수 없음 */
  | { readonly kind: "pending" };

export interface DraftItemData {
  readonly rowId: PickableRowId;
  readonly label: string;
  readonly valueLabel: string;
  readonly source: DraftSource;
}

export interface DraftNotices {
  /** R-07: 모션 '높음'을 L2로 낮춰 적용 */
  readonly motionCapped: boolean;
  /** R-15: 서로 다른 레퍼런스에서 2개 이상 고름 → 팔레트·폰트로 다시 칠함 */
  readonly rebinding: boolean;
}

export interface NeedsHeroDraft {
  readonly status: "needs-hero";
  readonly items: readonly DraftItemData[];
}

export interface ReadyDraft {
  readonly status: "ready";
  readonly baseReferenceId: string;
  readonly items: readonly DraftItemData[];
  readonly profile: DesignProfileInput;
  /** color_tokens와 같은 역할 팔레트 — 대비 검사 입력 */
  readonly palette: readonly PaletteEntry[];
  readonly cardTone?: SurfaceTone;
  readonly notices: DraftNotices;
}

export type ProfileDraft = NeedsHeroDraft | ReadyDraft;

export const NEEDS_HERO_LABEL = "Hero를 먼저 고르세요";
/** 폰트 행 값이 없을 때 typography_tokens 기본값의 표시 */
export const DEFAULT_FONT_LABEL = "Pretendard 700 / 400";
const MOTION_PRESET: Readonly<Record<MotionLevel, MotionPreset>> = { low: "L1", mid: "L2", high: "L2" };

interface Resolved {
  readonly cell: ComparisonCell;
  readonly binding: CellBinding;
  readonly source: DraftSource;
}

function available(results: readonly ComparisonResult[], referenceId: string | undefined) {
  const result = results.find((r) => r.referenceId === referenceId);
  return result?.status === "available" && result.comparison && result.reference ? result : undefined;
}

function sourceOf(kind: "pick" | "default", board: CompareBoard, results: readonly ComparisonResult[], referenceId: string): DraftSource {
  const columnLabel = board.columns.find((c) => c.referenceId === referenceId)?.label ?? "A";
  return { kind, referenceId, columnLabel, title: available(results, referenceId)?.reference?.title ?? referenceId };
}

/** 선택 → (없으면) 기준 레퍼런스 기본값 → (Footer만) 라이브러리 기본 Footer */
function resolveRow(row: PickableRowId, board: CompareBoard, results: readonly ComparisonResult[], baseId?: string): Resolved | undefined {
  const pickedId = board.picks[row];
  const picked = available(results, pickedId)?.comparison?.cells[row];
  if (pickedId && picked?.binding) return { cell: picked, binding: picked.binding, source: sourceOf("pick", board, results, pickedId) };
  if (baseId === undefined) return undefined;
  const base = available(results, baseId)?.comparison?.cells[row];
  if (base?.binding) return { cell: base, binding: base.binding, source: sourceOf("default", board, results, baseId) };
  if (row !== "footer") return undefined;
  const binding = { kind: "section", sectionType: "footer", variant: DEFAULT_FOOTER_VARIANT } as const;
  const label = SECTION_LIBRARY.sections.footer[DEFAULT_FOOTER_VARIANT]?.label ?? DEFAULT_FOOTER_VARIANT;
  return { cell: { label, binding }, binding, source: { kind: "fallback" } };
}

function itemOf(row: PickableRowId, resolved: Resolved | undefined, board: CompareBoard, hasBase: boolean): DraftItemData {
  const label = rowDef(row).label;
  const { primaryColor, fontFamily } = board.custom;
  if (row === "palette" && primaryColor) return { rowId: row, label, valueLabel: `${primaryColor} · 사용자 대표색`, source: { kind: "custom" } };
  if (row === "font" && fontFamily) return { rowId: row, label, valueLabel: fontFamilyOf(fontFamily), source: { kind: "custom" } };
  if (!resolved && !hasBase) return { rowId: row, label, valueLabel: NEEDS_HERO_LABEL, source: { kind: "pending" } };
  // 기준 레퍼런스에도 값이 없는 행(목록 밖 폰트·없는 섹션) — 확정 값과 같은 기본값을 보여 준다
  if (!resolved) return { rowId: row, label, valueLabel: row === "font" ? DEFAULT_FONT_LABEL : EMPTY_CELL_LABEL, source: { kind: "fallback" } };
  return { rowId: row, label, valueLabel: resolved.cell.label, source: resolved.source };
}

/** FNV-1a 32비트 — 3안 결과 해시도 같은 함수 (DS-2A-04 6.2 CandidatePlan.hash) */
export function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, "0");
}

const sortedEntries = (record: object) => Object.entries(record).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b));

/** picks·custom·열 id 정규화 JSON의 해시 (같은 선택 → 같은 seed) */
function seedOf(board: CompareBoard): string {
  const columns = [...board.columns].sort((a, b) => a.label.localeCompare(b.label)).map((c) => [c.label, c.referenceId]);
  return hash(JSON.stringify({ columns, picks: sortedEntries(board.picks), custom: sortedEntries(board.custom) }));
}

function sectionPlanOf(basePlan: readonly SectionPlanEntry[], chosen: Partial<Record<BoundSectionType, string>>): readonly SectionPlanEntry[] {
  const plan = basePlan.map((entry) => {
    const variant = chosen[entry.type as BoundSectionType];
    return variant === undefined ? entry : { type: entry.type, variant };
  });
  const withHeader = chosen.header && !plan.some((s) => s.type === "header") ? [{ type: "header" as const, variant: chosen.header }, ...plan] : plan;
  return chosen.footer && !withHeader.some((s) => s.type === "footer") ? [...withHeader, { type: "footer", variant: chosen.footer }] : withHeader;
}

const toColorTokens = (palette: readonly PaletteEntry[], seed?: string): ColorTokens => {
  const roles = Object.fromEntries(palette.map((p) => [p.role, { $type: "color", $value: p.hex }])) as Omit<ColorTokens, "$extensions">;
  return seed ? { ...roles, $extensions: { seed } } : roles;
};

export function buildProfileDraft(board: CompareBoard, results: readonly ComparisonResult[], libraryVersion: string): ProfileDraft {
  const heroId = board.picks.hero;
  const base = available(results, heroId)?.comparison?.cells.hero.binding ? available(results, heroId) : undefined;
  const resolved = new Map(PICKABLE_ROW_IDS.map((row) => [row, resolveRow(row, board, results, base?.referenceId)] as const));
  const items = PICKABLE_ROW_IDS.map((row) => itemOf(row, resolved.get(row), board, base !== undefined));
  if (!base?.comparison || !base.reference) return { status: "needs-hero", items };

  const bindingOf = <K extends CellBinding["kind"]>(row: PickableRowId, kind: K) => {
    const binding = resolved.get(row)?.binding;
    return binding?.kind === kind ? (binding as Extract<CellBinding, { kind: K }>) : undefined;
  };
  const section = (row: PickableRowId) => bindingOf(row, "section")?.variant;
  const choice = (row: PickableRowId) => bindingOf(row, "choice")?.value;
  const chosen = { hero: section("hero"), header: section("menu"), footer: section("footer") };
  const palette = derivePalette(board.custom.primaryColor, bindingOf("palette", "palette")?.palette ?? []);
  const font = bindingOf("font", "typography");
  const motion = bindingOf("motion", "motion")?.level ?? "low";
  const card = bindingOf("card", "card");

  // 출처는 표시용 items가 아니라 실제 해석된 선택에서 센다 — 사용자 대표색이어도 팔레트 행의 나머지 역할은 그 레퍼런스 값이다
  const pickedIds = new Set([...resolved.values()].flatMap((r) => (r?.source.kind === "pick" ? [r.source.referenceId] : [])));
  const labelOf = (id: string) => COLUMN_LABELS.indexOf(board.columns.find((c) => c.referenceId === id)?.label ?? "F");
  const hasCustom = board.custom.primaryColor !== undefined || board.custom.fontFamily !== undefined;
  const { hero, header, footer } = chosen;

  const profile: DesignProfileInput = {
    source_reference_ids: [...new Set([...pickedIds, base.referenceId])].sort((a, b) => labelOf(a) - labelOf(b)),
    visual_direction: base.reference.visualTags[0] ?? "",
    layout_direction: base.reference.layoutType,
    color_tokens: toColorTokens(palette, board.custom.primaryColor),
    typography_tokens: {
      family: board.custom.fontFamily ? fontFamilyOf(board.custom.fontFamily) : (font?.family ?? "Pretendard"),
      headingWeight: font?.headingWeight ?? 700,
      bodyWeight: font?.bodyWeight ?? 400,
      scale: font?.scale ?? 1.25,
    },
    spacing_tokens: base.comparison.spacing,
    motion_preset: MOTION_PRESET[motion],
    component_choices: {
      ...(hero && { hero: { section: "hero", variant: hero } }),
      ...(header && { header: { section: "header", variant: header } }),
      ...(footer && { footer: { section: "footer", variant: footer } }),
      ...(choice("cta") && { cta_placement: choice("cta") }),
      ...(card && { card_style: { style: card.style, surfaceTone: card.surfaceTone } }),
      ...(choice("imageRatio") && { media_ratio: choice("imageRatio") }),
      ...(choice("mobile") && { mobile_pattern: choice("mobile") }),
    },
    section_plan: sectionPlanOf(base.comparison.sectionPlan, chosen),
    library_version: libraryVersion,
    seed: seedOf(board),
    selection_mode: pickedIds.size === 1 && !hasCustom ? "template" : "mix",
  };
  return {
    status: "ready",
    baseReferenceId: base.referenceId,
    items,
    profile,
    palette,
    ...(card && { cardTone: card.surfaceTone }),
    notices: { motionCapped: motion === "high", rebinding: pickedIds.size >= 2 },
  };
}

/**
 * 테스트용 게이트 테마 — 프로필 버전 1개(base + 조정). 색 값은 테스트 데이터다(화면 코드 아님).
 */
import type { DesignProfileInput, SurfaceTone } from "../../domain/compareBoard";
import type { ProfileAdjustments, ProfileVersion } from "../../domain/profile";
import type { PaletteRole } from "../../domain/referenceDetail";
import type { GateTheme } from "../contracts/pending";
import { deepFreeze } from "../freeze";

export type Palette = Readonly<Record<PaletteRole, string>>;

/** 모든 검사(AA·강화) 통과 */
export const GOOD_PALETTE: Palette = { primary: "#1F3A5F", surface: "#F2F4F7", ink: "#1A1A1A", muted: "#4A4A4A", bg: "#FFFFFF" };
/** QA-2A04B2 D-2A4B2-01 재현 팔레트(모던 카페 — fixtures/referenceDetails ref-a) */
export const CAFE_PALETTE: Palette = { primary: "#8B5E3C", surface: "#F3E9DD", ink: "#2C2C2C", muted: "#9A7B63", bg: "#FFFFFF" };

const tokens = (palette: Palette) =>
  Object.fromEntries(Object.entries(palette).map(([role, hex]) => [role, { $type: "color", $value: hex }])) as DesignProfileInput["color_tokens"];

export function sampleBase(palette: Palette = GOOD_PALETTE, cardTone?: SurfaceTone): DesignProfileInput {
  return {
    source_reference_ids: ["ref-a"],
    visual_direction: "warm",
    layout_direction: "editorial",
    color_tokens: tokens(palette),
    typography_tokens: { family: "Pretendard", headingWeight: 700, bodyWeight: 400, scale: 1.25 },
    spacing_tokens: { grid: "8pt", sectionGap: 96 },
    motion_preset: "L1",
    component_choices: cardTone ? { card_style: { style: "flat", surfaceTone: cardTone } } : {},
    section_plan: [],
    library_version: "1.4",
    seed: "1a2b3c4d",
    selection_mode: "template",
  };
}

interface ThemeOpts {
  readonly palette?: Palette;
  readonly cardTone?: SurfaceTone;
  readonly adjustments?: ProfileAdjustments;
  readonly purpose?: GateTheme["purpose"];
}

export function sampleTheme(opts: ThemeOpts = {}): GateTheme {
  const profile: ProfileVersion = {
    profileId: "profile-1",
    version: 2,
    origin: "adjust",
    baseReferenceId: "ref-a",
    base: sampleBase(opts.palette, opts.cardTone),
    adjustments: opts.adjustments ?? {},
    createdAt: "2026-09-26T00:00:00.000Z",
  };
  return deepFreeze({ profile, purpose: opts.purpose ?? "none" });
}

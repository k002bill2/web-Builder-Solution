/**
 * 저장 안 된 조정(초안) — 프로필 화면 전역 조정 · 보정값 쓰기 (DS-2A-04 P-S10·S13·S14). 엔진 청크 전용.
 * 초안 = 최신 저장값 + 편집. 편집은 고른 보이는 값만 들고 있어 STALE_PROFILE로 저장값이 바뀌어도 사용자 입력이 남는다(P-S12).
 * 규칙: 기본값(여유·기본 AA·보드 모션·정하지 않음)을 고르면 그 조정 키를 지운다 — "조정 = 보드 값과 다른 것".
 * 개수 = 보이는 값이 저장값과 다른 조정 키 + 보정 항목(6.1-3 개수 단위).
 */
import type { DesignProfileInput, MotionPreset } from "../../domain/compareBoard";
import type { AdjustmentRange, ContrastLevel, Density, PaletteCorrection, ProfileAdjustments } from "../../domain/profile";
import { normalizeAdjustments } from "../../domain/effectiveProfile";
import type { PurposeId } from "../../domain/reference";
import type { PaletteRole } from "../../domain/referenceDetail";

export interface AdjustValues {
  readonly density: Density;
  readonly contrast: ContrastLevel;
  readonly motion: MotionPreset;
  readonly purpose: PurposeId | "none";
}
export type AdjustKey = keyof AdjustValues;
/** 테마 허용 범위가 있는 조정 (3.4 — 목적은 전부 허용) */
export type RangedKey = "density" | "contrast" | "motion";

export const ADJUST_KEYS: readonly AdjustKey[] = ["density", "contrast", "motion", "purpose"];
const RANGED_KEYS: readonly RangedKey[] = ["density", "contrast", "motion"];
const ROLE_ORDER: readonly PaletteRole[] = ["primary", "surface", "ink", "muted", "bg"];

export interface Edits {
  readonly values: Partial<AdjustValues>;
  readonly corrections: Readonly<Partial<Record<PaletteRole, PaletteCorrection>>>;
}

export const NO_EDITS: Edits = Object.freeze({ values: Object.freeze({}), corrections: Object.freeze({}) });

const defaultsOf = (base: DesignProfileInput): AdjustValues => ({ density: "comfortable", contrast: "aa", motion: base.motion_preset, purpose: "none" });

/** 보이는 값 — 키가 없으면 기본값 */
export function valuesOf(adjustments: ProfileAdjustments, base: DesignProfileInput): AdjustValues {
  return { ...defaultsOf(base), ...normalizeAdjustments({ ...adjustments, corrections: [] }) } as AdjustValues;
}

/** 값 고르기 — 저장값과 같으면 편집을 지운다 */
export function pickValue<K extends AdjustKey>(edits: Edits, saved: ProfileAdjustments, base: DesignProfileInput, key: K, value: AdjustValues[K]): Edits {
  const values: Partial<Record<AdjustKey, string>> = { ...edits.values };
  if (valuesOf(saved, base)[key] === value) delete values[key];
  else values[key] = value;
  return { ...edits, values: values as Partial<AdjustValues> };
}

const toOf = (adjustments: ProfileAdjustments, role: PaletteRole) => adjustments.corrections?.find((c) => c.role === role)?.to.toUpperCase();

/** 보정값 쓰기 — 역할마다 하나(교체). 저장된 보정과 같으면 편집을 지운다 */
export function writeCorrection(edits: Edits, saved: ProfileAdjustments, correction: PaletteCorrection): Edits {
  const corrections: Partial<Record<PaletteRole, PaletteCorrection>> = { ...edits.corrections };
  if (toOf(saved, correction.role) === correction.to.toUpperCase()) delete corrections[correction.role];
  else corrections[correction.role] = correction;
  return { ...edits, corrections };
}

/** 초안 = 저장값 + 편집 (정규화 — 저장소 멱등 키와 같은 모양) */
export function applyEdits(saved: ProfileAdjustments, edits: Edits, base: DesignProfileInput): ProfileAdjustments {
  const out: Record<string, unknown> = { ...saved };
  const defaults = defaultsOf(base);
  for (const key of ADJUST_KEYS) {
    const value = edits.values[key];
    if (value === undefined) continue;
    if (value === defaults[key]) delete out[key];
    else out[key] = value;
  }
  out.corrections = ROLE_ORDER.flatMap((role) => {
    const correction = edits.corrections[role] ?? saved.corrections?.find((c) => c.role === role);
    return correction ? [correction] : [];
  });
  return normalizeAdjustments(out as ProfileAdjustments);
}

export function pendingCount(saved: ProfileAdjustments, draft: ProfileAdjustments, base: DesignProfileInput): number {
  const before = valuesOf(saved, base);
  const after = valuesOf(draft, base);
  const roles = ROLE_ORDER.filter((role) => toOf(saved, role) !== toOf(draft, role));
  return ADJUST_KEYS.filter((key) => before[key] !== after[key]).length + roles.length;
}

/** 허용 범위 밖 조정 (P-S13) */
export function outOfRange(values: AdjustValues, range: AdjustmentRange): readonly RangedKey[] {
  return RANGED_KEYS.filter((key) => !(range[key] as readonly string[]).includes(values[key]));
}

/** "맞추기" 값 — 기본값이 범위 안이면 기본값, 아니면 범위 첫 값 */
export function fitValue<K extends RangedKey>(key: K, range: AdjustmentRange, base: DesignProfileInput): AdjustValues[K] {
  const fallback = defaultsOf(base)[key];
  const allowed = range[key] as readonly AdjustValues[K][];
  return allowed.includes(fallback) ? fallback : (allowed[0] ?? fallback);
}

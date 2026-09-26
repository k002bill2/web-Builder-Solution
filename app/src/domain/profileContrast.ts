/**
 * 프로필 대비 검사 C-1~C-5 · 역할별 보정 제안 · 충돌 판정 (DS-2A-04 3.3). 보드 `checkPaletteContrast`(C-1~C-3)와
 * 같은 `contrast.ts` 계산을 쓴다. 엔진 청크 전용(zod 없음) — 첫 화면 정적 JS에 넣지 않는다(P-B6).
 * 수치 재현: `docs/design/2a-04/contrast_calc_2a04.py` "역할별 보정" 절.
 */
import { AA_BODY_RATIO, ON_PRIMARY, contrastRatio, nearestCompliantColor, type ContrastCheckId } from "./contrast";
import type { SurfaceTone } from "./compareBoard";
import type { ContrastLevel } from "./profile";
import type { PaletteEntry, PaletteRole } from "./referenceDetail";

/** 대비 조정 목표 (Q3): 기본 AA 4.5 · 강화 7.0 */
export const CONTRAST_TARGET: Readonly<Record<ContrastLevel, number>> = Object.freeze({ aa: AA_BODY_RATIO, enhanced: 7 });

interface CheckDef {
  readonly id: ContrastCheckId;
  /** 없으면 흰 글자(on-primary) */
  readonly foreground?: PaletteRole;
  readonly background: PaletteRole;
  /** 보정 대상 역할 — C-1은 면(primary), 나머지는 글자 역할 */
  readonly role: PaletteRole;
  readonly darkCardOnly?: boolean;
}

const CHECKS: readonly CheckDef[] = Object.freeze([
  { id: "C-1", background: "primary", role: "primary" },
  { id: "C-2", foreground: "ink", background: "bg", role: "ink" },
  { id: "C-3", foreground: "ink", background: "primary", role: "ink", darkCardOnly: true },
  { id: "C-4", foreground: "ink", background: "surface", role: "ink" },
  { id: "C-5", foreground: "muted", background: "bg", role: "muted" },
]);
const CORRECTABLE_ROLES: readonly PaletteRole[] = ["primary", "ink", "muted"];

export interface ProfileContrastCheck {
  readonly id: ContrastCheckId;
  readonly role: PaletteRole;
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly target: number;
  readonly pass: boolean;
}

export interface BrokenCheck {
  readonly id: ContrastCheckId;
  readonly before: number;
  readonly after: number;
}

export interface CorrectionProposal {
  readonly role: PaletteRole;
  readonly from: string;
  readonly to: string;
  /** 보정 기준 = 그 역할 검사 중 대비가 가장 낮은 미달 검사 */
  readonly basis: ContrastCheckId;
  readonly before: number;
  readonly after: number;
  readonly lightnessDelta: number;
  /** 그 역할이 놓이는 검사 전부 */
  readonly checks: readonly ContrastCheckId[];
  /** 충돌(P-S15): 보정 없이 통과하던 검사가 새로 미달, 또는 같은 역할 검사가 여전히 미달. 있으면 "보정값 쓰기" 없음 */
  readonly conflict?: readonly BrokenCheck[];
  /**
   * 명도 전 구간에서 목표에 못 닿음(강화 7.0 + 중간 명도 배경, D-2A4B2-01). `to`·`after`는 대비가 가장 높은 후보이고,
   * 기준 검사가 여전히 미달이라 `conflict`가 늘 함께 온다 — 화면은 P-S15 충돌(보정값 쓰기 없음)로 보인다
   */
  readonly unreachable?: true;
}

const hexOf = (palette: readonly PaletteEntry[], role: PaletteRole): string => {
  const entry = palette.find((p) => p.role === role);
  if (!entry) throw new Error(`팔레트에 ${role} 역할이 없습니다`);
  return entry.hex.toUpperCase();
};

export function checkProfileContrast(palette: readonly PaletteEntry[], cardTone: SurfaceTone | undefined, level: ContrastLevel): readonly ProfileContrastCheck[] {
  const target = CONTRAST_TARGET[level];
  return CHECKS.filter((c) => !c.darkCardOnly || cardTone === "dark").map((c) => {
    const foreground = c.foreground ? hexOf(palette, c.foreground) : ON_PRIMARY;
    const background = hexOf(palette, c.background);
    const ratio = contrastRatio(foreground, background);
    return { id: c.id, role: c.role, foreground, background, ratio, target, pass: ratio >= target };
  });
}

export function proposeCorrections(palette: readonly PaletteEntry[], cardTone: SurfaceTone | undefined, level: ContrastLevel): readonly CorrectionProposal[] {
  const before = checkProfileContrast(palette, cardTone, level);
  return CORRECTABLE_ROLES.flatMap((role): CorrectionProposal[] => {
    const own = before.filter((c) => c.role === role);
    const basis = own.filter((c) => !c.pass).sort((a, b) => a.ratio - b.ratio)[0];
    if (!basis) return [];
    const target = CONTRAST_TARGET[level];
    // C-1은 흰 글자를 두고 면(primary)을 옮긴다 — 나머지는 배경을 두고 글자 역할을 옮긴다
    const search = nearestCompliantColor(role === "primary" ? basis.background : basis.foreground, role === "primary" ? ON_PRIMARY : basis.background, target);
    const fix = search.reached ? search.fix : search.best;
    const after = checkProfileContrast(palette.map((p) => (p.role === role ? { ...p, hex: fix.hex } : p)), cardTone, level);
    const broken = after.flatMap((c, i): BrokenCheck[] => {
      const was = before[i]!;
      const newlyFailing = was.pass && !c.pass;
      const stillFailing = c.role === role && !c.pass;
      return newlyFailing || stillFailing ? [{ id: c.id, before: was.ratio, after: c.ratio }] : [];
    });
    return [{
      role,
      from: hexOf(palette, role),
      to: fix.hex,
      basis: basis.id,
      before: basis.ratio,
      after: fix.ratio,
      lightnessDelta: fix.lightnessDelta,
      checks: own.map((c) => c.id),
      ...(broken.length > 0 && { conflict: broken }),
      ...(!search.reached && { unreachable: true as const }),
    }];
  });
}

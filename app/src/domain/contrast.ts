/** WCAG 2.x 대비 계산 (SPEC 3.4 · R-08). 순수 함수 — 보드 경고와 확정이 같은 팔레트로 계산한다. */
import { hexToHsl } from "./colorFamily";
import type { SurfaceTone } from "./compareBoard";
import type { PaletteEntry, PaletteRole } from "./referenceDetail";

/** 본문 기준 대비 */
export const AA_BODY_RATIO = 4.5;
/** `on-primary` 글자색 (버튼·CTA·어두운 카드) */
export const ON_PRIMARY = "#FFFFFF";
/** 보정 탐색 간격 (명도 %p) */
const LIGHTNESS_STEP = 0.1;

const channel = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

export function relativeLuminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`#RRGGBB 색이 아닙니다: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(m[1]!.slice(i, i + 2), 16) / 255)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** "3.2:1" — 버림이라 기준 미달 값이 기준값으로 보이지 않는다. */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 10) / 10).toFixed(1)}:1`;
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${[0, 8, 4].map((n) => Math.round(f(n) * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** 색상·채도는 두고 명도만 delta(%p)만큼 옮긴다 (0~100 제한). */
export function shiftLightness(hex: string, delta: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, Math.max(0, l + delta)));
}

export interface ContrastFix {
  readonly hex: string;
  readonly ratio: number;
  /** 원래 색에서 옮긴 명도(%p). 음수 = 어둡게 */
  readonly lightnessDelta: number;
}

/** `against` 위(또는 아래)에서 target 이상이 되는 가장 가까운 명도의 색. 같은 거리면 어두운 쪽. */
export function nearestCompliantColor(hex: string, against: string, target = AA_BODY_RATIO): ContrastFix {
  const original = hex.toUpperCase();
  for (let k = 0; k * LIGHTNESS_STEP <= 100; k += 1) {
    for (const delta of k === 0 ? [0] : [-k * LIGHTNESS_STEP, k * LIGHTNESS_STEP]) {
      const candidate = delta === 0 ? original : shiftLightness(original, delta);
      const ratio = contrastRatio(candidate, against);
      if (ratio >= target) return { hex: candidate, ratio, lightnessDelta: delta };
    }
  }
  // 흑·백 중 하나는 어떤 색에도 4.5:1 이상이라 여기에 오지 않는다
  throw new Error(`대비 ${target}:1을 만들 수 없습니다: ${hex} / ${against}`);
}

export type ContrastCheckId = "C-1" | "C-2" | "C-3";

export interface ContrastCheck {
  readonly id: ContrastCheckId;
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly pass: boolean;
}

function hexOf(palette: readonly PaletteEntry[], role: PaletteRole): string {
  const entry = palette.find((p) => p.role === role);
  if (!entry) throw new Error(`팔레트에 ${role} 역할이 없습니다`);
  return entry.hex;
}

function check(id: ContrastCheckId, foreground: string, background: string): ContrastCheck {
  const ratio = contrastRatio(foreground, background);
  return { id, foreground, background, ratio, pass: ratio >= AA_BODY_RATIO };
}

/**
 * C-1 흰 글자 vs 대표색 · C-2 잉크 vs 배경 · C-3(어두운 카드일 때) 카드 글자(잉크) vs 카드 표면(대표색).
 * C-3의 색 쌍은 SPEC "재바인딩 후 대표색/잉크"를 표면=대표색, 글자=잉크로 해석했다(목업 B 다크 카드 = 검정 표면 + 골드 글자).
 */
export function checkPaletteContrast(palette: readonly PaletteEntry[], cardTone: SurfaceTone | undefined): readonly ContrastCheck[] {
  const primary = hexOf(palette, "primary");
  const checks = [check("C-1", ON_PRIMARY, primary), check("C-2", hexOf(palette, "ink"), hexOf(palette, "bg"))];
  return cardTone === "dark" ? [...checks, check("C-3", hexOf(palette, "ink"), primary)] : checks;
}

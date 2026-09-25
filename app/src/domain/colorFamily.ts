/** 대표색(c1) 계열 — 카탈로그 색상 필터 (FR-CAT-01). 저장하지 않고 팔레트에서 매번 계산한다. */
export type ColorFamily = "neutral" | "warm" | "green" | "cool";

export interface Hsl {
  /** 색상각 0 이상 360 미만 */
  readonly h: number;
  /** 채도 % */
  readonly s: number;
  /** 명도 % */
  readonly l: number;
}

/** 경계값 (colorFamily.test.ts가 고정). 색상각 구간은 하한 포함·상한 제외. */
export const COLOR_FAMILY_RULES = Object.freeze({
  /** 이 채도(%) 미만은 무채색 */
  minSaturation: 15,
  /** 이 명도(%) 미만은 무채색 — 아주 어두운 색은 채도 수치가 높아도 검정으로 보인다 */
  minLightness: 8,
  /** 이 명도(%) 초과는 무채색 */
  maxLightness: 95,
  /** [0, 70)·[330, 360): 따뜻한 계열 (빨강·주황·노랑·자주) */
  warmUntilHue: 70,
  /** [70, 170): 그린 계열 */
  greenUntilHue: 170,
  /** [170, 330): 차가운 계열 (청록·파랑·보라) */
  coolUntilHue: 330,
});

export function hexToHsl(hex: string): Hsl {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`hex 색이 아닙니다: ${hex}`);
  const full = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  const sector = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (sector * 60 + 360) % 360, s: s * 100, l: l * 100 };
}

export function colorFamilyOfHsl({ h, s, l }: Hsl): ColorFamily {
  const rules = COLOR_FAMILY_RULES;
  if (s < rules.minSaturation || l < rules.minLightness || l > rules.maxLightness) return "neutral";
  if (h < rules.warmUntilHue || h >= rules.coolUntilHue) return "warm";
  return h < rules.greenUntilHue ? "green" : "cool";
}

export function colorFamilyOf(hex: string): ColorFamily {
  return colorFamilyOfHsl(hexToHsl(hex));
}

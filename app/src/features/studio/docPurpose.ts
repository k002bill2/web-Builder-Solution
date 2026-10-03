import type { MotionPreset } from "../../domain/compareBoard";
import type { ProfileSeries } from "../../domain/profile";
import type { ColorTokens as CanvasTokens } from "../../domain/compareBoard";
import type { Purpose } from "../../engine/ops/rules";
import type { CanvasPalette, KitCardStyle, KitTokenInput } from "../../render/protocol";

const versionOf = (series: ProfileSeries | undefined, profileVersion: number) => series?.versions.find((v) => v.version === profileVersion);

/**
 * 문서 목적 파생 (SPEC r4.6 A3-Q2 A = Q-19 A) — 문서 `profileVersion` 버전의 `adjustments.purpose ?? "none"`.
 * 연산(`canRemove`·`swapVariant`)과 게이트가 이 함수 하나를 쓴다. 최신 버전이 아니라 **문서가 가리키는 버전**을 읽는다.
 */
export function docPurpose(series: ProfileSeries | undefined, profileVersion: number): Purpose {
  return versionOf(series, profileVersion)?.adjustments.purpose ?? "none";
}

/** 새 섹션 모션 프리셋(5.3) — 같은 버전의 적용 값 `adjustments.motion ?? base.motion_preset`, 버전이 없으면 L1 */
export function docMotionPreset(series: ProfileSeries | undefined, profileVersion: number): MotionPreset {
  const version = versionOf(series, profileVersion);
  return version ? (version.adjustments.motion ?? version.base.motion_preset) : "L1";
}

/** 캔버스 색(A3-Q7 · 5.7) — 같은 버전의 팔레트 역할 5개, 보정(corrections)은 나중 것이 이긴다. 버전이 없으면 undefined(중립 토큰) */
export function docPalette(series: ProfileSeries | undefined, profileVersion: number): CanvasPalette | undefined {
  const version = versionOf(series, profileVersion);
  // 팔레트가 없는 버전(부분 레코드)도 편집은 계속 — 중립 토큰
  const tokens = version?.base.color_tokens as Partial<CanvasTokens> | undefined;
  if (!version || !tokens?.primary) return undefined;
  const fixed = (role: keyof CanvasPalette) => version.adjustments.corrections?.findLast((c) => c.role === role)?.to ?? tokens[role]?.$value ?? "";
  return { primary: fixed("primary"), surface: fixed("surface"), ink: fixed("ink"), muted: fixed("muted"), bg: fixed("bg") };
}

const CARD_STYLES: readonly KitCardStyle[] = ["bordered-lg", "bordered-md", "elevated", "flat"];
const RATIOS: readonly KitTokenInput["mediaRatio"][] = ["16:9", "4:5", "1:1"];
const pick = <T extends string>(list: readonly T[], value: string | undefined, fallback: T): T => list.find((v) => v === value) ?? fallback;

/**
 * 킷 토큰 입력 (M2A-2a K1 · m2a 0.2 · MQ-1) — 같은 버전의 값 + 조정. 팔레트 = docPalette(보정 반영), sectionGap = base 값 + density
 * (촘촘 환산은 렌더 문서 생성기 kit/tokens — effectiveProfile을 부모 청크에 넣지 않는다, /studio 진입 예산. 같은 규칙인지 src/test/kitTokens.test.ts가 대조).
 * 팔레트·글꼴이 없는 버전(부분 레코드)·버전 없음 = undefined → 렌더 문서는 킷을 그리지 않고 error, 폴백은 중립 토큰으로 계속.
 */
export function docKitTokens(series: ProfileSeries | undefined, profileVersion: number): KitTokenInput | undefined {
  const version = versionOf(series, profileVersion);
  const palette = docPalette(series, profileVersion);
  if (!version || !palette || !version.base.typography_tokens) return undefined;
  const { typography_tokens, spacing_tokens, component_choices: choices = {} } = version.base;
  const { family, headingWeight, bodyWeight, scale } = typography_tokens;
  const grid = Number.parseFloat(spacing_tokens.grid);
  return {
    palette,
    card: { tone: choices.card_style?.surfaceTone === "dark" ? "dark" : "light", style: pick(CARD_STYLES, choices.card_style?.style, "bordered-md") },
    type: { family, headingWeight, bodyWeight, scale },
    space: { grid: Number.isFinite(grid) && grid > 0 ? grid : 8, sectionGap: spacing_tokens.sectionGap, density: version.adjustments.density ?? "comfortable" },
    mediaRatio: pick(RATIOS, choices.media_ratio, "4:5"),
  };
}

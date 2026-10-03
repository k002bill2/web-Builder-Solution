import type { MotionPreset } from "../../domain/compareBoard";
import type { ProfileSeries } from "../../domain/profile";
import type { ColorTokens as CanvasTokens } from "../../domain/compareBoard";
import type { Purpose } from "../../engine/ops/rules";
import type { CanvasPalette } from "../../render/protocol";

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

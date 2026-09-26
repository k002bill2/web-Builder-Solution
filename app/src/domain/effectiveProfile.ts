/**
 * 적용된 값 = base + 조정 (DS-2A-04 6.1-2 · 6.4 `effectiveProfile`) · 조정 정규화 · 개수. zod·대비 계산 없음 —
 * 프로필 화면 엔진(값 목록·초안)과 저장소 쓰기 본문이 쓴다. 이어받기 규칙(profileAdjustments)이 다시 내보낸다.
 */
import type { DesignProfileInput } from "./compareBoard";
import type { ProfileAdjustments } from "./profile";

/** 조정 키 표시·개수 순서 */
const KEYS = ["density", "contrast", "motion", "purpose"] as const;

/** undefined 키·빈 보정 배열을 없애고 키 순서를 고정한다 — 저장·"바뀐 조정 없음" 비교의 기준 모양 */
export function normalizeAdjustments(adjustments: ProfileAdjustments): ProfileAdjustments {
  const out: Record<string, unknown> = {};
  for (const key of KEYS) if (adjustments[key] !== undefined) out[key] = adjustments[key];
  if (adjustments.corrections?.length) out.corrections = adjustments.corrections;
  return out as ProfileAdjustments;
}

/** 개수 단위: 조정 키 하나 = 1, 보정은 항목 하나 = 1 (6.1-3) */
export function adjustmentCount(adjustments: ProfileAdjustments): number {
  return KEYS.filter((key) => adjustments[key] !== undefined).length + (adjustments.corrections?.length ?? 0);
}

/** 촘촘 = 보드 간격 × 0.75를 8의 배수로 내림 (3.4: 96 → 72) */
const compactGap = (gap: number) => Math.floor((gap * 0.75) / 8) * 8;

/** 적용된 값 = base + 조정 (6.1-2). 대비·목적은 생성 입력이라 DesignProfileInput 값은 바꾸지 않는다 */
export function effectiveProfile(base: DesignProfileInput, adjustments: ProfileAdjustments): DesignProfileInput {
  const { density, motion, corrections = [] } = adjustments;
  if (density !== "compact" && motion === undefined && corrections.length === 0) return base;
  const color_tokens = corrections.reduce(
    (tokens, c) => ({ ...tokens, [c.role]: { ...tokens[c.role], $value: c.to } }),
    base.color_tokens,
  );
  return {
    ...base,
    color_tokens,
    ...(density === "compact" && { spacing_tokens: { ...base.spacing_tokens, sectionGap: compactGap(base.spacing_tokens.sectionGap) } }),
    ...(motion !== undefined && { motion_preset: motion }),
  };
}


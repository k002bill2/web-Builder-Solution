/**
 * 적용된 값·보드 재확정 이어받기 (DS-2A-04 SPEC 6.1-2·3 · 6.4). zod 없음 — 보드 P-S25 패널(조건부 청크)과
 * 프로필 메모리 저장소가 같은 함수를 같은 입력으로 부른다(패널에 보인 "이어짐" = 저장되는 adjustments).
 */
import type { DesignProfileInput } from "./compareBoard";
import type { CarryOverItem, CarryOverPlan, PaletteCorrection, ProfileAdjustments } from "./profile";
// 적용된 값·정규화·개수는 가벼운 모듈에 둔다 — 프로필 화면 엔진이 이어받기 규칙(대비 재계산) 없이 쓰게 (2a-04b2 번들)
export { adjustmentCount, effectiveProfile, normalizeAdjustments } from "./effectiveProfile";
import { checkProfileContrast } from "./profileContrast";
import type { PaletteEntry, PaletteRole } from "./referenceDetail";

const ROLES: readonly PaletteRole[] = ["primary", "surface", "ink", "muted", "bg"];
/** 조정 키 표시 순서 */
const KEYS = ["density", "contrast", "motion", "purpose"] as const;

const paletteOf = (base: DesignProfileInput, correction?: PaletteCorrection): readonly PaletteEntry[] =>
  ROLES.map((role) => ({ role, hex: role === correction?.role ? correction.to : base.color_tokens[role].$value }));

/** (a) 보정 대상 역할의 새 base 값 ≠ from → 팔레트가 바뀜 · (b) 보정 없이 통과하던 검사가 보정 때문에 미달 → 새 대비 실패 */
function correctionVerdict(correction: PaletteCorrection, nextBase: DesignProfileInput, adjustments: ProfileAdjustments): CarryOverItem["reason"] {
  if (nextBase.color_tokens[correction.role].$value.toUpperCase() !== correction.from.toUpperCase()) return "palette-changed";
  const tone = nextBase.component_choices.card_style?.surfaceTone;
  const level = adjustments.contrast ?? "aa";
  const before = checkProfileContrast(paletteOf(nextBase), tone, level);
  const after = checkProfileContrast(paletteOf(nextBase, correction), tone, level);
  return after.some((c, i) => before[i]!.pass && !c.pass) ? "new-contrast-failure" : undefined;
}

/**
 * 보드 재확정 이어받기 (6.1-3, 필드 단위 우선순위). 비교 기준 = 지난 확정 버전의 base(`confirmedBase`),
 * 이어받을 조정 = 최신 버전의 adjustments. 보드에서 바뀐 필드와 겹치는 조정은 지우고 나머지는 이어받는다.
 * 보정 (b)는 보정마다 따로 새 base에 적용해 판정한다(다른 보정과의 조합은 보지 않는다).
 */
export function carryOverAdjustments(confirmedBase: DesignProfileInput, latestAdjustments: ProfileAdjustments, nextBase: DesignProfileInput): CarryOverPlan {
  const kept: CarryOverItem[] = [];
  const dropped: CarryOverItem[] = [];
  const next: Record<string, unknown> = {};
  for (const key of KEYS) {
    const value = latestAdjustments[key];
    if (value === undefined) continue;
    if (key === "motion" && nextBase.motion_preset !== confirmedBase.motion_preset) {
      dropped.push({ key, reason: "board-changed" });
      continue;
    }
    kept.push({ key });
    next[key] = value;
  }
  const corrections = (latestAdjustments.corrections ?? []).filter((correction) => {
    const reason = correctionVerdict(correction, nextBase, latestAdjustments);
    (reason ? dropped : kept).push({ key: "correction", role: correction.role, ...(reason && { reason }) });
    return reason === undefined;
  });
  if (corrections.length > 0) next.corrections = corrections;
  return { kept, dropped, adjustments: next as ProfileAdjustments };
}

import type { MotionPreset } from "../../domain/compareBoard";
import type { ProfileSeries } from "../../domain/profile";
import type { Purpose } from "../../engine/ops/rules";

/**
 * 문서 목적 파생 (SPEC r4.6 A3-Q2 A = Q-19 A) — 문서 `profileVersion` 버전의 `adjustments.purpose ?? "none"`.
 * 연산(`canRemove`·`swapVariant`)과 게이트가 이 함수 하나를 쓴다. 최신 버전이 아니라 **문서가 가리키는 버전**을 읽는다.
 */
export function docPurpose(series: ProfileSeries | undefined, profileVersion: number): Purpose {
  throw new Error(`K1 RED ${series?.profileId} ${profileVersion}`);
}

/** 새 섹션 모션 프리셋(5.3) — 같은 버전의 적용 값 `adjustments.motion ?? base.motion_preset`, 버전이 없으면 L1 */
export function docMotionPreset(series: ProfileSeries | undefined, profileVersion: number): MotionPreset {
  throw new Error(`K1 RED ${series?.profileId} ${profileVersion}`);
}

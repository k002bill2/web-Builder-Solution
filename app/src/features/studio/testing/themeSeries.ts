import type { ProfileAdjustments, ProfileSeries, ProfileVersion } from "../../../domain/profile";
import { CAFE_PALETTE, GOOD_PALETTE, sampleBase, type Palette } from "../../../engine/testing/sampleTheme";

/** 테스트 전용(제품 코드가 import하지 않는다) — 테마 바꾸기(ER-2) 계열: 버전마다 팔레트·조정 */
export interface VersionSpec {
  readonly palette: Palette;
  readonly adjustments?: ProfileAdjustments;
}

export const FAIL = CAFE_PALETTE;
export const PASS = GOOD_PALETTE;

export function themeSeries(specs: readonly VersionSpec[]): ProfileSeries {
  const versions: ProfileVersion[] = specs.map((spec, i) => ({
    profileId: "profile-1",
    version: i + 1,
    origin: i === 0 ? "board" : "adjust",
    baseReferenceId: "ref-a",
    base: sampleBase(spec.palette),
    adjustments: spec.adjustments ?? {},
    createdAt: "2026-10-06T00:00:00.000Z",
  }));
  return { profileId: "profile-1", versions, latestVersion: versions.length };
}

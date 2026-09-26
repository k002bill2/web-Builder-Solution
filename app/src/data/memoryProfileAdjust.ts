/**
 * 조정 저장 메모리 구현 본문 (DS-2A-04 6.3 `saveAdjustments`). memoryProfileRepository가 조정 메서드를 처음 부를 때 받는다 —
 * 검증(zod)·정규화·이어받기 규칙을 보드 진입 직후 합계(/compare)에 싣지 않는다(2a-04b1 번들). store 트랜잭션 안에서만 부른다.
 * 판정 순서: 모양(SCHEMA_INVALID) → NOT_FOUND → STALE_PROFILE → 범위(RANGE_VIOLATION) → 보정 from·바뀐 조정 없음(SCHEMA_INVALID).
 */
import { parseAdjustments, rangeViolations } from "../domain/adjustmentSchema";
import type { AdjustmentRange, ProfileAdjustments, ProfileVersion } from "../domain/profile";
import { normalizeAdjustments } from "../domain/profileAdjustments";
import { ProfileError } from "./profileRepository";
import type { StudioTx } from "./studioStore";

export { DEFAULT_ADJUSTMENT_RANGE } from "../domain/adjustmentSchema";

const sameAdjustments = (a: ProfileAdjustments, b: ProfileAdjustments) => JSON.stringify(normalizeAdjustments(a)) === JSON.stringify(normalizeAdjustments(b));

/** 보정 from = 적용 당시 base 값 — 다르면 이어받기 (a) 판정이 틀어진다 */
function correctionMismatch(adjustments: ProfileAdjustments, base: ProfileVersion["base"]): string | undefined {
  const wrong = adjustments.corrections?.find((c) => c.from.toUpperCase() !== base.color_tokens[c.role].$value.toUpperCase());
  return wrong && `${wrong.role} 보정 from ${wrong.from} ≠ base ${base.color_tokens[wrong.role].$value}`;
}

export interface SaveAdjustmentsInput {
  readonly profileId: string;
  readonly expectedLatest: number;
  readonly adjustments: ProfileAdjustments;
  readonly range: AdjustmentRange;
  readonly createdAt: string;
  /** STALE_PROFILE에 동봉할 최신 계열 */
  readonly seriesOf: (tx: StudioTx) => import("../domain/profile").ProfileSeries | undefined;
}

export function saveAdjustmentsIn(tx: StudioTx, input: SaveAdjustmentsInput): ProfileVersion {
  const { profileId, expectedLatest, range } = input;
  const parsed = parseAdjustments(input.adjustments);
  if (!parsed.ok) throw new ProfileError("SCHEMA_INVALID", parsed.message);
  const value = normalizeAdjustments(parsed.value);
  const series = input.seriesOf(tx);
  if (!series) throw new ProfileError("NOT_FOUND", `${profileId} 없음`);
  if (series.latestVersion !== expectedLatest) throw new ProfileError("STALE_PROFILE", `expectedLatest ${expectedLatest} ≠ ${series.latestVersion}`, series);
  const violations = rangeViolations(value, range);
  if (violations.length > 0) throw new ProfileError("RANGE_VIOLATION", `${range.source} 밖: ${violations.join(", ")}`);
  const latest = series.versions.at(-1)!;
  const mismatch = correctionMismatch(value, latest.base);
  if (mismatch) throw new ProfileError("SCHEMA_INVALID", mismatch);
  if (sameAdjustments(value, latest.adjustments)) throw new ProfileError("SCHEMA_INVALID", "바뀐 조정 없음");
  tx.insert({
    profileId,
    version: series.latestVersion + 1,
    origin: "adjust",
    baseReferenceId: latest.baseReferenceId,
    base: latest.base,
    adjustments: value,
    createdAt: input.createdAt,
  });
  return tx.versions(profileId).at(-1)!;
}

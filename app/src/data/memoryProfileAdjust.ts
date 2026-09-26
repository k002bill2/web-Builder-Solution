/**
 * 조정 저장 메모리 구현 본문 (DS-2A-04 6.3 `saveAdjustments`). memoryProfileRepository가 조정 메서드를 처음 부를 때 받는다 —
 * 검증(zod)·정규화·이어받기 규칙을 보드 진입 직후 합계(/compare)에 싣지 않는다(2a-04b1 번들). store 트랜잭션 안에서만 부른다.
 * 판정 순서: 모양(SCHEMA_INVALID) → 멱등 키 일치(이전 결과, 새 버전 0) → NOT_FOUND → STALE_PROFILE → 범위(RANGE_VIOLATION)
 * → 보정 from·바뀐 조정 없음(SCHEMA_INVALID). 모양을 먼저 본다 — 정규화가 모르는 키를 버리므로 틀린 입력이 이전 결과를 받지 않게(Codex P2).
 * 같은 인자의 재시도는 늘 모양을 통과하므로 멱등 결과는 같다. 멱등 키 = (profileId, expectedLatest, 정규화한 조정) — 보드 확정과 같은 r3 계약,
 * 기록은 store의 조정 전용 슬롯(보드 `commits`와 따로, A-Q4). 삽입과 같은 트랜잭션에 기록하므로 롤백되면 함께 버려진다.
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
  /** 삽입·멱등 기록 뒤 커밋 앞 — 던지면 트랜잭션이 둘 다 버린다(`fail`의 `phase: "commit"`) */
  readonly commitGate: () => void;
}

export function saveAdjustmentsIn(tx: StudioTx, input: SaveAdjustmentsInput): ProfileVersion {
  const { profileId, expectedLatest, range } = input;
  const parsed = parseAdjustments(input.adjustments);
  if (!parsed.ok) throw new ProfileError("SCHEMA_INVALID", parsed.message);
  const value = normalizeAdjustments(parsed.value);
  // 멱등 키 = (profileId, expectedLatest, 정규화한 조정)
  const key = [profileId, expectedLatest, JSON.stringify(value)].join("\n");
  const done = tx.adjustCommitOf(profileId);
  const committed = done?.key === key ? tx.versions(profileId).find((v) => v.version === done.version) : undefined;
  if (committed) return committed;
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
  tx.rememberAdjust({ key, profileId, version: series.latestVersion + 1 });
  input.commitGate();
  return tx.versions(profileId).at(-1)!;
}

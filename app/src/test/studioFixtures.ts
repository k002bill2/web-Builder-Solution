import type { ProfileVersion } from "../domain/profile";
import type { StudioStore } from "../data/studioStore";

/**
 * "다른 곳(다른 탭)"에서 생긴 새 버전 — 최신 버전 내용을 복사한 조정 버전을 store에 바로 넣는다.
 * 최신 버전으로의 `revertTo`는 거부되므로(SPEC 10.0 A-Q3) 버전 1개뿐일 때의 경쟁 셋업은 이것으로 만든다.
 * 조정 저장(`saveAdjustments`)은 2a-04b라 그 전까지 대신한다.
 */
export function insertOtherVersion(store: StudioStore, profileId = "profile-1", createdAt = "2026-09-26T00:00:00.000Z"): ProfileVersion {
  return store.transact((tx) => {
    const latest = tx.versions(profileId).at(-1);
    if (!latest) throw new Error(`${profileId} 계열이 없습니다`);
    const record: ProfileVersion = {
      profileId,
      version: latest.version + 1,
      origin: "adjust",
      baseReferenceId: latest.baseReferenceId,
      base: latest.base,
      adjustments: latest.adjustments,
      createdAt,
    };
    tx.insert(record);
    return record;
  });
}

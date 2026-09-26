/**
 * 디자인 프로필 저장소 경계 (DS-2A-04 SPEC 6.3). 인터페이스 파일은 타입·오류 클래스만 — 구현은 memoryProfileRepository.
 * 버전을 만드는 쓰기는 모두 `expectedLatest`가 필수 인자다(6.1-4 · P-AC-41).
 */
import type { AdjustmentRange, ProfileAdjustments, ProfileErrorCode, ProfileSeries, ProfileSummary, ProfileVersion } from "../domain/profile";

export interface ProfileRepository {
  /** GET /profiles — /profile 목록 */
  listProfiles(): Promise<readonly ProfileSummary[]>;
  /** GET /profiles/{id} + …/versions — 없으면 undefined(P-S02, 예외 아님) */
  getProfile(profileId: string): Promise<ProfileSeries | undefined>;
  /** GET /profiles/{id}/versions/{v}/range — 2a-04b */
  getAdjustmentRange(profileId: string, version: number): Promise<AdjustmentRange>;
  /** POST /profiles/{id}/versions (If-Match: latest) — 2a-04b. 범위 밖 RANGE_VIOLATION · 최신 불일치 STALE_PROFILE */
  saveAdjustments(profileId: string, expectedLatest: number, adjustments: ProfileAdjustments): Promise<ProfileVersion>;
  /** POST /profiles/{id}/versions (revert_of, If-Match: latest) — 대상 복사로 새 버전, 이전 레코드 불변 */
  revertTo(profileId: string, version: number, expectedLatest: number): Promise<ProfileVersion>;
}

/**
 * 앱 화면(deferred 래퍼·컨텍스트)이 쓰는 몫. 조정 범위·저장은 메모리 구현에 있지만(2a-04b1) 화면 조정 UI가 b2라
 * 공통 청크의 deferred 래퍼에 메서드를 더하지 않는다(번들 공통 증가 0) — b2에서 ProfileRepository로 넓힌다.
 */
export type ProfileReadRepository = Pick<ProfileRepository, "listProfiles" | "getProfile" | "revertTo">;

export class ProfileError extends Error {
  readonly code: ProfileErrorCode;
  /** STALE_PROFILE일 때 최신 계열 */
  readonly series?: ProfileSeries;

  constructor(code: ProfileErrorCode, message: string, series?: ProfileSeries) {
    super(`${code}: ${message}`);
    this.name = "ProfileError";
    this.code = code;
    if (series) this.series = series;
  }
}

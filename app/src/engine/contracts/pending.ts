/**
 * 게이트 테마 계약. L4a의 연산 자리 두 개는 L4b에서 구현됐다 — `gate/runGate.ts`(runGate) · `doc/createDocFromCandidate.ts`.
 */
import type { PurposeId } from "../../domain/reference";
import type { ProfileVersion } from "../../domain/profile";

/**
 * 게이트가 읽는 테마 = 문서가 가리키는 프로필 버전. 대비는 적용 값(effectiveProfile(base, adjustments))으로 본다.
 * purpose = 부르는 쪽이 넘기는 사이트 목적(보통 profile.adjustments.purpose ?? "none" — 출처 중복은 REPORT Q-19)
 */
export interface GateTheme {
  readonly profile: ProfileVersion;
  readonly purpose: PurposeId | "none";
}

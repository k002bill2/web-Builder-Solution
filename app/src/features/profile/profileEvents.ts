/**
 * 프로필 계측 호출 지점 (DS-2A-04 6.5 · P-AC-37). 수집 도구가 없어 `window` 이벤트 하나로 두고(새 의존성·공통 청크 0),
 * 수집기를 붙일 때 이 이벤트만 구독한다. 사용자 입력 원문·색 값은 넣지 않는다.
 * `profile_save_failed`는 6.5에 없는 이름이다 — 되돌리기 실패 지점(P-AC-37)을 위해 두었다 (REPORT 설계 질문).
 */
import type { ProfileOrigin } from "../../domain/profile";

export const PROFILE_EVENT = "studio:profile";

export type ProfileEvent =
  | { readonly name: "profile_saved"; readonly version: number; readonly origin: ProfileOrigin }
  | { readonly name: "profile_save_failed"; readonly reason: string };

export function emitProfileEvent(event: ProfileEvent): void {
  window.dispatchEvent(new CustomEvent<ProfileEvent>(PROFILE_EVENT, { detail: event }));
}

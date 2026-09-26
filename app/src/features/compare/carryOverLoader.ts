/**
 * P-S25 패널 청크 로더 (DS-2A-04 r6 · 2a-04b1 FIX2). "이어받기 확인"을 펼칠 때·"다시 시도"에서만 부른다 — 조작 뒤 청크.
 * 한 줄짜리 모듈로 떼어 둔 것은 화면 테스트가 호출 수(펼치기 전 0)를 세고 실패를 주입하기 위해서다.
 */
export const loadCarryOverPanel = () => import("./carryOverPanel");

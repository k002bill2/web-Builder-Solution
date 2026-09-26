/**
 * 저장소 쓰기 본문 로더 (FIX3-2A04b1 1안) — 사용자 조작(확정 클릭·조정 저장·되돌리기) 때만 받는다.
 * 보드 진입 직후 합계(/compare)에 싣지 않는다. 받기는 저장소 `call`의 동기 구간 밖(앞)이라 판정·쓰기 원자성은 그대로다.
 * 실패한 로드는 저장 0으로 거부되고, 다시 부르면 다시 받는다(저장소는 받은 모듈만 기억한다). 테스트가 실패를 주입하는 이음새.
 */
/** 보드 확정 본문(판정·쓰기·재확정 이어받기 준비) ← confirmProfile·createProfileVersion */
export const loadBoardConfirm = () => import("./memoryBoardConfirm");
/** 프로필 쓰기 본문(조정 저장·되돌리기) ← getAdjustmentRange·saveAdjustments·revertTo — 한 청크로 받아 로더를 늘리지 않는다 */
export const loadProfileWrites = () => import("./memoryProfileAdjust");

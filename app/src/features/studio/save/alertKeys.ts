/**
 * liveness 알림 키(RS6-L2 CP3) — 문구 본문은 L4(`saveStatusText.ts`). 진입(SaveStatus)이 값 import하므로 시간 값·감시(`liveness.ts`)와 모듈을 나눈다
 * (같은 모듈이면 조작 뒤 coreIo가 진입 청크에서 시간 값을 받는 간선이 생겨 진입이 늘었다 — CP3 1차 실측 +0.15).
 */
/** `T_hang` alert 1회(LV-1) */
export const SAVE_HANG_ALERT = "save-hang";
/** discard 시간 초과 alert(LV-2 · 폐기 대화상자 = L4) */
export const DISCARD_TIMEOUT_ALERT = "discard-timeout";

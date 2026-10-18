/**
 * 내보내기 청크(exportFlow·생성기) 연속 실패 시도 수(B-M4A-08) — 2부터 재시도 안내에 새로고침 안내를 붙인다.
 * 새 URL로도 못 받는 경우(실패한 것이 청크의 정적 의존 청크 · 네트워크 계속 끊김)는 같은 탭 재시도로 복구되지 않는다.
 * exportFlow 실패는 로더(exportFlowLoader)가, 생성기 실패·청크 실패 없이 끝난 시도(0)는 exportFlow가 센다.
 * 실패 안내(ExportRetryAlert)와 같은 편집기 청크에 들어간다 — exportFlow를 못 받아도 읽혀야 한다. 로더를 import하지 않으려고 따로 둔다
 */
export const exportChunk = { fails: 0 };
export const EXPORT_RELOAD = "새로고침한 뒤 다시 시도하세요";

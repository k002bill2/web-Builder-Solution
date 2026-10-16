/**
 * `/projects` 미확인 행 표시(RESTART SPEC-4 r0.3a 5.2) — 진입 직후 자동 import(첫 화면 바이트 0 · 진입 직후 합계에 포함).
 * 목록은 이 모듈이 오기 전에는 그리지 않는다(기억이 있는 행에 "편집기 열기"가 잠깐 보이는 거짓 구간 0).
 */
import { DiscardConfirm } from "../pending/DiscardConfirm";
import { PENDING_TEXT as P } from "../pending/pendingText";
import { pendingOf, subscribe, type Pending } from "../pending/pendingWrites";

export { DiscardConfirm, pendingOf, subscribe };

/** P-U1 상태 글자 · 주 버튼 이름 */
export function describePending(p: Pending): { readonly status: string; readonly label: string } {
  const status =
    p.kind === "record" ? P.record(p.head) : p.held === "unknown" ? P.unknown(p.version, p.selected) : p.mode === "restart" ? P.restart(p.version, p.selected) : P.create(p.version, p.selected);
  return { status, label: p.kind === "record" ? P.confirm : P.retrySave };
}
export const ROW_TEXT = { caption: P.caption, working: P.working, discard: P.discard };

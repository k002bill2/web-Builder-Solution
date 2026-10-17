/**
 * 저장 상태 글자·알림 (DS-2A-05 SPEC E-S06~E-S09 · 5.10 · 6.3).
 * - 상태 글자는 라이브 영역 **밖**에 둔다(상대 시각은 낭독하지 않는다, B-14).
 * - 알림은 단계가 바뀔 때만: 실패 시작 alert 1회 · 회복 status · 오프라인 진입 status · STALE 진입 alert. 평상시 저장은 알리지 않는다.
 * - `idle`(아직 변경 없음)은 빈 글자 — 보여줄 저장 상태가 없다.
 * - 상대 시각: 5초 미만 "방금" · 60초 미만 "N초 전" · 60분 미만 "N분 전" · 그 밖 "N시간 전"(내림, 음수는 "방금").
 */
import type { ProjectPersistence } from "../../data/projectRepository";
import type { AutosaveState } from "./useAutosaveScheduler";

export interface SaveAnnouncement {
  readonly kind: "alert" | "status";
  readonly text: string;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const SAVE_FAILED_TEXT = "저장하지 못했습니다";
export const SAVE_OFFLINE_TEXT = "오프라인 — 연결되면 저장합니다";
export const SAVE_STALE_TEXT = "다른 곳에서 이 문서가 바뀌었습니다";
export const SAVE_STALE_ALERT = "다른 곳에서 이 문서가 바뀌었습니다. 내 편집은 그대로 두었습니다";
export const SAVE_RECOVERED_TEXT = "다시 저장했습니다";
/** LV-1 `saving-slow` 꼬리(INTEGRATE-6 3절) */
export const SAVE_SLOW_TAIL = " · 브라우저 응답이 늦습니다";
/** LV-1 `T_hang` alert 1회(키 `SAVE_HANG_ALERT` · INTEGRATE-6 3절) */
export const SAVE_HANG_TEXT = "브라우저가 저장에 응답하지 않습니다 — 이 탭을 닫으면 확인되지 않은 변경이 사라질 수 있습니다";
/** LV-2 discard 시간 초과(키 `DISCARD_TIMEOUT_ALERT` · INTEGRATE-6 3절·8.3) — 폐기 대화상자(조작 뒤)가 쓴다 */
export const DISCARD_TIMEOUT_TEXT = "버리지 못했습니다 — 변경은 그대로 있습니다";

/** 판정 출처(INTEGRATE-6 8.1) — 코어 `view()`(inflight·dirty) + 마지막 저장 결과 reason(포트 `mode()`·결과). 저장 성공이면 reason 없음 */
export interface SaveSource {
  readonly reason?: string;
  /** reason 문구(조작 뒤 청크 `save/reasonText.ts` — 저장 실패 결과와 함께 받는다) · 없으면 ★"저장하지 못했습니다" */
  readonly text?: string;
  readonly inflight?: number;
  readonly dirty?: boolean;
}

export function relativeTimeText(elapsedMs: number): string {
  if (elapsedMs < 5 * SECOND) return "방금";
  if (elapsedMs < MINUTE) return `${Math.floor(elapsedMs / SECOND)}초 전`;
  if (elapsedMs < HOUR) return `${Math.floor(elapsedMs / MINUTE)}분 전`;
  return `${Math.floor(elapsedMs / HOUR)}시간 전`;
}

function savedText(state: AutosaveState, persistence: ProjectPersistence, now: number): string {
  const label = persistence === "memory" ? "이 탭에 저장됨" : persistence === "local" ? "이 브라우저에 저장됨" : "저장됨";
  return state.lastSavedAt === undefined ? label : `${label} · ${relativeTimeText(now - state.lastSavedAt)}`;
}

/** 저장 중 = 코어 inflight(출처 없으면 스케줄러 단계) — POP 재진입 때 앞 해제 save가 진행 중이면 스케줄러가 idle이어도 저장 중 */
export const isSaving = (state: AutosaveState, source: SaveSource = {}) => (source.inflight ?? 0) > 0 || state.phase === "saving";

/** 판정 순서(UX-5 2.2): 충돌 > 환경 reason 문구 > offline > 저장 중(slow 꼬리) > 저장 전 변경(view().dirty) > 단계 */
export function saveStatusText(state: AutosaveState, persistence: ProjectPersistence, now: number, source: SaveSource = {}): string {
  if (source.text && state.phase !== "stale") return source.text;
  if (state.phase !== "offline" && isSaving(state, source)) return state.slow ? `저장 중…${SAVE_SLOW_TAIL}` : "저장 중…";
  if (source.dirty && state.phase !== "failed" && state.phase !== "offline" && state.phase !== "stale") return "저장 전 변경 있음";
  switch (state.phase) {
    case "idle":
      return "";
    case "dirty":
      return "저장 전 변경 있음";
    case "saving":
      return "저장 중…";
    case "saved":
      return savedText(state, persistence, now);
    case "failed":
      return SAVE_FAILED_TEXT;
    case "offline":
      return SAVE_OFFLINE_TEXT;
    case "stale":
      return SAVE_STALE_TEXT;
  }
}

/** 이웃한 두 상태 사이의 알림 — 없으면 undefined */
export function saveAnnouncement(prev: AutosaveState, next: AutosaveState): SaveAnnouncement | undefined {
  if (next.phase === "stale") return prev.phase === "stale" ? undefined : { kind: "alert", text: SAVE_STALE_ALERT };
  if (next.recovered && prev.failure !== undefined) return { kind: "status", text: SAVE_RECOVERED_TEXT };
  if (next.failure === prev.failure) return undefined;
  if (next.failure === "error") return { kind: "alert", text: SAVE_FAILED_TEXT };
  if (next.failure === "offline") return { kind: "status", text: SAVE_OFFLINE_TEXT };
  return undefined;
}

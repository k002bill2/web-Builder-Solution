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

export function saveStatusText(state: AutosaveState, persistence: ProjectPersistence, now: number): string {
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

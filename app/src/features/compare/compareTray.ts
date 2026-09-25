import { BOARD_COLUMN_LIMIT } from "../../domain/boardColumns";

/** 보드 열 한도와 같다 (열 문자 A~F) */
export const COMPARE_LIMIT = BOARD_COLUMN_LIMIT;
/** 7번째 추가를 막을 때의 안내 (카탈로그·상세 공통). */
export const COMPARE_LIMIT_NOTICE = `비교 보드에는 최대 ${COMPARE_LIMIT}개까지 담을 수 있습니다. 다른 레퍼런스를 빼고 추가하세요.`;

/** 비교 트레이에 담긴 레퍼런스 id (담은 순서 유지). */
export type CompareTray = readonly string[];

export type AddResult =
  | { readonly ok: true; readonly tray: CompareTray }
  | { readonly ok: false; readonly reason: "limit" | "duplicate"; readonly tray: CompareTray };

export function addToTray(tray: CompareTray, id: string): AddResult {
  if (tray.includes(id)) return { ok: false, reason: "duplicate", tray };
  if (tray.length >= COMPARE_LIMIT) return { ok: false, reason: "limit", tray };
  return { ok: true, tray: [...tray, id] };
}

export function removeFromTray(tray: CompareTray, id: string): CompareTray {
  return tray.filter((x) => x !== id);
}

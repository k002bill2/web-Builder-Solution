export const COMPARE_LIMIT = 6;

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

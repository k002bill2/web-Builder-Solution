/**
 * 보드 열 추가·빼기 (SPEC 2.2·P-7). 트레이(공통 청크)와 저장소가 함께 쓴다 — 의존 없는 순수 함수만 둔다.
 */
import {
  COLUMN_LABELS,
  PICKABLE_ROW_IDS,
  nextColumnLabel,
  rowDef,
  type ColumnLabel,
  type ColumnStatus,
  type CompareBoard,
  type PickableRowId,
  type Picks,
} from "./compareBoard";

/** 보드 열 한도 (FR-CMP-02 — 열 문자 A~F 수와 같다) */
export const BOARD_COLUMN_LIMIT = COLUMN_LABELS.length;

export type AddColumnResult =
  | { readonly ok: true; readonly board: CompareBoard }
  | { readonly ok: false; readonly reason: "limit" | "duplicate"; readonly board: CompareBoard };

export interface ReleasedPicks {
  readonly referenceId: string;
  readonly label: ColumnLabel;
  readonly rows: readonly PickableRowId[];
  readonly notice: string;
}

type ReleaseCause = "removed" | Exclude<ColumnStatus, "available">;

/** "B를 빼서 Hero·카드 선택 해제" · "B가 회수되어 Hero·카드 선택을 해제했습니다" · "B를 찾을 수 없어 …" */
export function releaseNotice(label: ColumnLabel, rows: readonly PickableRowId[], cause: ReleaseCause): string {
  const names = rows.map((row) => rowDef(row).shortLabel).join("·");
  if (cause === "removed") return `${label}를 빼서 ${names} 선택 해제`;
  if (cause === "withdrawn") return `${label}가 회수되어 ${names} 선택을 해제했습니다`;
  return `${label}를 찾을 수 없어 ${names} 선택을 해제했습니다`;
}

/** 행 순서대로, 그 레퍼런스를 가리키는 선택 행 */
export function rowsPickedFrom(picks: Picks, referenceId: string): readonly PickableRowId[] {
  return PICKABLE_ROW_IDS.filter((row) => picks[row] === referenceId);
}

export function withoutReference(picks: Picks, referenceId: string): Picks {
  return Object.fromEntries(Object.entries(picks).filter(([, id]) => id !== referenceId));
}

const touched = (board: CompareBoard, patch: Partial<CompareBoard>, now: string): CompareBoard => ({
  ...board,
  ...patch,
  revision: board.revision + 1,
  updatedAt: now,
});

export function addColumn(board: CompareBoard, referenceId: string, now = board.updatedAt): AddColumnResult {
  if (board.columns.some((c) => c.referenceId === referenceId)) return { ok: false, reason: "duplicate", board };
  const label = nextColumnLabel(board.columns);
  if (!label || board.columns.length >= BOARD_COLUMN_LIMIT) return { ok: false, reason: "limit", board };
  return { ok: true, board: touched(board, { columns: [...board.columns, { referenceId, label }] }, now) };
}

/** P-7: 열을 빼면 그 열에서 고른 선택을 모두 해제한다. 다른 열 문자는 바뀌지 않는다. */
export function removeColumn(
  board: CompareBoard,
  referenceId: string,
  now = board.updatedAt,
): { readonly board: CompareBoard; readonly released?: ReleasedPicks } {
  const column = board.columns.find((c) => c.referenceId === referenceId);
  if (!column) return { board };
  const rows = rowsPickedFrom(board.picks, referenceId);
  const next = touched(
    board,
    { columns: board.columns.filter((c) => c !== column), picks: withoutReference(board.picks, referenceId) },
    now,
  );
  if (rows.length === 0) return { board: next };
  return { board: next, released: { referenceId, label: column.label, rows, notice: releaseNotice(column.label, rows, "removed") } };
}

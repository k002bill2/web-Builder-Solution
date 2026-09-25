/** 요소 선택 규칙 P-1~P-6 · S-08/S-09 자동 해제 (SPEC 3.1·4). 모두 순수 함수. */
import { releaseNotice, rowsPickedFrom, withoutReference } from "./boardColumns";
import {
  PICKABLE_ROW_IDS,
  rowDef,
  type ColumnLabel,
  type ColumnStatus,
  type CompareBoard,
  type ComparisonResult,
  type ComparisonRowId,
  type PickableRowId,
  type Picks,
} from "./compareBoard";

export type PickChange =
  | { readonly kind: "picked"; readonly rowId: PickableRowId; readonly to: string }
  | { readonly kind: "replaced"; readonly rowId: PickableRowId; readonly from: string; readonly to: string }
  | { readonly kind: "unpicked"; readonly rowId: PickableRowId; readonly from: string };

export type PickRejection = "info-row" | "empty-cell" | "not-in-board" | "unavailable-column";

export type TogglePickResult =
  | { readonly ok: true; readonly picks: Picks; readonly change: PickChange }
  | { readonly ok: false; readonly reason: PickRejection };

const isPickable = (rowId: ComparisonRowId): rowId is PickableRowId => rowDef(rowId).role !== "info";

function withPick(picks: Picks, rowId: PickableRowId, referenceId: string | undefined): Picks {
  const rest = Object.fromEntries(Object.entries(picks).filter(([row]) => row !== rowId));
  return referenceId === undefined ? rest : { ...rest, [rowId]: referenceId };
}

/** 셀을 고를 수 있는지 — 보드 열·사용 가능 상태·값 있음 (P-3·P-4). */
function checkCell(board: CompareBoard, results: readonly ComparisonResult[], rowId: ComparisonRowId, referenceId: string): PickRejection | null {
  if (!isPickable(rowId)) return "info-row";
  if (!board.columns.some((c) => c.referenceId === referenceId)) return "not-in-board";
  const result = results.find((r) => r.referenceId === referenceId);
  if (!result || result.status !== "available" || !result.comparison) return "unavailable-column";
  return result.comparison.cells[rowId].binding ? null : "empty-cell";
}

/** P-1 행당 1개 · P-2 재클릭 해제 · P-6 레퍼런스 id 저장 */
export function togglePick(
  board: CompareBoard,
  results: readonly ComparisonResult[],
  rowId: ComparisonRowId,
  referenceId: string,
): TogglePickResult {
  const rejection = checkCell(board, results, rowId, referenceId);
  if (rejection) return { ok: false, reason: rejection };
  const row = rowId as PickableRowId;
  const current = board.picks[row];
  if (current === referenceId) return { ok: true, picks: withPick(board.picks, row, undefined), change: { kind: "unpicked", rowId: row, from: current } };
  const change: PickChange = current === undefined
    ? { kind: "picked", rowId: row, to: referenceId }
    : { kind: "replaced", rowId: row, from: current, to: referenceId };
  return { ok: true, picks: withPick(board.picks, row, referenceId), change };
}

function labelOf(board: CompareBoard, referenceId: string): ColumnLabel | string {
  return board.columns.find((c) => c.referenceId === referenceId)?.label ?? referenceId;
}

/** A-4 알림 문장: "Hero 구성: B 선택" · "Hero 구성: B → C" · "Hero 구성 선택 해제" */
export function pickAnnouncement(board: CompareBoard, change: PickChange): string {
  const row = rowDef(change.rowId).label;
  if (change.kind === "picked") return `${row}: ${labelOf(board, change.to)} 선택`;
  if (change.kind === "replaced") return `${row}: ${labelOf(board, change.from)} → ${labelOf(board, change.to)}`;
  return `${row} 선택 해제`;
}

export interface PickAllResult {
  readonly picks: Picks;
  /** 되돌리기용 이전 선택 */
  readonly previous: Picks;
  /** 다른 열에서 이 열로 바뀐 선택 수 */
  readonly replacedCount: number;
  /** "기존 선택 N개를 A로 바꿨습니다" (N>0일 때만) */
  readonly notice: string | null;
}

/** P-5 이 레퍼런스로 전부 선택 — 그 열에서 선택 가능한 모든 행. 값이 없는 행의 기존 선택은 유지한다. */
export function pickAllFrom(board: CompareBoard, results: readonly ComparisonResult[], referenceId: string): PickAllResult {
  const rows = PICKABLE_ROW_IDS.filter((row) => checkCell(board, results, row, referenceId) === null);
  const replacedCount = rows.filter((row) => board.picks[row] !== undefined && board.picks[row] !== referenceId).length;
  const picks = rows.reduce<Picks>((acc, row) => ({ ...acc, [row]: referenceId }), board.picks);
  const notice = replacedCount > 0 ? `기존 선택 ${replacedCount}개를 ${labelOf(board, referenceId)}로 바꿨습니다` : null;
  return { picks, previous: board.picks, replacedCount, notice };
}

export interface ReleasedByStatus {
  readonly referenceId: string;
  readonly label: ColumnLabel;
  readonly status: Exclude<ColumnStatus, "available">;
  readonly rows: readonly PickableRowId[];
  readonly notice: string;
}

/** S-08·S-09 · AC-15: 회수·삭제된 열에서 고른 선택을 해제하고 경고 문장을 돌려준다. */
export function releaseUnavailablePicks(
  board: CompareBoard,
  results: readonly ComparisonResult[],
): { readonly picks: Picks; readonly released: readonly ReleasedByStatus[] } {
  const released = board.columns.flatMap((column): ReleasedByStatus[] => {
    const status = results.find((r) => r.referenceId === column.referenceId)?.status ?? "missing";
    const rows = rowsPickedFrom(board.picks, column.referenceId);
    if (status === "available" || rows.length === 0) return [];
    return [{ referenceId: column.referenceId, label: column.label, status, rows, notice: releaseNotice(column.label, rows, status) }];
  });
  const picks = released.reduce((acc, r) => withoutReference(acc, r.referenceId), board.picks);
  return { picks, released };
}

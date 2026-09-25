/**
 * 보드 + 비교 결과 → 표·아코디언이 그리는 화면 모델 (SPEC 2.2·2.3·S-04·S-08·S-09).
 * 선택 가능 여부는 도메인 규칙(보드 열·사용 가능·값 있음)을 그대로 따른다 — 여기서 새 규칙을 만들지 않는다.
 */
import {
  COMPARISON_ROWS,
  type ColumnLabel,
  type ColumnStatus,
  type CompareBoard,
  type ComparisonResult,
  type ComparisonRowId,
  type RowRole,
} from "../../domain/compareBoard";
import { EMPTY_CELL_LABEL, isRowUniform } from "../../domain/comparisonCells";
import type { LicenseStatus } from "../../domain/reference";
import { INDUSTRY_LABELS } from "../../fixtures/catalogFilters";

export const UNAVAILABLE_REASON: Readonly<Record<Exclude<ColumnStatus, "available">, string>> = Object.freeze({
  withdrawn: "라이선스가 바뀌어 더 이상 쓸 수 없습니다",
  missing: "찾을 수 없는 레퍼런스입니다",
});
const MISSING_TITLE = "찾을 수 없는 레퍼런스";

export interface BoardColumnView {
  readonly referenceId: string;
  readonly label: ColumnLabel;
  readonly title: string;
  readonly status: ColumnStatus;
  readonly industry?: string;
  readonly license?: LicenseStatus;
  /** 대표색 견본 (데이터 값) */
  readonly swatch?: string;
}

export interface ComparisonCellView {
  readonly referenceId: string;
  readonly label: string;
  /** 선택 버튼을 둘지 — S-04(1열)·info 행·없음·사용 불가 열이면 false */
  readonly pickable: boolean;
  /** 회수·삭제된 열 (흐리게, 읽을 수 있게) */
  readonly dimmed: boolean;
}

export interface ComparisonRowView {
  readonly id: ComparisonRowId;
  readonly label: string;
  readonly role: RowRole;
  readonly required: boolean;
  /** 모든 열 값이 같음 ("모두 같음" 캡션) */
  readonly uniform: boolean;
  /** columns와 같은 순서 */
  readonly cells: readonly ComparisonCellView[];
}

export interface BoardView {
  readonly columns: readonly BoardColumnView[];
  readonly rows: readonly ComparisonRowView[];
}

function columnView(referenceId: string, label: ColumnLabel, result: ComparisonResult | undefined): BoardColumnView {
  const status = result?.status ?? "missing";
  const reference = result?.reference;
  if (!reference) return { referenceId, label, status, title: MISSING_TITLE };
  return {
    referenceId,
    label,
    status,
    title: reference.title,
    industry: INDUSTRY_LABELS[reference.industry],
    license: reference.licenseStatus,
    swatch: reference.colorPalette.primary,
  };
}

export function buildBoardView(board: CompareBoard, results: readonly ComparisonResult[]): BoardView {
  const resultOf = (id: string) => results.find((r) => r.referenceId === id);
  const columns = board.columns.map((c) => columnView(c.referenceId, c.label, resultOf(c.referenceId)));
  // S-04: 열이 1개면 행별 선택 버튼을 숨긴다 (값 확인용)
  const picking = columns.length >= 2;
  const available = columns.flatMap((c) => {
    const comparison = resultOf(c.referenceId)?.comparison;
    return c.status === "available" && comparison ? [comparison] : [];
  });
  const rows = COMPARISON_ROWS.map((row): ComparisonRowView => ({
    id: row.id,
    label: row.label,
    role: row.role,
    required: row.required === true,
    uniform: available.length >= 2 && isRowUniform(row.id, available),
    cells: columns.map((column) => {
      const cell = resultOf(column.referenceId)?.comparison?.cells[row.id];
      const usable = column.status === "available";
      return {
        referenceId: column.referenceId,
        label: cell?.label ?? EMPTY_CELL_LABEL,
        pickable: picking && usable && row.role !== "info" && cell?.binding != null,
        dimmed: !usable,
      };
    }),
  }));
  return { columns, rows };
}

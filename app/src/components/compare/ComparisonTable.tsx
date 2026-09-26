import { useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import type { ComparisonRowId, Picks } from "../../domain/compareBoard";
import type { BoardColumnView, ComparisonRowView } from "../../features/compare/boardView";
import { cx } from "../ds/cx";
import { rovingRowTargetIndex } from "../ds/rovingFocus";
import { Tag } from "../ds/Tag";
import { ColumnHeader } from "./ColumnHeader";
import { PickButton } from "./PickButton";

export interface ComparisonProps {
  readonly columns: readonly BoardColumnView[];
  readonly rows: readonly ComparisonRowView[];
  readonly picks: Picks;
  /** "이 레퍼런스로 전부 선택" · 1열이면 "이 레퍼런스로 프로필 만들기" */
  readonly pickAllLabel: string;
  /** 확정 중·열 빼는 중 — 선택 버튼 aria-disabled (S-13) */
  readonly disabled?: boolean;
  readonly onToggle: (rowId: ComparisonRowId, referenceId: string) => void;
  readonly onRemoveColumn: (referenceId: string) => void;
  readonly onPickAll: (referenceId: string) => void;
}

/** 행 머리글 — 역할 태그·"모두 같음" 캡션 */
export function RowLabel({ row }: { readonly row: ComparisonRowView }) {
  return (
    <span className="flex flex-col items-start gap-1">
      <span className="ds-label text-label-strong">{row.label}</span>
      {row.role === "info" && (
        <Tag size="sm" tone="neutral">
          비교 정보
        </Tag>
      )}
      {row.uniform && <span className="ds-caption2 text-label-alternative">모두 같음</span>}
    </span>
  );
}

/**
 * 행 하나 = Tab 정지점 하나 (A-5 roving tabindex). 행에 들어오면 선택된 버튼, 없으면 첫 선택 가능 버튼.
 * 행 안에서는 ←/→·Home/End로 이동하고, 행을 떠나면 진입점이 다시 선택된 버튼으로 돌아간다.
 */
function PickRow({ row, columns, picks, disabled, onToggle }: {
  readonly row: ComparisonRowView;
  readonly columns: readonly BoardColumnView[];
  readonly picks: Picks;
  readonly disabled: boolean;
  readonly onToggle: ComparisonProps["onToggle"];
}) {
  const buttons = useRef(new Map<number, HTMLButtonElement>());
  const [active, setActive] = useState<number | null>(null);
  const pickable = row.cells.flatMap((cell, i) => (cell.pickable ? [i] : []));
  const selected = row.cells.findIndex((cell) => cell.referenceId === picks[row.id as keyof Picks]);
  const entry = pickable.includes(selected) ? selected : pickable[0];
  const current = active !== null && pickable.includes(active) ? active : entry;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = rovingRowTargetIndex(event.key, pickable.indexOf(index), pickable.length);
    if (next === null) return;
    event.preventDefault();
    const target = pickable[next]!;
    setActive(target);
    buttons.current.get(target)?.focus();
  };
  const onBlur = (event: FocusEvent<HTMLButtonElement>) => {
    const rowElement = event.currentTarget.closest("tr");
    if (!rowElement?.contains(event.relatedTarget as Node | null)) setActive(null);
  };

  return (
    <tr className="border-t border-line-neutral">
      <th scope="row" className="sticky left-0 z-1 min-w-32 bg-background-normal p-3 text-left align-top">
        <RowLabel row={row} />
      </th>
      {row.cells.map((cell, i) => (
        <td key={cell.referenceId} className={cx("min-w-48 p-3 align-top", selected === i && "bg-primary-container", cell.dimmed && "text-label-alternative")}>
          <div className="flex flex-col gap-2">
            <span className="ds-body3">{cell.label}</span>
            {cell.pickable && (
              <PickButton
                ref={(el) => {
                  if (el) buttons.current.set(i, el);
                  else buttons.current.delete(i);
                }}
                rowLabel={row.label}
                columnLabel={columns[i]!.label}
                referenceTitle={columns[i]!.title}
                pressed={selected === i}
                disabled={disabled}
                tabIndex={current === i ? 0 : -1}
                onToggle={() => onToggle(row.id, cell.referenceId)}
                onKeyDown={(event) => onKeyDown(event, i)}
                onFocus={() => setActive(i)}
                onBlur={onBlur}
              />
            )}
          </div>
        </td>
      ))}
    </tr>
  );
}

/**
 * 비교 표 (SPEC 5.1·5.2 · A-1 · v2 4.4 흰 면 + line-neutral 선, 고른 셀은 primary-container 면). 레퍼런스 = 열(`th scope=col`), 항목 = 행(`th scope=row`).
 * 표 영역만 가로 스크롤하고 행 머리글 열은 고정한다. 스크롤 컨테이너는 키보드로도 스크롤할 수 있게 포커스를 받는다.
 */
export function ComparisonTable({ columns, rows, picks, pickAllLabel, disabled = false, onToggle, onRemoveColumn, onPickAll }: ComparisonProps) {
  return (
    <div
      role="region"
      aria-label="비교 표 (가로로 스크롤)"
      tabIndex={columns.length >= 3 ? 0 : undefined}
      className="overflow-x-auto rounded-lg border border-line-neutral focus-visible:outline-none focus-visible:shadow-(--focus-ring)"
    >
      <table className="w-full border-collapse">
        <caption className="sr-only">{`레퍼런스 ${columns.length}개, 비교 항목 ${rows.length}개`}</caption>
        <thead>
          <tr>
            <td className="sticky left-0 z-1 min-w-32 bg-background-normal" />
            {columns.map((column) => (
              <th key={column.referenceId} scope="col" className="min-w-48 p-3 align-top">
                <ColumnHeader
                  column={column}
                  pickAllLabel={pickAllLabel}
                  canPickAll={rows.some((r) => r.cells.some((c) => c.referenceId === column.referenceId && c.pickable)) || columns.length === 1}
                  disabled={disabled}
                  onRemove={() => onRemoveColumn(column.referenceId)}
                  onPickAll={() => onPickAll(column.referenceId)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <PickRow key={row.id} row={row} columns={columns} picks={picks} disabled={disabled} onToggle={onToggle} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useId, useState } from "react";
import type { ComparisonRowId, Picks } from "../../domain/compareBoard";
import type { BoardColumnView, ComparisonRowView } from "../../features/compare/boardView";
import { cx } from "../ds/cx";
import { Icon } from "../ds/Icon";
import { ColumnHeader } from "./ColumnHeader";
import type { ComparisonProps } from "./ComparisonTable";
import { PickButton } from "./PickButton";

function summaryOf(row: ComparisonRowView, columns: readonly BoardColumnView[], picks: Picks): string {
  if (row.role === "info") return "비교 정보";
  const picked = columns.find((c) => c.referenceId === picks[row.id as keyof Picks]);
  return picked ? `${picked.label} 선택됨` : "선택 안 함";
}

/** 항목 하나 — h3 > button[aria-expanded][aria-controls] + 펼친 영역 role=region (A-11) */
function AccordionItem({ row, columns, picks, expanded, disabled, onExpand, onToggle }: {
  readonly row: ComparisonRowView;
  readonly columns: readonly BoardColumnView[];
  readonly picks: Picks;
  readonly expanded: boolean;
  readonly disabled: boolean;
  readonly onExpand: () => void;
  readonly onToggle: (rowId: ComparisonRowId, referenceId: string) => void;
}) {
  const buttonId = useId();
  const panelId = useId();
  const selected = picks[row.id as keyof Picks];
  return (
    <div className="border-t border-line-alternative">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onExpand}
          className="flex w-full cursor-pointer items-center gap-2 py-3.5 text-left focus-visible:outline-none focus-visible:shadow-(--focus-ring)"
        >
          <span className="ds-label flex-1 text-label-strong">
            {row.label} <span className="ds-caption1 font-normal text-label-alternative">· {summaryOf(row, columns, picks)}</span>
          </span>
          <Icon name="chevron-down" size={18} className={cx("text-label-alternative transition-transform", expanded && "rotate-180")} />
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded} className="pb-4">
        <ul className="flex flex-col gap-2">
          {row.cells.map((cell, i) => (
            <li key={cell.referenceId} className={cx("flex flex-col gap-2 rounded-md bg-background-alternative p-3", cell.dimmed && "text-label-alternative")}>
              <span className="ds-caption1 font-semibold text-label-neutral">
                {columns[i]!.label} {columns[i]!.title}
              </span>
              <span className="ds-body3">{cell.label}</span>
              {cell.pickable && (
                <PickButton
                  rowLabel={row.label}
                  columnLabel={columns[i]!.label}
                  referenceTitle={columns[i]!.title}
                  pressed={selected === cell.referenceId}
                  disabled={disabled}
                  onToggle={() => onToggle(row.id, cell.referenceId)}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * <768 항목 아코디언 (SPEC 5.3). 표가 아니므로 표 의미를 쓰지 않는다. 여러 항목을 동시에 펼칠 수 있고
 * 처음엔 필수 항목(Hero)만 펼친다. 값은 자르지 않는다(정보 손실 0).
 */
export function ComparisonAccordion({ columns, rows, picks, pickAllLabel, disabled = false, onToggle, onRemoveColumn, onPickAll }: ComparisonProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<ComparisonRowId>>(() => new Set(rows.filter((r) => r.required).map((r) => r.id)));
  const flip = (id: ComparisonRowId) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ul aria-label="비교 중인 레퍼런스" className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {columns.map((column) => (
          <li key={column.referenceId} className="w-56 flex-none rounded-lg border border-line-neutral p-3">
            <ColumnHeader
              column={column}
              pickAllLabel={pickAllLabel}
              canPickAll={columns.length === 1 || rows.some((r) => r.cells.some((c) => c.referenceId === column.referenceId && c.pickable))}
              disabled={disabled}
              onRemove={() => onRemoveColumn(column.referenceId)}
              onPickAll={() => onPickAll(column.referenceId)}
            />
          </li>
        ))}
      </ul>
      <div>
        {rows.map((row) => (
          <AccordionItem
            key={row.id}
            row={row}
            columns={columns}
            picks={picks}
            expanded={expanded.has(row.id)}
            disabled={disabled}
            onExpand={() => flip(row.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

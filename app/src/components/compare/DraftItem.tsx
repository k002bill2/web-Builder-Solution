import { useId } from "react";
import type { DraftSource } from "../../domain/profileDraft";

function sourceText(source: DraftSource): string {
  if (source.kind === "pick") return `${source.columnLabel} · ${source.title}`;
  if (source.kind === "default") return `기본값 · ${source.columnLabel}`;
  if (source.kind === "custom") return "사용자";
  if (source.kind === "fallback") return "기본값";
  return "";
}

/**
 * 초안 항목 한 줄 (SPEC 7.2 · v2 4.4). 고르지 않은 항목은 "기본값" 텍스트로 구분한다(색만으로 구분하지 않음).
 * 값은 자르지 않고 줄바꿈한다(D-9). 앞의 출처 색 점은 장식 — 출처 레퍼런스가 없으면 빈 자리만 둔다(정렬 유지).
 */
export function DraftItem({
  rowLabel,
  valueLabel,
  source,
  note,
  swatch,
  dot,
}: {
  readonly rowLabel: string;
  readonly valueLabel: string;
  readonly source: DraftSource;
  readonly note?: string;
  readonly swatch?: string;
  readonly dot?: string;
}) {
  const labelId = useId();
  const origin = sourceText(source);
  const picked = source.kind === "pick" || source.kind === "custom";
  return (
    <li aria-labelledby={labelId} className="flex gap-2.5 border-b border-line-neutral py-2.5">
      <span aria-hidden="true" className="mt-1 size-2.5 flex-none rounded-full" style={dot ? { backgroundColor: dot } : undefined} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span id={labelId} className="ds-caption1 font-semibold text-label-neutral">
            {rowLabel}
          </span>
          {origin && <span className={picked ? "ds-caption1 text-primary-text" : "ds-caption1 text-label-alternative"}>{origin}</span>}
        </div>
        <p className="ds-body3 flex items-center gap-1.5 text-label-normal">
          {swatch && <span aria-hidden="true" className="size-3.5 flex-none rounded-xs" style={{ backgroundColor: swatch }} />}
          <span className={source.kind === "pending" ? "text-label-alternative" : undefined}>{valueLabel}</span>
        </p>
        {note && <p className="ds-caption1 text-label-neutral">{note}</p>}
      </div>
    </li>
  );
}

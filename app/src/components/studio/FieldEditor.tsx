import { useState } from "react";
import type { SlotSchemaEntry } from "../../engine/contracts/sectionDefinition";
import { GATE_TEXT } from "../../engine/gate/gateText";
import { cx } from "../ds/cx";
import { countField } from "../../features/studio/fieldCounter";

/** 슬롯 정의(엔진 슬롯 스키마) — 상한이 없는 문서 필드(페이지 정보)도 받는다. 긴 글만 textarea, 나머지(이미지 = 대체텍스트)는 한 줄 */
export type FieldSpec = Pick<SlotSchemaEntry, "label" | "kind" | "required" | "recommendedLength"> & {
  readonly maxLength?: number;
};

const BOX =
  "w-full rounded-md border-(length:--border-thick) border-line-strong bg-background-normal px-4 py-2 text-body3 text-label-normal outline-none " +
  "transition-[border-color,box-shadow] duration-(--duration-fast) ease-standard hover:border-label-alternative " +
  "focus:border-primary focus:shadow-(--focus-ring) aria-invalid:border-status-negative-text";

/**
 * 필드 편집 (SPEC 5.6 · E-S19 · E-AC-06). 카운터·안내 문장은 `aria-describedby`로만 잇는다(라이브 영역 아님 — 매 글자 낭독 금지).
 * `describedBy` = 캔버스 문제 문장 id(5.7) — 맨 앞에 둔다. 필수 빈 값은 포커스를 떠날 때만 알린다.
 */
export function FieldEditor({
  id,
  spec,
  value,
  onChange,
  describedBy,
  warnNote,
}: {
  readonly id: string;
  readonly spec: FieldSpec;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly describedBy?: string;
  readonly warnNote?: (recommended: number) => string;
}) {
  const [blurred, setBlurred] = useState(false);
  const count = countField(value, spec, warnNote);
  const requiredEmpty = spec.required && blurred && value.trim() === "";
  const message = requiredEmpty ? GATE_TEXT.requiredEmpty : count.message;
  const invalid = requiredEmpty || count.level === "block";
  const counterId = `${id}-count`;
  const messageId = `${id}-note`;
  const describedIds = [describedBy, counterId, message && messageId].filter(Boolean).join(" ");
  const common = {
    id,
    value,
    maxLength: count.inputMaxLength,
    "aria-describedby": describedIds,
    "aria-invalid": invalid || undefined,
    className: BOX,
    onBlur: () => setBlurred(true),
  };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="ds-label text-label-normal">
        {spec.label}
        {spec.required && <span className="ml-1 text-label-alternative">(필수)</span>}
      </label>
      {spec.kind === "long-text" ? (
        <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type="text" onChange={(e) => onChange(e.target.value)} />
      )}
      <div className="flex flex-wrap items-baseline gap-x-2 text-caption1">
        <p id={counterId} className="tabular-nums text-label-alternative">
          {count.counterText}
        </p>
        {message && (
          <p id={messageId} className={cx(invalid ? "text-status-negative-text" : "text-status-cautionary-text")}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useId, useMemo, useState } from "react";
import type { PageDoc, SectionInstance } from "../../engine/contracts/pageDoc";
import type { Purpose } from "../../engine/ops/rules";
import { loadDocEngine, type DocEngine } from "../../features/studio/docOps";
import { variantChoices, type VariantChoice } from "../../features/studio/variantChoices";

/**
 * 변형 교체 라디오 목록(5.5 · E-AC-20) — 조작 뒤 청크(S-B5, "변형 바꾸기"를 펼칠 때만 받는다).
 * 옵션마다 접근 이름 = 이름표(`aria-labelledby`) · 캡션 "유지 N · 잃음 M (이름)" = 설명(`aria-describedby`). 목적 조건으로 막힌 변형은 `disabled`(방향키가 건너뜀) + `aria-disabled`,
 * 이유는 그룹 설명(6.5). 고르면 바로 적용(확인 없음) — 포커스는 라디오 그대로.
 */
export default function VariantOptions({
  doc,
  section,
  purpose,
  onSwap,
}: {
  readonly doc: PageDoc;
  readonly section: SectionInstance;
  readonly purpose: Purpose;
  readonly onSwap: (choice: VariantChoice, radio: HTMLElement) => void;
}) {
  const id = useId();
  // 캡션 비교(diffSlots)는 연산 청크에서 — 펼친 뒤 받는다(실패하면 목록 없이 남는다: 연산도 같은 청크라 어차피 못 한다)
  const [engine, setEngine] = useState<DocEngine>();
  useEffect(() => {
    let cancelled = false;
    loadDocEngine().then(
      (loaded) => {
        if (!cancelled) setEngine(loaded);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, []);
  const choices = useMemo(() => (engine ? variantChoices(engine.diffSlots, doc, section, purpose) : []), [engine, doc, section, purpose]);
  const reasons = [...new Set(choices.flatMap((c) => (c.permission.ok ? [] : [c.permission.reason])))];
  if (!engine) return null;
  return (
    <div
      role="radiogroup"
      aria-label="변형"
      aria-describedby={reasons.map((_, i) => `${id}-reason-${i}`).join(" ") || undefined}
      className="flex flex-col gap-1 pt-2"
    >
      {choices.map((choice) => (
        <label key={choice.variant} className="flex min-h-10 cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-fill-normal has-disabled:cursor-not-allowed has-disabled:text-label-disable">
          <input
            type="radio"
            name={`${id}-variant`}
            value={choice.variant}
            checked={choice.variant === section.variant}
            disabled={!choice.permission.ok}
            aria-disabled={choice.permission.ok ? undefined : true}
            aria-labelledby={`${id}-${choice.variant}-label`}
            aria-describedby={`${id}-${choice.variant}`}
            onChange={(event) => onSwap(choice, event.currentTarget)}
            className="mt-1 accent-primary"
          />
          <span className="flex flex-col">
            <span id={`${id}-${choice.variant}-label`} className="ds-body3">
              {choice.label}
            </span>
            <span id={`${id}-${choice.variant}`} className="ds-caption1 text-label-alternative">
              {choice.caption}
            </span>
          </span>
        </label>
      ))}
      {reasons.map((reason, i) => (
        <p key={reason} id={`${id}-reason-${i}`} className="ds-caption1 text-label-alternative">
          {reason}
        </p>
      ))}
    </div>
  );
}

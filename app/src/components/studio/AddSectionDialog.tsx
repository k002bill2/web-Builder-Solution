import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { PageDoc, SectionType } from "../../engine/contracts/pageDoc";
import { addableTypes } from "../../features/studio/sectionCatalog";
import { Button } from "../ds/Button";

const OPTION = "flex min-h-10 cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-fill-normal has-disabled:cursor-not-allowed has-disabled:text-label-disable";

/**
 * "섹션 추가" 대화상자(5.3 · 5.15 · E-AC-18) — 조작 뒤 청크(S-B5, "섹션 추가"를 눌러야 받는다).
 * 네이티브 `dialog` + `showModal()` · 제목 h2 = 접근 이름 · 열 때 포커스 = 첫 입력(첫 추가 가능 유형) · Esc = 취소 · 바깥 클릭으로 닫지 않는다.
 * ① 유형 라디오(라이브러리 순서, 이름 + 한 줄 설명) → ② 그 유형의 변형 라디오(이름표) → "추가" · "취소".
 * 중복 불가 유형은 `disabled`(방향키가 건너뜀) + `aria-disabled` + 이유를 그룹 설명(`aria-describedby`)으로(6.5).
 * 구조 썸네일은 두지 않는다(이름표만 — REPORT SPEC 차이).
 */
export default function AddSectionDialog({
  doc,
  onAdd,
  onCancel,
}: {
  readonly doc: PageDoc;
  readonly onAdd: (type: SectionType, variant: string) => void;
  readonly onCancel: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const types = useMemo(() => addableTypes(doc), [doc]);
  const first = types.find((t) => t.permission.ok);
  const [type, setType] = useState(first?.type);
  const [variant, setVariant] = useState(first?.variants[0]?.variant);
  const chosen = types.find((t) => t.type === type);
  const blocked = types.flatMap((t) => (t.permission.ok ? [] : [t.permission.reason]));

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    firstInput.current?.focus();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-full max-w-lg rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (type && variant) onAdd(type, variant);
        }}
      >
        <h2 id={`${id}-title`} className="ds-heading2">
          섹션 추가
        </h2>
        <fieldset aria-describedby={blocked.map((_, i) => `${id}-reason-${i}`).join(" ") || undefined} className="flex flex-col gap-1">
          <legend className="ds-label mb-1">유형</legend>
          {types.map((t) => (
            <label key={t.type} className={OPTION}>
              <input
                ref={t.type === first?.type ? firstInput : undefined}
                type="radio"
                name={`${id}-type`}
                value={t.type}
                checked={t.type === type}
                disabled={!t.permission.ok}
                aria-disabled={t.permission.ok ? undefined : true}
                onChange={() => {
                  setType(t.type);
                  setVariant(t.variants[0]?.variant);
                }}
                className="mt-1 accent-primary"
              />
              <span className="flex flex-col">
                <span className="ds-label">{t.name}</span>
                <span className="ds-caption1 text-label-alternative">{t.description}</span>
              </span>
            </label>
          ))}
          {blocked.map((reason, i) => (
            <p key={reason} id={`${id}-reason-${i}`} className="ds-caption1 text-label-alternative">
              {reason}
            </p>
          ))}
        </fieldset>
        {chosen && (
          <fieldset className="flex flex-col gap-1">
            <legend className="ds-label mb-1">변형</legend>
            {chosen.variants.map((v) => (
              <label key={v.variant} className={OPTION}>
                <input
                  type="radio"
                  name={`${id}-variant`}
                  value={v.variant}
                  checked={v.variant === variant}
                  onChange={() => setVariant(v.variant)}
                  className="mt-1 accent-primary"
                />
                <span className="ds-body3">{v.label}</span>
              </label>
            ))}
          </fieldset>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit">추가</Button>
        </div>
      </form>
    </dialog>
  );
}

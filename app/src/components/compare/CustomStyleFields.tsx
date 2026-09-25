import { useId, useState } from "react";
import type { CustomStyle } from "../../domain/compareBoard";
import type { AllowedFontId, FontOption } from "../../domain/fonts";
import { Button } from "../ds/Button";
import { Select } from "../ds/Select";
import { TextField } from "../ds/TextField";

type FontValue = AllowedFontId | "";

/** 대표색 검사 — zod 검증(`boardInput`)은 비교 보드 엔진 청크에 있어 화면이 넘겨준다 */
export type PrimaryColorCheck = (input: string) => { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: string };

function without(value: CustomStyle, key: keyof CustomStyle): CustomStyle {
  return Object.fromEntries(Object.entries(value).filter(([k]) => k !== key)) as CustomStyle;
}

/**
 * 사용자 대표색·폰트 (SPEC 3.5). 대표색은 포커스를 옮기거나 Enter일 때 zod 검사(checkPrimaryColor)를 거치고,
 * 잘못된 값은 저장하지 않고 필드에 오류를 붙인다(aria-invalid · aria-describedby).
 * 폰트는 허용 목록 Select만 — 이 화면은 폰트 파일을 싣지 않고 이름·견본 텍스트만 보여 준다.
 */
export interface CustomStyleFieldsProps {
  readonly value: CustomStyle;
  readonly fonts: readonly FontOption[];
  readonly checkPrimaryColor: PrimaryColorCheck;
  readonly onChange: (value: CustomStyle) => void;
}

export function CustomStyleFields({ value, fonts, checkPrimaryColor, onChange }: CustomStyleFieldsProps) {
  const errorId = useId();
  const [text, setText] = useState(value.primaryColor ?? "");
  const [error, setError] = useState<string | null>(null);
  // 밖에서 바뀐 대표색(보정값 쓰기·되돌리기·비우기)을 입력란에 맞춘다
  const [shown, setShown] = useState(value.primaryColor);
  if (shown !== value.primaryColor) {
    setShown(value.primaryColor);
    setText(value.primaryColor ?? "");
    setError(null);
  }

  const commit = () => {
    const input = text.trim();
    if (input === "") {
      setError(null);
      if (value.primaryColor !== undefined) onChange(without(value, "primaryColor"));
      return;
    }
    const checked = checkPrimaryColor(input);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setError(null);
    const primaryColor = checked.value;
    if (primaryColor !== value.primaryColor) onChange({ ...value, primaryColor });
  };

  const family = fonts.find((f) => f.id === value.fontFamily)?.family;
  const options = [{ value: "" as FontValue, label: "선택 안 함" }, ...fonts.filter((f) => f.enabled).map((f) => ({ value: f.id as FontValue, label: f.family }))];
  const hasCustom = value.primaryColor !== undefined || value.fontFamily !== undefined;

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="ds-label mb-2 text-label-strong">사용자 스타일</legend>
      <div className="flex items-center gap-2">
        {value.primaryColor && (
          <span aria-hidden="true" className="size-8 flex-none rounded-sm border border-line-neutral" style={{ backgroundColor: value.primaryColor }} />
        )}
        <TextField
          label="대표색"
          value={text}
          placeholder="#RRGGBB"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setText(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
        />
      </div>
      {error && (
        <p id={errorId} className="ds-caption1 text-status-negative-text">
          {error}
        </p>
      )}
      <Select<FontValue>
        label="폰트"
        size="sm"
        options={options}
        value={value.fontFamily ?? ""}
        onChange={(next) => onChange(next === "" ? without(value, "fontFamily") : { ...value, fontFamily: next })}
      />
      {family && (
        <p data-testid="font-sample" className="ds-body3 text-label-neutral" style={{ fontFamily: `"${family}"` }}>
          {family} · 가나다라마 Aa 123
        </p>
      )}
      {hasCustom && (
        <Button variant="assistive" size="sm" aria-label="사용자 스타일 지우기" onClick={() => onChange({})} className="self-start">
          지우기
        </Button>
      )}
    </fieldset>
  );
}

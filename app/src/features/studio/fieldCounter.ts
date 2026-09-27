/**
 * 필드 글자 수 판정 (DS-2A-05 SPEC 5.6 · E-S19 · E-AC-06). 문장은 엔진 게이트 문구(`overMax`·`recommendedNote`)를 그대로 쓴다.
 * - 카운터 분모 = 권장 → 없으면 상한("34 / 28자"). 둘 다 없으면 글자 수만.
 * - 상한 초과 = block(R-13, 권장 초과여도 block 문장 하나만) · 권장 초과 = warn · 그 밖 ok.
 * - 입력은 막지 않는다 — 입력 가능 길이 = 상한 + 10(붙여 넣고 줄이는 흐름 보호). 상한이 없으면 제한 없음.
 */
import { overMax, recommendedNote } from "../../engine/gate/gateText";
import { charCount } from "../../engine/gate/issue";

export const FIELD_INPUT_SLACK = 10;

export type FieldLevel = "ok" | "warn" | "block";

export interface FieldLimits {
  readonly maxLength?: number;
  readonly recommendedLength?: number;
}

export interface FieldCount {
  readonly length: number;
  readonly counterText: string;
  readonly level: FieldLevel;
  readonly message?: string;
  readonly inputMaxLength?: number;
}

export function countField(value: string, limits: FieldLimits, warnNote: (recommended: number) => string = recommendedNote): FieldCount {
  const { maxLength, recommendedLength } = limits;
  const length = charCount(value);
  const limit = recommendedLength ?? maxLength;
  const counterText = limit === undefined ? `${length}자` : `${length} / ${limit}자`;
  const inputMaxLength = maxLength === undefined ? undefined : maxLength + FIELD_INPUT_SLACK;
  if (maxLength !== undefined && length > maxLength) return { length, counterText, level: "block", message: overMax(maxLength, length), inputMaxLength };
  if (recommendedLength !== undefined && length > recommendedLength) return { length, counterText, level: "warn", message: warnNote(recommendedLength), inputMaxLength };
  return { length, counterText, level: "ok", inputMaxLength };
}

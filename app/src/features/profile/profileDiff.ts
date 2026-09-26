/** 버전 비교·요약 (DS-2A-04 3.5 · 6.4 `diffProfiles`·`summarizeVersion`). 엔진 청크 전용. */
import type { DesignProfileInput } from "../../domain/compareBoard";
import { profileFieldRows } from "./profileFields";

export interface DiffRow {
  readonly key: string;
  readonly label: string;
  readonly a: string;
  readonly b: string;
  readonly changed: boolean;
}

type TitleOf = (referenceId: string) => string;

/** 두 적용된 값의 필드별 차이 — 표시 순서는 3.1 표 순서로 고정 */
export function diffProfiles(a: DesignProfileInput, b: DesignProfileInput, titleOf: TitleOf): readonly DiffRow[] {
  const right = profileFieldRows(b, titleOf);
  return profileFieldRows(a, titleOf).map((row, i) => {
    const other = right[i]!;
    return { key: row.key, label: row.label, a: row.value, b: other.value, changed: row.value !== other.value || row.caption !== other.caption };
  });
}

/** 버전 줄 요약: 직전 버전과의 차이 최대 2개 + "외 N" */
export function summarizeVersion(prev: DesignProfileInput | undefined, next: DesignProfileInput, titleOf: TitleOf): string {
  if (!prev) return "첫 버전";
  const changed = diffProfiles(prev, next, titleOf).filter((r) => r.changed).map((r) => r.label);
  if (changed.length === 0) return "바뀐 값 없음";
  const rest = changed.length - 2;
  return `${changed.slice(0, 2).join(" · ")}${rest > 0 ? ` 외 ${rest}` : ""}`;
}

/**
 * 버전 비교·요약·값 목록 (DS-2A-04 3.1 · 3.5 · 6.4 `diffProfiles`·`summarizeVersion`). 엔진 청크 전용.
 * 화면은 적용된 값(effectiveProfile) + 조정(대비·사이트 목적)으로 비교·요약한다(`diffVersions`·`summarizeVersions`, 2a-04b2).
 */
import type { DesignProfileInput } from "../../domain/compareBoard";
import { ELEMENT_LABELS } from "../../domain/elementLibrary";
import type { CarryOverItem, ProfileVersion } from "../../domain/profile";
import { effectiveProfile } from "../../domain/effectiveProfile";
import { CONTRAST_LABELS, droppedSummary, purposeLabel } from "./adjustmentText";
import { profileFieldRows, type FieldRow } from "./profileFields";

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
  return diffRows(profileFieldRows(a, titleOf), profileFieldRows(b, titleOf));
}

function diffRows(left: readonly FieldRow[], right: readonly FieldRow[]): readonly DiffRow[] {
  return left.map((row, i) => {
    const other = right[i]!;
    return { key: row.key, label: row.label, a: row.value, b: other.value, changed: row.value !== other.value || row.caption !== other.caption };
  });
}

/** 버전의 비교 행 = 적용된 값(이름표 포함) + 필드에 없는 조정(대비·사이트 목적) — 3.1 표 순서 */
function versionRows(v: ProfileVersion, titleOf: TitleOf): readonly FieldRow[] {
  return [
    ...profileFieldRows(effectiveProfile(v.base, v.adjustments), titleOf, ELEMENT_LABELS),
    { key: "contrast", label: "대비", value: CONTRAST_LABELS[v.adjustments.contrast ?? "aa"] },
    { key: "purpose", label: "사이트 목적", value: purposeLabel(v.adjustments.purpose) },
  ];
}

/** 두 버전의 적용된 값 비교 (3.5) */
export function diffVersions(a: ProfileVersion, b: ProfileVersion, titleOf: TitleOf): readonly DiffRow[] {
  return diffRows(versionRows(a, titleOf), versionRows(b, titleOf));
}

/** 버전 줄 요약 — 적용된 값 기준(조정 버전도 바뀐 값이 보인다) + 재확정에서 지운 조정 한 줄 */
export function summarizeVersions(prev: ProfileVersion | undefined, next: ProfileVersion, titleOf: TitleOf): string {
  const summary = prev ? changedSummary(diffVersions(prev, next, titleOf)) : "첫 버전";
  return next.dropped?.length ? `${summary} · ${droppedSummary(next.dropped)}` : summary;
}

/** 프로필 값 목록 행 (3.1) — 적용된 값 + 이름표, 조정으로 바뀐 간격·모션은 캡션 "조정됨 · 보드 값 …"(5.4) */
export function valueRows(v: ProfileVersion, titleOf: TitleOf): readonly FieldRow[] {
  const applied = effectiveProfile(v.base, v.adjustments);
  const boardGap = v.base.spacing_tokens.sectionGap;
  return profileFieldRows(applied, titleOf, ELEMENT_LABELS).map((row) => {
    if (row.key === "spacing" && applied.spacing_tokens.sectionGap !== boardGap) return { ...row, caption: `조정됨 · 보드 값 ${boardGap}` };
    if (row.key === "motion" && applied.motion_preset !== v.base.motion_preset) return { ...row, caption: `조정됨 · 보드 값 ${v.base.motion_preset}` };
    return row;
  });
}

/** 버전 줄 요약: 직전 버전과의 차이 최대 2개 + "외 N". 재확정에서 지운 조정이 있으면 그 한 줄을 붙인다 (6.1-3) */
export function summarizeVersion(prev: DesignProfileInput | undefined, next: DesignProfileInput, titleOf: TitleOf, dropped: readonly CarryOverItem[] = []): string {
  const summary = baseSummary(prev, next, titleOf);
  return dropped.length > 0 ? `${summary} · ${droppedSummary(dropped)}` : summary;
}

function baseSummary(prev: DesignProfileInput | undefined, next: DesignProfileInput, titleOf: TitleOf): string {
  return prev ? changedSummary(diffProfiles(prev, next, titleOf)) : "첫 버전";
}

function changedSummary(rows: readonly DiffRow[]): string {
  const changed = rows.filter((r) => r.changed).map((r) => r.label);
  if (changed.length === 0) return "바뀐 값 없음";
  const rest = changed.length - 2;
  return `${changed.slice(0, 2).join(" · ")}${rest > 0 ? ` 외 ${rest}` : ""}`;
}

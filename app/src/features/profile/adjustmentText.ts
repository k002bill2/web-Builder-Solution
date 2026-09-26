/**
 * 조정·이어받기 문구 (DS-2A-04 P-S25 · 6.1-3 겹침 판정 표 문장). 보드 P-S25 패널(조건부 청크)과 프로필 버전 요약(엔진 청크)이 함께 쓴다.
 * 첫 화면 정적 JS에 넣지 않는다(ADR-004).
 */
import type { CarryOverItem, ContrastLevel, Density, ProfileAdjustments } from "../../domain/profile";
import { PURPOSE_LABELS } from "../../fixtures/catalogFilters";

const DENSITY_LABELS: Readonly<Record<Density, string>> = Object.freeze({ comfortable: "여유", compact: "촘촘" });
const CONTRAST_LABELS: Readonly<Record<ContrastLevel, string>> = Object.freeze({ aa: "기본 AA", enhanced: "강화" });
/** 패널 줄 이유 (P-S25) */
const REASONS: Readonly<Record<NonNullable<CarryOverItem["reason"]>, string>> = Object.freeze({
  "board-changed": "보드에서 모션을 바꿨습니다",
  "palette-changed": "보드에서 팔레트를 바꿨습니다",
  "new-contrast-failure": "새 카드 톤에서 대비가 맞지 않습니다",
});
const ORDER: readonly CarryOverItem["key"][] = ["density", "contrast", "motion", "purpose", "correction"];

/** "밀도 촘촘" · "모션 L2" · "사이트 목적 예약" · "ink 보정" */
function itemLabel(item: CarryOverItem, adjustments: ProfileAdjustments): string {
  if (item.key === "density") return `밀도 ${adjustments.density ? DENSITY_LABELS[adjustments.density] : ""}`;
  if (item.key === "contrast") return `대비 ${adjustments.contrast ? CONTRAST_LABELS[adjustments.contrast] : ""}`;
  if (item.key === "motion") return `모션 ${adjustments.motion ?? ""}`;
  if (item.key === "purpose") return `사이트 목적 ${adjustments.purpose === "none" ? "정하지 않음" : adjustments.purpose ? PURPOSE_LABELS[adjustments.purpose] : ""}`;
  return `${item.role ?? ""} 보정`;
}

/** 패널 목록 한 줄 — "밀도 촘촘 — 이어짐" / "모션 L2 — 지워짐 · 보드에서 모션을 바꿨습니다". 순서는 밀도·대비·모션·목적·보정 */
export function carryOverLines(plan: { readonly kept: readonly CarryOverItem[]; readonly dropped: readonly CarryOverItem[] }, adjustments: ProfileAdjustments): readonly string[] {
  return [...plan.kept, ...plan.dropped]
    .map((item, i) => ({ item, i }))
    .sort((a, b) => ORDER.indexOf(a.item.key) - ORDER.indexOf(b.item.key) || a.i - b.i)
    .map(({ item }) => `${itemLabel(item, adjustments)} — ${item.reason ? `지워짐 · ${REASONS[item.reason]}` : "이어짐"}`);
}

/** 버전 요약에 붙는 한 줄 — "보드에서 모션을 바꿔 모션 조정을 지웠습니다" (6.1-3) */
export function droppedSummary(dropped: readonly CarryOverItem[]): string {
  return dropped
    .map((item) => {
      if (item.key === "motion") return "보드에서 모션을 바꿔 모션 조정을 지웠습니다";
      if (item.reason === "new-contrast-failure") return `새 카드 톤에서 대비가 맞지 않아 ${item.role ?? ""} 보정을 지웠습니다`;
      return `보드에서 팔레트를 바꿔 ${item.role ?? ""} 보정을 지웠습니다`;
    })
    .join(" · ");
}

import type { PageDoc, SectionInstance } from "../../engine/contracts/pageDoc";
import { diffSlots } from "../../engine/ops/diff";
import { canSwapVariant, type Permission, type Purpose } from "../../engine/ops/rules";
import { getSectionDefinition, SECTION_TYPE_INFO } from "../../engine/sections/registry";

export interface VariantChoice {
  readonly variant: string;
  /** 이름표 — 변형 키는 화면에 쓰지 않는다(E-AC-20) */
  readonly label: string;
  /** "유지 4 · 잃음 1 (부제)" · 잃음 0이면 "슬롯 모두 유지"(5.5 — diffSlots) */
  readonly caption: string;
  /** 잃는 슬롯 이름표(알림 문장) */
  readonly lostLabels: readonly string[];
  /** 목적 필수 조건(R-03·R-04) — 지금 변형은 늘 가능 */
  readonly permission: Permission;
}

const ALLOWED: Permission = { ok: true };

/** 변형 교체 목록(5.5) — 조작 뒤 청크(펼칠 때만). 유형의 변형은 레지스트리 순서 그대로(엔진 레인이 더한 변형 포함) */
export function variantChoices(doc: PageDoc, section: SectionInstance, purpose: Purpose): readonly VariantChoice[] {
  const from = getSectionDefinition(section.type, section.variant)?.slots ?? [];
  return SECTION_TYPE_INFO[section.type].variants.flatMap((variant) => {
    const def = getSectionDefinition(section.type, variant);
    if (!def) return [];
    const { kept, lost } = diffSlots(from, def.slots);
    const lostLabels = lost.map((e) => e.label);
    return [
      {
        variant,
        label: def.label,
        caption: lost.length === 0 ? "슬롯 모두 유지" : `유지 ${kept.length} · 잃음 ${lost.length} (${lostLabels.join(", ")})`,
        lostLabels,
        permission: variant === section.variant ? ALLOWED : canSwapVariant(doc, section.instanceId, variant, purpose),
      },
    ];
  });
}

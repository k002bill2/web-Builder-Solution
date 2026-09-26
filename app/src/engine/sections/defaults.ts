/**
 * 기본 슬롯 콘텐츠(TRD 6.2) — 섹션 추가·변형 교체 때 새 슬롯에 넣는 값.
 * 이미지는 자체 플레이스홀더(PRD 원칙 4), 대체텍스트는 비워 둔다(게이트 R-09가 알린다).
 */
import type { ImageSlotValue, SlotValue } from "../contracts/pageDoc";
import type { SectionDefinition, SlotSchemaEntry } from "../contracts/sectionDefinition";

export const PLACEHOLDER_PATTERN_ID = "diagonal";

const PLACEHOLDER_IMAGE: ImageSlotValue = Object.freeze({
  kind: "image",
  enabled: true,
  source: Object.freeze({ kind: "placeholder", patternId: PLACEHOLDER_PATTERN_ID }),
  alt: "",
  decorative: false,
});

export function defaultSlotValue(entry: SlotSchemaEntry): SlotValue {
  return entry.kind === "image" ? PLACEHOLDER_IMAGE : (entry.defaultText ?? "");
}

export function defaultSlots(def: SectionDefinition): Readonly<Record<string, SlotValue>> {
  return Object.fromEntries(def.slots.map((entry) => [entry.key, defaultSlotValue(entry)]));
}

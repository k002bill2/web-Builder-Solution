/**
 * 값 연산 (SPEC 8.2 `setSlot` · `setMeta` · `swapTheme`) — 순수. 길이 상한은 막지 않는다(5.6 "입력은 막지 않는다", R-13은 게이트).
 */
import type { PageDoc, PageMetaField, SlotValue } from "../contracts/pageDoc";
import { getSectionDefinition } from "../sections/registry";
import { EngineOpError, sectionAt } from "./errors";

export function setSlot(doc: PageDoc, instanceId: string, key: string, value: SlotValue): PageDoc {
  const section = sectionAt(doc, instanceId);
  const entry = getSectionDefinition(section.type, section.variant)?.slots.find((s) => s.key === key);
  if (!entry) throw new EngineOpError("UNKNOWN_SLOT", `스키마에 없는 슬롯: ${section.type}/${section.variant}.${key}`);
  if ((entry.kind === "image") !== (typeof value === "object")) {
    throw new EngineOpError("SLOT_KIND", `슬롯 종류가 다릅니다: ${key}은 ${entry.kind}`);
  }
  const next = { ...section, slots: { ...section.slots, [key]: value } };
  return { ...doc, sections: doc.sections.map((s) => (s.instanceId === instanceId ? next : s)) };
}

export function setMeta(doc: PageDoc, field: PageMetaField, value: string): PageDoc {
  return { ...doc, meta: { ...doc.meta, [field]: value } };
}

/** 테마 = 문서가 가리키는 프로필 버전(Q3). 섹션·변형·슬롯 값은 그대로 */
export function swapTheme(doc: PageDoc, profileVersion: number): PageDoc {
  if (!Number.isSafeInteger(profileVersion) || profileVersion < 1) {
    throw new EngineOpError("BAD_VALUE", `프로필 버전은 1 이상의 정수: ${profileVersion}`);
  }
  return { ...doc, profileVersion };
}

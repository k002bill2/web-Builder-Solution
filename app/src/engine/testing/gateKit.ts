/**
 * 게이트 테스트 도우미 — 통과 문서 · 줄 찾기 · 키 순서 뒤집기(결정성 검사).
 */
import type { PageDoc, SectionInstance, SlotValue } from "../contracts/pageDoc";
import type { GateReport, GateRow, GateRowId } from "../contracts/records";
import { deepFreeze } from "../freeze";
import { sampleDoc, withSections } from "./sampleDoc";

/** 이미지 슬롯에 대체텍스트를 채운 섹션 */
export function withAlt(section: SectionInstance, alt = "매장 내부 사진"): SectionInstance {
  const slots: Record<string, SlotValue> = Object.fromEntries(
    Object.entries(section.slots).map(([key, value]) => [key, typeof value === "object" ? { ...value, alt } : value]),
  );
  return { ...section, slots };
}

/** 8줄 중 성능 외 7줄이 통과하는 문서(샘플 + 대체텍스트) */
export function passingDoc(over: Partial<PageDoc> = {}): PageDoc {
  const doc = sampleDoc(over);
  return withSections(doc, doc.sections.map((s) => withAlt(s)));
}

export function rowOf(report: GateReport, id: GateRowId): GateRow {
  const row = report.rows.find((r) => r.id === id);
  if (!row) throw new Error(`줄 없음: ${id}`);
  return row;
}

/** 모든 객체의 키 순서를 뒤집은 깊은 사본(배열 순서는 유지) */
export function reverseKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(reverseKeys) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).reverse().map((k) => [k, reverseKeys((value as Record<string, unknown>)[k])])) as T;
  }
  return value;
}

/** 슬롯 하나를 바꾼 섹션 */
export const withSlot = (section: SectionInstance, key: string, value: SlotValue): SectionInstance => ({
  ...section,
  slots: { ...section.slots, [key]: value },
});

export const frozen = <T>(value: T): T => deepFreeze(value);

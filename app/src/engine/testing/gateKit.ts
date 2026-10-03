/**
 * 게이트 테스트 도우미 — 통과 문서 · 줄 찾기 · 키 순서 뒤집기(결정성 검사).
 */
import type { ImageSlotValue, PageDoc, SectionInstance, SlotValue } from "../contracts/pageDoc";
import type { GateReport, GateRow, GateRowId } from "../contracts/records";
import { deepFreeze } from "../freeze";
import { parseLocalImageId } from "../validate/localImageId";
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

/** 테스트용 로컬 이미지 id — 2a-05 SPEC r4.11: R-09(대체텍스트)는 실제 이미지 id가 든 슬롯만 본다 */
export const LOCAL_IMAGE = parseLocalImageId("7c9e6679-7425-40de-944b-e07fc1f90ae7")!;

/** 이미지 슬롯에 실제 이미지(로컬 이미지 id)를 넣은 섹션 */
export const withPhoto = (section: SectionInstance, key = "image"): SectionInstance =>
  withSlot(section, key, { ...(section.slots[key] as ImageSlotValue), source: LOCAL_IMAGE });

/** 문서의 Hero·About 이미지 슬롯에 실제 이미지를 넣는다(샘플 기본 alt '' 유지 → R-09 차단 2건) */
export const withPhotos = (doc: PageDoc, ids: readonly string[] = ["s-hero", "s-about"]): PageDoc =>
  withSections(doc, doc.sections.map((s) => (ids.includes(s.instanceId) ? withPhoto(s) : s)));

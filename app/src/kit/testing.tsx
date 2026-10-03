import { render } from "@testing-library/react";
import type { PageDoc, SectionInstance, SlotValue } from "../engine/contracts/pageDoc";
import { sampleDoc, withSections } from "../engine/testing/sampleDoc";
import { PageDocument } from "../render/PageDocument";
import { SAMPLE_KIT_TOKENS } from "../render/testing/sampleKitTokens";

/** 테스트 전용 — 킷 섹션을 실제 렌더 문서 본문(PageDocument + 레지스트리)으로 그린다 */
export const drawDoc = (doc: PageDoc = sampleDoc(), images: Readonly<Record<string, string>> = {}) =>
  render(<PageDocument doc={doc} kitTokens={SAMPLE_KIT_TOKENS} images={images} />).container;

/** 섹션 하나의 슬롯 바꾸기 */
export const patch = (doc: PageDoc, instanceId: string, slots: Readonly<Record<string, SlotValue>>): PageDoc =>
  withSections(
    doc,
    doc.sections.map((s): SectionInstance => (s.instanceId === instanceId ? { ...s, slots: { ...s.slots, ...slots } } : s)),
  );
export const without = (doc: PageDoc, type: string): PageDoc => withSections(doc, doc.sections.filter((s) => s.type !== type));

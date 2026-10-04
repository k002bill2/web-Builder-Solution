import { render } from "@testing-library/react";
import type { PageDoc, SectionInstance, SlotValue } from "../../engine/contracts/pageDoc";
import { sampleDoc, section, withSections } from "../../engine/testing/sampleDoc";
import { PageDocument } from "../PageDocument";
import type { KitTokenInput } from "../protocol";
import { SAMPLE_KIT_TOKENS } from "./sampleKitTokens";

/** 테스트 전용 — 킷 섹션을 실제 렌더 문서 본문(PageDocument + 레지스트리)으로 그린다 */
export const drawDoc = (doc: PageDoc = sampleDoc(), images: Readonly<Record<string, string>> = {}, kitTokens: KitTokenInput = SAMPLE_KIT_TOKENS) =>
  render(<PageDocument doc={doc} kitTokens={kitTokens} images={images} />).container;

/** 섹션 하나의 슬롯 바꾸기 */
export const patch = (doc: PageDoc, instanceId: string, slots: Readonly<Record<string, SlotValue>>): PageDoc =>
  withSections(
    doc,
    doc.sections.map((s): SectionInstance => (s.instanceId === instanceId ? { ...s, slots: { ...s.slots, ...slots } } : s)),
  );
export const without = (doc: PageDoc, type: string): PageDoc => withSections(doc, doc.sections.filter((s) => s.type !== type));

/** hero 자리(s-hero)를 다른 변형으로 바꾼 문서 — 슬롯 = 그 변형 기본값 (M2B-1a) */
export const heroDoc = (variant: string, over: Partial<SectionInstance> = {}): PageDoc =>
  withSections(
    sampleDoc(),
    sampleDoc().sections.map((s) => (s.instanceId === "s-hero" ? section("hero", variant, "s-hero", { tone: "alt", ...over }) : s)),
  );

/** header·footer 자리(s-header · s-footer)를 다른 변형으로 바꾼 문서 — 슬롯 = 그 변형 기본값 (M2B-1b) */
export const boundDoc = (type: "header" | "footer", variant: string, base: PageDoc = sampleDoc()): PageDoc =>
  withSections(
    base,
    base.sections.map((s) => (s.instanceId === `s-${type}` ? section(type, variant, s.instanceId, { tone: s.tone }) : s)),
  );

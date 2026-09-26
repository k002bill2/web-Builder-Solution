/**
 * 테스트용 문서 — header · hero · 본문 5 · footer (본문 = hero 포함 6개). deepFreeze로 입력 불변을 검사한다.
 */
import type { PageDoc, SectionInstance, SectionType } from "../contracts/pageDoc";
import { deepFreeze } from "../freeze";
import { defaultSlots } from "../sections/defaults";
import { getSectionDefinition } from "../sections/registry";

export function section(type: SectionType, variant: string, instanceId: string, over: Partial<SectionInstance> = {}): SectionInstance {
  const def = getSectionDefinition(type, variant);
  if (!def) throw new Error(`정의 없음 ${type}/${variant}`);
  return { instanceId, type, variant, motion: "L1", tone: "base", slots: defaultSlots(def), ...over };
}

export const SAMPLE_SECTIONS: readonly SectionInstance[] = [
  section("header", "sticky-right-cta", "s-header"),
  section("hero", "fullbleed-left", "s-hero", { tone: "alt" }),
  section("about", "story", "s-about"),
  section("services", "cards-3", "s-services", { tone: "alt" }),
  section("faq", "accordion", "s-faq"),
  section("contact", "form", "s-contact", { tone: "alt" }),
  section("cta-band", "banner", "s-cta"),
  section("footer", "biz-extended", "s-footer", { tone: "alt" }),
];

export function sampleDoc(over: Partial<PageDoc> = {}): PageDoc {
  return deepFreeze({
    projectId: "project-1",
    revision: 3,
    hash: "",
    profileVersion: 2,
    candidateId: "candidate-a",
    libraryVersion: "1.4",
    generatorVersion: "0.1.0",
    meta: { title: "브랜드 홈", description: "브랜드를 소개하는 페이지입니다." },
    sections: SAMPLE_SECTIONS,
    updatedAt: "2026-09-26T00:00:00.000Z",
    ...over,
  });
}

/** 섹션 목록을 바꾼 문서 */
export const withSections = (doc: PageDoc, sections: readonly SectionInstance[]): PageDoc => deepFreeze({ ...doc, sections });

export const ids = (doc: PageDoc): string[] => doc.sections.map((s) => s.instanceId);

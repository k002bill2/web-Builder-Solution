import type { SectionPlanEntry } from "../../domain/compareBoard";
import { EngineOpError } from "../ops/errors";
import { hashDoc } from "../ops/hash";
import { defaultSlots } from "../sections/defaults";
import { getSectionDefinition } from "../sections/registry";
import { rowOf } from "../testing/gateKit";
import { sampleTheme } from "../testing/sampleTheme";
import { deepFreeze } from "../freeze";
import { validatePageDoc } from "../validate/validatePageDoc";
import { runGate } from "../gate/runGate";
import { REASONS } from "../ops/reasons";
import { createDocFromCandidate, type CandidatePlan, type DocStart } from "./createDocFromCandidate";

const e = (type: SectionPlanEntry["type"], variant: string): SectionPlanEntry => ({ type, variant });
const HEADER = e("header", "sticky-right-cta");
const HERO = e("hero", "fullbleed-left");
const FOOTER = e("footer", "biz-extended");
const BODY = [e("about", "story"), e("services", "cards-3"), e("services", "list"), e("faq", "accordion"), e("contact", "form")];
const SECTIONS = [HEADER, HERO, ...BODY, FOOTER];

const plan = (sections: readonly SectionPlanEntry[] = SECTIONS): CandidatePlan =>
  deepFreeze({ candidateId: "candidate-b", sections, libraryVersion: "1.4", generatorVersion: "preview-1" });
const START: DocStart = deepFreeze({ projectId: "project-1", updatedAt: "2026-09-27T00:00:00.000Z" });

function codeOf(run: () => unknown): string | undefined {
  try {
    run();
  } catch (error) {
    return error instanceof EngineOpError ? `${error.code} ${error.message}` : `other ${String(error)}`;
  }
  return undefined;
}

describe("createDocFromCandidate (SPEC 8.2 · 8.3.1 — 구조안 → 새 문서)", () => {
  it("정상 구조안 → validatePageDoc 통과 · revision 1 · hash = hashDoc · 메타 빈 값 · 구조안 순서", () => {
    const doc = createDocFromCandidate(plan(), 3, START);
    const checked = validatePageDoc(doc);
    expect(checked.ok).toBe(true);
    expect(doc).toMatchObject({ projectId: "project-1", revision: 1, profileVersion: 3, candidateId: "candidate-b", libraryVersion: "1.4", generatorVersion: "preview-1", updatedAt: START.updatedAt });
    expect(doc.meta).toEqual({ title: "", description: "" });
    expect(doc.hash).toBe(hashDoc(doc));
    expect(doc.sections.map((s) => `${s.type}/${s.variant}`)).toEqual(SECTIONS.map((s) => `${s.type}/${s.variant}`));
  });

  it("instanceId = 유형-순번(결정적) · 슬롯 = 기본 슬롯 콘텐츠 · 모션 = min(L1, 정의 상한) · 톤 = normalizeDoc 교대", () => {
    const doc = createDocFromCandidate(plan(), 3, START);
    expect(doc.sections.map((s) => s.instanceId)).toEqual(["header-1", "hero-1", "about-1", "services-1", "services-2", "faq-1", "contact-1", "footer-1"]);
    for (const s of doc.sections) expect(s.slots).toEqual(defaultSlots(getSectionDefinition(s.type, s.variant)!));
    expect(doc.sections.map((s) => s.motion)).toEqual(["L1", "L1", "L1", "L1", "L1", "L1", "L1", "L0"]);
    expect(doc.sections.map((s) => s.tone)).toEqual(["base", "alt", "base", "alt", "base", "alt", "base", "alt"]);
  });

  it("두 번 부르면 같은 문서 · 같은 해시 · 입력 불변 · 결과 동결", () => {
    const input = plan();
    const a = createDocFromCandidate(input, 3, START);
    const b = createDocFromCandidate(input, 3, START);
    expect(b).toEqual(a);
    expect(b.hash).toBe(a.hash);
    expect(input.sections).toEqual(SECTIONS);
    expect(Object.isFrozen(a) && Object.isFrozen(a.sections[1]!.slots)).toBe(true);
  });

  it("해시는 저장 메타(updatedAt)와 무관 — 다른 시각이어도 같은 해시", () => {
    const later = createDocFromCandidate(plan(), 3, { ...START, updatedAt: "2026-09-28T09:00:00+09:00" });
    expect(later.hash).toBe(createDocFromCandidate(plan(), 3, START).hash);
  });

  it.each([
    ["Header 없음", [HERO, ...BODY, FOOTER], REASONS.removeHeader],
    ["Footer 없음", [HEADER, HERO, ...BODY], REASONS.removeFooter],
    ["Header 둘", [HEADER, HEADER, HERO, ...BODY, FOOTER], REASONS.addHeaderOnce],
    ["Footer 둘", [HEADER, HERO, ...BODY, FOOTER, FOOTER], REASONS.addFooterOnce],
    ["Header가 맨 위 아님", [HERO, HEADER, ...BODY, FOOTER], REASONS.moveHeader],
    ["Footer가 맨 아래 아님", [HEADER, HERO, ...BODY.slice(0, 4), FOOTER, BODY[4]!], REASONS.moveFooter],
    ["본문 4", [HEADER, HERO, ...BODY.slice(0, 3), FOOTER], "본문 섹션이 4개입니다"],
    ["본문 10", [HEADER, HERO, ...BODY, ...BODY.slice(0, 4), FOOTER], "본문 섹션이 10개입니다"],
  ])("R-01 위반 구조안은 만들지 않는다 — %s (BAD_VALUE)", (_, sections, reason) => {
    expect(codeOf(() => createDocFromCandidate(plan(sections), 3, START))).toContain(`BAD_VALUE ${reason}`);
  });

  it.each([
    ["Hero 없음", [HEADER, ...BODY, e("faq", "accordion"), FOOTER], REASONS.removeHero],
    ["Hero가 첫 본문 아님", [HEADER, BODY[0]!, HERO, ...BODY.slice(1), FOOTER], REASONS.moveHero],
    ["Hero 둘", [HEADER, HERO, HERO, ...BODY, FOOTER], REASONS.addHeroOnce],
  ])("R-02 위반 구조안은 만들지 않는다 — %s (BAD_VALUE)", (_, sections, reason) => {
    expect(codeOf(() => createDocFromCandidate(plan(sections), 3, START))).toBe(`BAD_VALUE ${reason}`);
  });

  it("모르는 변형·유형은 거부(UNKNOWN_VARIANT) — 구조 판정보다 먼저", () => {
    const unknownVariant = [HEADER, HERO, e("about", "split"), ...BODY.slice(1), FOOTER];
    expect(codeOf(() => createDocFromCandidate(plan(unknownVariant), 3, START))).toBe("UNKNOWN_VARIANT 변형 없음: about/split");
    const unknownType = [HEADER, HERO, { type: "gallery", variant: "grid" } as unknown as SectionPlanEntry, ...BODY.slice(1), FOOTER];
    expect(codeOf(() => createDocFromCandidate(plan(unknownType), 3, START))).toBe("UNKNOWN_VARIANT 변형 없음: gallery/grid");
    expect(codeOf(() => createDocFromCandidate(plan([e("about", "split")]), 3, START))).toMatch(/^UNKNOWN_VARIANT/);
  });

  it("프로필 버전 · 프로젝트 id · 시각 모양이 틀리면 BAD_VALUE (validatePageDoc 경계와 같은 판정)", () => {
    expect(codeOf(() => createDocFromCandidate(plan(), 0, START))).toMatch(/^BAD_VALUE/);
    expect(codeOf(() => createDocFromCandidate(plan(), 1.5, START))).toMatch(/^BAD_VALUE/);
    expect(codeOf(() => createDocFromCandidate(plan(), 3, { ...START, projectId: "a b" }))).toMatch(/^BAD_VALUE/);
    expect(codeOf(() => createDocFromCandidate(plan(), 3, { ...START, updatedAt: "어제" }))).toMatch(/^BAD_VALUE/);
    expect(codeOf(() => createDocFromCandidate({ ...plan(), candidateId: "" }, 3, START))).toMatch(/^BAD_VALUE/);
  });

  it("새 문서의 게이트 — 구조(R-01·R-02) 이슈 0 · 기본 이미지 alt 빈 값(L4a Q-8)이라 R-09 차단 · 메타 빈 값이라 R-11 차단", () => {
    const report = runGate(createDocFromCandidate(plan(), 3, START), sampleTheme());
    const required = rowOf(report, "required-sections");
    expect(required.issues.filter((i) => i.ruleId === "R-01" || i.ruleId === "R-02")).toEqual([]);
    expect(rowOf(report, "alt-text").issues.map((i) => i.instanceId)).toEqual(["hero-1", "about-1"]);
    expect(rowOf(report, "seo-meta").state).toBe("block");
    expect(rowOf(report, "text-length").state).toBe("pass");
  });
});

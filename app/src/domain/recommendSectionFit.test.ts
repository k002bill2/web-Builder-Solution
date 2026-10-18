import { describe, expect, it } from "vitest";
import type { SectionType } from "../engine/contracts/pageDoc";
import { requiredSectionIssues, type Placement } from "../engine/gate/requiredSections";
import { getSectionDefinition } from "../engine/sections/registry";
import { generatedReferenceDetailFixtures } from "../fixtures/generatedReferenceDetails";
import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import type { SectionFitPurpose } from "./recommend";
import type { SectionEntry } from "./referenceDetail";
import { RECO_SECTION_FIT } from "./recommendSectionFit";

/** 상세 섹션 이름 → 엔진 SectionType (명시 대응 — 소문자화 추측 금지) */
const NAME_TO_TYPE: Readonly<Record<string, SectionType>> = Object.freeze({
  Header: "header",
  Hero: "hero",
  About: "about",
  Services: "services",
  Portfolio: "portfolio",
  Statistics: "statistics",
  Testimonials: "testimonials",
  Pricing: "pricing",
  FAQ: "faq",
  Contact: "contact",
  "CTA Band": "cta-band",
  Footer: "footer",
});

/** 상세 = 렌더 1:1 → variant는 엔진 변형 그대로. 모르는 이름은 건너뛰지 않고 실패 */
function toPlacements(sections: readonly SectionEntry[]): readonly Placement[] {
  return sections.map(({ name, variant }) => {
    const type = Object.hasOwn(NAME_TO_TYPE, name) ? NAME_TO_TYPE[name] : undefined;
    if (type === undefined) throw new Error(`알 수 없는 섹션 이름: ${name}`);
    return { type, variant };
  });
}

const RULE_OF: Readonly<Record<SectionFitPurpose, "R-04" | "R-03">> = Object.freeze({ booking: "R-04", inquiry: "R-03" });
const FIT_PURPOSES: readonly SectionFitPurpose[] = ["booking", "inquiry"];

function ruleIssues(placements: readonly Placement[], purpose: SectionFitPurpose) {
  return requiredSectionIssues(placements, purpose).filter((i) => i.ruleId === RULE_OF[purpose]);
}

function derivedFit(placements: readonly Placement[]): readonly SectionFitPurpose[] {
  return FIT_PURPOSES.filter((p) => ruleIssues(placements, p).length === 0);
}

const allIds = [...referenceFixtures, ...generatedReferenceFixtures].map((r) => r.id);
const details = { ...referenceDetailFixtures, ...generatedReferenceDetailFixtures };

function placementsOf(id: string): readonly Placement[] {
  const detail = details[id];
  if (!detail) throw new Error(`상세 없음: ${id}`);
  return toPlacements(detail.sections);
}

describe("RECO_SECTION_FIT 엔진 대조 가드 (RECO-AC-05)", () => {
  it("표는 후보 21개 id를 정확히 가진다", () => {
    expect(allIds).toHaveLength(21);
    expect(Object.keys(RECO_SECTION_FIT).sort()).toEqual([...allIds].sort());
  });

  it("모든 상세 섹션이 엔진 레지스트리에 정의돼 있다", () => {
    for (const id of allIds) {
      for (const p of placementsOf(id)) {
        expect(getSectionDefinition(p.type, p.variant), `${id} ${p.type}/${p.variant}`).toBeDefined();
      }
    }
  });

  it.each(allIds)("%s — booking: R-04 이슈 0 ⇔ 표에 booking · inquiry: R-03 이슈 0 ⇔ 표에 inquiry", (id) => {
    const placements = placementsOf(id);
    const row = RECO_SECTION_FIT[id] ?? [];
    for (const purpose of FIT_PURPOSES) {
      expect(ruleIssues(placements, purpose).length === 0, `${id} ${purpose}`).toBe(row.includes(purpose));
    }
  });

  it("표 전체 = 엔진 파생 결과 (행 값 순서 booking → inquiry · 동결)", () => {
    const derived = Object.fromEntries(allIds.map((id) => [id, derivedFit(placementsOf(id))]));
    expect(RECO_SECTION_FIT).toEqual(derived);
    expect(Object.isFrozen(RECO_SECTION_FIT)).toBe(true);
    for (const row of Object.values(RECO_SECTION_FIT)) expect(Object.isFrozen(row)).toBe(true);
  });

  it("공허 통과 방지 — booking 충족 행 ≥ 1 · inquiry 충족 행 ≥ 1", () => {
    const rows = Object.values(RECO_SECTION_FIT);
    expect(rows.filter((r) => r.includes("booking")).length).toBeGreaterThanOrEqual(1);
    expect(rows.filter((r) => r.includes("inquiry")).length).toBeGreaterThanOrEqual(1);
  });
});

describe("toPlacements · 판정 반례", () => {
  const entry = (name: string, variant: string): SectionEntry => ({ name, variant });

  it("문의 섹션이 앞쪽에만 있으면 inquiry 불충족(R-03)", () => {
    const placements = toPlacements([
      entry("Header", "sticky-right-cta"),
      entry("Hero", "split"),
      entry("Contact", "form"),
      entry("About", "story"),
      entry("Services", "cards-3"),
      entry("FAQ", "accordion"),
      entry("Testimonials", "quotes-2"),
      entry("Footer", "biz-extended"),
    ]);
    expect(ruleIssues(placements, "inquiry")).toHaveLength(1);
    expect(derivedFit(placements)).not.toContain("inquiry");
  });

  it("문의 섹션이 후반 1/3에 있으면 inquiry 충족(양성 대조)", () => {
    const placements = toPlacements([
      entry("Header", "sticky-right-cta"),
      entry("Hero", "split"),
      entry("About", "story"),
      entry("Services", "cards-3"),
      entry("FAQ", "accordion"),
      entry("Testimonials", "quotes-2"),
      entry("Contact", "form"),
      entry("Footer", "biz-extended"),
    ]);
    expect(ruleIssues(placements, "inquiry")).toEqual([]);
  });

  it("예약 아닌 contact 변형만 있으면 booking 불충족(R-04) · contact/booking이면 충족", () => {
    const base = [entry("Header", "sticky-right-cta"), entry("Hero", "split"), entry("About", "story"), entry("Services", "cards-3"), entry("FAQ", "accordion")];
    const formOnly = toPlacements([...base, entry("Contact", "form"), entry("Footer", "biz-extended")]);
    const booking = toPlacements([...base, entry("Contact", "booking"), entry("Footer", "biz-extended")]);
    expect(getSectionDefinition("contact", "booking")?.reservation).toBe(true);
    expect(ruleIssues(formOnly, "booking")).toHaveLength(1);
    expect(ruleIssues(booking, "booking")).toEqual([]);
  });

  it("모르는 이름은 조용히 건너뛰지 않고 실패한다", () => {
    expect(() => toPlacements([entry("Hero", "split"), entry("Gallery", "grid-3")])).toThrow(/Gallery/);
  });
});

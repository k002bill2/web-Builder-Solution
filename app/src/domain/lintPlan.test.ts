/**
 * DS-2A-04c — 구조안 lint (SPEC 4.4 · P-AC-25). R-01·R-02는 엔진 `structureIssues`와 같은 뜻인지 대조한다
 * (테스트만 engine import — 런타임은 engineImportGuard로 0).
 */
import { describe, expect, it } from "vitest";
import { requiredSectionIssues, structureIssues } from "../engine/gate/requiredSections";
import { boardOf, resultsOf } from "../test/compareFixtures";
import type { DesignProfileInput, MotionPreset, Picks, SectionPlanEntry } from "./compareBoard";
import type { LintIssue, PlannedSection } from "./generation";
import { BODY_MAX, BODY_MIN, lateThirdStart, lintPlan, type LintInput } from "./lintPlan";
import { checkProfileContrast } from "./profileContrast";
import { buildProfileDraft } from "./profileDraft";
import type { PaletteEntry, PaletteRole } from "./referenceDetail";
import { SECTION_LIBRARY } from "./sectionLibrary";

const IDS = ["ref-a", "ref-b", "ref-c", "ref-d", "ref-e", "ref-f"];

function baseOf(picks: Picks): DesignProfileInput {
  const draft = buildProfileDraft(boardOf(IDS, picks), resultsOf(IDS), SECTION_LIBRARY.version);
  if (draft.status !== "ready") throw new Error("Hero 선택이 필요합니다");
  return draft.profile;
}

const REF_A = baseOf({ hero: "ref-a" });
const REF_E = baseOf({ hero: "ref-e" });
const REF_B = baseOf({ hero: "ref-b" });

const inputOf = (over: Partial<LintInput> = {}): LintInput => ({ profile: REF_E, purpose: "sales", contrast: "aa", library: SECTION_LIBRARY, ...over });
const s = (type: SectionPlanEntry["type"], variant: string, motion: MotionPreset = "L1"): PlannedSection => ({ type, variant, motion });

/** header · hero · 본문 4 · footer = 본문(hero 포함) 5 — 최소 통과 */
const VALID: readonly PlannedSection[] = [
  s("header", "sticky-right-cta"),
  s("hero", "split"),
  s("about", "story"),
  s("services", "grid-3"),
  s("faq", "accordion"),
  s("contact", "form"),
  s("footer", "biz-extended"),
];

const rules = (issues: readonly LintIssue[]) => issues.map((i) => i.rule);
const ofRules = (issues: readonly LintIssue[], wanted: readonly LintIssue["rule"][]) => issues.filter((i) => wanted.includes(i.rule));
const paletteOf = (profile: DesignProfileInput): PaletteEntry[] =>
  (["primary", "surface", "ink", "muted", "bg"] as const satisfies readonly PaletteRole[]).map((role) => ({ role, hex: profile.color_tokens[role].$value }));

describe("lintPlan — 공유 상수 (엔진과 같은 값)", () => {
  it("본문(hero 포함) 5~9 · 후반 1/3 시작 = n − ⌈n/3⌉", () => {
    expect([BODY_MIN, BODY_MAX]).toEqual([5, 9]);
    expect([6, 7, 9, 12].map(lateThirdStart)).toEqual([4, 4, 6, 8]);
  });
});

describe("lintPlan — R-01·R-02 구조 (엔진 structureIssues와 같은 뜻)", () => {
  const cases: Record<string, readonly PlannedSection[]> = {
    valid: VALID,
    noHeader: VALID.slice(1),
    headerNotFirst: [VALID[1]!, VALID[0]!, ...VALID.slice(2)],
    twoHeaders: [VALID[0]!, ...VALID],
    noFooter: VALID.slice(0, -1),
    footerNotLast: [...VALID.slice(0, -2), VALID.at(-1)!, VALID.at(-2)!],
    twoFooters: [...VALID, VALID.at(-1)!],
    tooFew: [VALID[0]!, VALID[1]!, VALID[2]!, VALID[3]!, VALID.at(-1)!],
    tooMany: [...VALID.slice(0, -1), s("pricing", "tiers-2"), s("statistics", "stats-3"), s("testimonials", "quotes-2"), s("portfolio", "grid-3"), s("cta-band", "banner"), VALID.at(-1)!],
    noHero: [VALID[0]!, ...VALID.slice(2, -1), s("pricing", "tiers-2"), VALID.at(-1)!],
    heroSecond: [VALID[0]!, VALID[2]!, VALID[1]!, ...VALID.slice(3)],
    twoHeroes: [...VALID.slice(0, 2), s("hero", "center"), ...VALID.slice(2)],
  };

  it.each(Object.entries(cases))("%s — 규칙 ID 목록이 엔진과 같다", (_name, sections) => {
    const ours = ofRules(lintPlan(sections, inputOf()), ["R-01", "R-02"]);
    expect(rules(ours)).toEqual(structureIssues(sections).map((i) => i.ruleId));
    expect(ours.every((i) => i.severity === "block")).toBe(true);
  });

  it("본문 5개 미만·9개 초과는 개수와 대체안을 말한다 (규칙 ID는 rule 필드, 문구 = 원인 · 대체안)", () => {
    const [few] = ofRules(lintPlan(cases.tooFew!, inputOf()), ["R-01"]);
    expect(few?.message).toMatch(/본문 섹션이 3개입니다.*5개 이상.* · .*추가/);
    const [many] = ofRules(lintPlan(cases.tooMany!, inputOf()), ["R-01"]);
    expect(many?.message).toMatch(/본문 섹션이 10개입니다.*9개까지.* · .*지우/);
  });

  it("자리 문제는 그 섹션 위치(sectionIndex)를 준다", () => {
    const [moved] = ofRules(lintPlan(cases.heroSecond!, inputOf()), ["R-02"]);
    expect(moved?.sectionIndex).toBe(2);
    const [footer] = ofRules(lintPlan(cases.footerNotLast!, inputOf()), ["R-01"]);
    expect(footer?.sectionIndex).toBe(VALID.length - 2);
  });
});

describe("lintPlan — R-03·R-04 목적 (P-AC-25)", () => {
  it("목적 '정하지 않음' → 정보 한 줄(R-03) '목적을 고르면 필수 섹션을 검사합니다', 다른 R-03·R-04 없음", () => {
    const purposeIssues = ofRules(lintPlan(VALID, inputOf({ purpose: "none" })), ["R-03", "R-04"]);
    expect(purposeIssues).toEqual([{ rule: "R-03", severity: "info", message: "목적을 고르면 필수 섹션을 검사합니다" }]);
  });

  it("예약: 예약 폼(contact/booking)이 없으면 R-04 차단 — 다른 contact 변형으로는 채워지지 않는다(엔진 isReservation)", () => {
    const issues = ofRules(lintPlan(VALID, inputOf({ purpose: "booking" })), ["R-03", "R-04"]);
    expect(rules(issues)).toEqual(["R-04"]);
    expect(issues[0]?.severity).toBe("block");
    expect(issues[0]?.message).toMatch(/예약.* · /);
    const booked = VALID.map((x) => (x.type === "contact" ? s("contact", "booking") : x));
    expect(ofRules(lintPlan(booked, inputOf({ purpose: "booking" })), ["R-03", "R-04"])).toEqual([]);
  });

  it("문의: 후반 1/3에 cta-band·contact가 없으면 R-03 차단, 있으면 없음 — 엔진과 같은 판정", () => {
    const early: readonly PlannedSection[] = [VALID[0]!, VALID[1]!, s("contact", "form"), s("about", "story"), s("services", "grid-3"), s("faq", "accordion"), s("pricing", "tiers-2"), VALID.at(-1)!];
    const late = [...early.slice(0, -1), s("cta-band", "banner"), early.at(-1)!];
    for (const sections of [early, late, VALID]) {
      const ours = rules(ofRules(lintPlan(sections, inputOf({ purpose: "inquiry" })), ["R-03", "R-04"]));
      const engine = requiredSectionIssues(sections, "inquiry").filter((i) => i.ruleId === "R-03" || i.ruleId === "R-04").map((i) => i.ruleId);
      expect(ours).toEqual(engine);
    }
    expect(rules(ofRules(lintPlan(early, inputOf({ purpose: "inquiry" })), ["R-03"]))).toEqual(["R-03"]);
  });

  it("판매는 필수 섹션 검사 없음", () => {
    expect(ofRules(lintPlan(VALID, inputOf({ purpose: "sales" })), ["R-03", "R-04"])).toEqual([]);
  });
});

describe("lintPlan — R-07 모션 L2 ≤ 3 (회귀 방지)", () => {
  it("L2가 4개면 차단, 3개면 없음", () => {
    const three = VALID.map((x, i) => (i >= 1 && i <= 3 ? { ...x, motion: "L2" as const } : x));
    const four = VALID.map((x, i) => (i >= 1 && i <= 4 ? { ...x, motion: "L2" as const } : x));
    expect(ofRules(lintPlan(three, inputOf()), ["R-07"])).toEqual([]);
    const [issue] = ofRules(lintPlan(four, inputOf()), ["R-07"]);
    expect(issue?.severity).toBe("block");
    expect(issue?.message).toMatch(/4개.* · /);
  });
});

describe("lintPlan — R-08 대비 (3.3 검사 · 대비 조정 목표)", () => {
  it("미달 수 N > 0 → '대비 미달 N — 프로필에서 보정' 차단", () => {
    const expected = checkProfileContrast(paletteOf(REF_A), REF_A.component_choices.card_style?.surfaceTone, "aa").filter((c) => !c.pass).length;
    expect(expected).toBe(1);
    expect(ofRules(lintPlan(VALID, inputOf({ profile: REF_A })), ["R-08"])).toEqual([{ rule: "R-08", severity: "block", message: "대비 미달 1 — 프로필에서 보정" }]);
  });

  it("대비 조정 목표를 따른다: 같은 팔레트가 AA는 통과, 강화(7.0)는 미달", () => {
    expect(ofRules(lintPlan(VALID, inputOf({ profile: REF_E, contrast: "aa" })), ["R-08"])).toEqual([]);
    const n = checkProfileContrast(paletteOf(REF_E), REF_E.component_choices.card_style?.surfaceTone, "enhanced").filter((c) => !c.pass).length;
    expect(n).toBeGreaterThan(0);
    expect(ofRules(lintPlan(VALID, inputOf({ profile: REF_E, contrast: "enhanced" })), ["R-08"])[0]?.message).toBe(`대비 미달 ${n} — 프로필에서 보정`);
  });

  it("어두운 카드면 C-3까지 센다(카드 톤 = component_choices.card_style.surfaceTone)", () => {
    const n = checkProfileContrast(paletteOf(REF_B), "dark", "aa").filter((c) => !c.pass).length;
    expect(REF_B.component_choices.card_style?.surfaceTone).toBe("dark");
    expect(ofRules(lintPlan(VALID, inputOf({ profile: REF_B })), ["R-08"])[0]?.message).toBe(`대비 미달 ${n} — 프로필에서 보정`);
  });
});

describe("lintPlan — R-12 Footer 사업자정보", () => {
  const withFooter = (variant: string) => VALID.map((x) => (x.type === "footer" ? s("footer", variant) : x));

  it("사업자정보 없는 Footer · 라이브러리에서 찾을 수 없는 Footer → 차단(footer 위치)", () => {
    for (const variant of ["minimal", "unknown-footer"]) {
      const issues = ofRules(lintPlan(withFooter(variant), inputOf()), ["R-12"]);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ rule: "R-12", severity: "block", sectionIndex: VALID.length - 1 });
      expect(issues[0]?.message).toMatch(/사업자정보.* · /);
    }
  });

  it("사업자정보 있는 Footer는 없음", () => {
    for (const variant of ["biz-extended", "biz-extended-map", "minimal-biz"]) expect(ofRules(lintPlan(withFooter(variant), inputOf()), ["R-12"])).toEqual([]);
  });
});

describe("lintPlan — 출력", () => {
  it("순서 = R-01·R-02 → R-03·R-04 → R-07 → R-08 → R-12, 동결", () => {
    const four = [...VALID.slice(0, 2), s("about", "story"), VALID.at(-1)!].map((x) => ({ ...x, motion: "L2" as const }));
    const bad = four.map((x) => (x.type === "footer" ? s("footer", "minimal", "L2") : x));
    const issues = lintPlan(bad, inputOf({ profile: REF_A, purpose: "booking" }));
    expect(rules(issues)).toEqual(["R-01", "R-04", "R-07", "R-08", "R-12"]);
    expect(Object.isFrozen(issues)).toBe(true);
    expect(issues.every((i) => Object.isFrozen(i))).toBe(true);
  });

  it("같은 입력 → 같은 결과, 입력 불변", () => {
    const copy = structuredClone(VALID);
    expect(lintPlan(VALID, inputOf({ profile: REF_A, purpose: "inquiry" }))).toEqual(lintPlan(copy, inputOf({ profile: REF_A, purpose: "inquiry" })));
    expect(VALID).toEqual(copy);
    expect(Object.isFrozen(VALID[0])).toBe(false);
  });
});

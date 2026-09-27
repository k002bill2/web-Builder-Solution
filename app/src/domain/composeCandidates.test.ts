/**
 * DS-2A-04c — 결정적 구조안 3안 (SPEC 4.1~4.5 · P-AC-21~25·28). 입력 프로필은 보드 초안(buildProfileDraft)으로 만든다.
 * 엔진 대조(structureIssues·requiredSectionIssues)는 테스트만 import — 런타임은 engineImportGuard로 0.
 */
import { describe, expect, it } from "vitest";
import { requiredSectionIssues, structureIssues } from "../engine/gate/requiredSections";
import { boardOf, resultsOf } from "../test/compareFixtures";
import type { DesignProfileInput, Picks, SectionPlanEntry } from "./compareBoard";
import { composeCandidates, type ComposeInput } from "./composeCandidates";
import { effectiveProfile } from "./effectiveProfile";
import { CANDIDATE_IDS, GENERATOR_VERSION, type CandidatePlan, type ComposedResult } from "./generation";
import { lintPlan } from "./lintPlan";
import type { PaletteCorrection } from "./profile";
import { buildProfileDraft } from "./profileDraft";
import type { PurposeId } from "./reference";
import { SECTION_LIBRARY, type SectionLibrary } from "./sectionLibrary";

const IDS = ["ref-a", "ref-b", "ref-c", "ref-d", "ref-e", "ref-f"];

function baseOf(picks: Picks): DesignProfileInput {
  const draft = buildProfileDraft(boardOf(IDS, picks), resultsOf(IDS), SECTION_LIBRARY.version);
  if (draft.status !== "ready") throw new Error("Hero 선택이 필요합니다");
  return draft.profile;
}

/** ref-a: header · hero(fullbleed-left) · about · services(grid-3) · portfolio(masonry) · testimonials · faq · contact(map-form) · footer(biz-extended) · 비율 1.25 */
const REF_A = baseOf({ hero: "ref-a" });
const MUTED_FIX: PaletteCorrection = { role: "muted", from: "#9A7B63", to: "#8E715B", check: "C-5" };
const e = (type: SectionPlanEntry["type"], variant: string): SectionPlanEntry => ({ type, variant });

const inputOf = (over: Partial<ComposeInput> = {}): ComposeInput => ({
  profile: REF_A,
  purpose: "none",
  contrast: "aa",
  library: SECTION_LIBRARY,
  generatorVersion: GENERATOR_VERSION,
  ...over,
});
const withProfile = (over: Partial<DesignProfileInput>, base: DesignProfileInput = REF_A) => ({ ...base, ...over });

function plansOf(results: readonly ComposedResult[]): readonly CandidatePlan[] {
  return results.map((r) => {
    if (r.status !== "succeeded") throw new Error(`${r.id}안 실패: ${r.message}`);
    return r.plan;
  });
}
const compose = (over: Partial<ComposeInput> = {}) => plansOf(composeCandidates(inputOf(over)));
const hashes = (over: Partial<ComposeInput> = {}) => compose(over).map((p) => p.hash);
const isBody = (x: SectionPlanEntry) => x.type !== "header" && x.type !== "footer";
const bodyCount = (plan: CandidatePlan) => plan.sections.filter(isBody).length;

describe("composeCandidates — 모양·결정성 (P-AC-21 · 4.1)", () => {
  it("늘 3개, A·B·C 순서, 해시 8자리", () => {
    const results = composeCandidates(inputOf());
    expect(results.map((r) => r.id)).toEqual([...CANDIDATE_IDS]);
    expect(plansOf(results).every((p) => /^[0-9a-f]{8}$/.test(p.hash))).toBe(true);
  });

  it("같은 입력 2회 → 결과·해시 동일, 세 안의 해시는 서로 다르다", () => {
    expect(composeCandidates(inputOf())).toEqual(composeCandidates(inputOf()));
    expect(new Set(hashes()).size).toBe(3);
  });

  it("P-AC-28: 같은 내용이면 키 순서·undefined 키·복제와 무관하게 같은 해시", () => {
    const reordered = Object.fromEntries(Object.entries(REF_A).reverse()) as unknown as DesignProfileInput;
    expect("$extensions" in REF_A.color_tokens).toBe(false);
    const withUndefined = withProfile({ color_tokens: { ...REF_A.color_tokens, $extensions: undefined } });
    const cloned = JSON.parse(JSON.stringify(REF_A)) as DesignProfileInput;
    for (const profile of [reordered, withUndefined, cloned]) expect(hashes({ profile })).toEqual(hashes());
  });
});

describe("composeCandidates — P-AC-21 입력 하나만 바꿔도 모든 안의 해시가 바뀐다", () => {
  const changes: Record<string, Partial<ComposeInput>> = {
    "목적(구조 변화 없는 판매)": { purpose: "sales" },
    "목적(예약)": { purpose: "booking" },
    "대비 강화": { contrast: "enhanced" },
    "밀도 촘촘(sectionGap)": { profile: effectiveProfile(REF_A, { density: "compact" }) },
    "팔레트 보정": { profile: effectiveProfile(REF_A, { corrections: [MUTED_FIX] }) },
    seed: { profile: withProfile({ seed: "0badc0de" }) },
    "라이브러리 버전": { library: { ...SECTION_LIBRARY, version: "1.5" }, profile: withProfile({ library_version: "1.5" }) },
    "생성기 버전": { generatorVersion: "preview-2" },
  };

  it.each(Object.entries(changes))("%s", (_name, over) => {
    const base = hashes();
    const changed = hashes(over);
    changed.forEach((h, i) => expect(h).not.toBe(base[i]));
  });
});

describe("composeCandidates — P-AC-22 세 축", () => {
  const firstGridVariant = (p: DesignProfileInput) => p.section_plan.find((x) => x.type === "services" || x.type === "portfolio")?.variant;

  it.each(IDS)("Hero %s 프로필: 모든 쌍이 3축 모두 다르고 A 축 = 프로필 값", (hero) => {
    const profile = baseOf({ hero });
    for (const seed of ["00000000", "00000001", "00000004", profile.seed]) {
      const [a, b, c] = compose({ profile: withProfile({ seed }, profile) });
      const grid = firstGridVariant(profile);
      expect(a!.axes).toEqual({
        heroVariant: profile.component_choices.hero?.variant,
        grid: grid === "grid-2" || grid === "masonry" || grid === "grid-3" ? grid : "grid-3",
        typeScale: profile.typography_tokens.scale,
      });
      for (const [x, y] of [[a, b], [a, c], [b, c]] as const) {
        expect(x!.axes.heroVariant).not.toBe(y!.axes.heroVariant);
        expect(x!.axes.grid).not.toBe(y!.axes.grid);
        expect(x!.axes.typeScale).not.toBe(y!.axes.typeScale);
      }
    }
  });

  it("Hero: A를 뺀 키를 사전순으로 놓고 seed % n 위치부터 연속 2개(끝에서 돌아감), 구조안의 hero 변형 = 축", () => {
    // A = fullbleed-left → [center, grid, image, split, text]
    expect(compose({ profile: withProfile({ seed: "00000002" }) }).map((p) => p.axes.heroVariant)).toEqual(["fullbleed-left", "image", "split"]);
    const wrapped = compose({ profile: withProfile({ seed: "00000004" }) });
    expect(wrapped.map((p) => p.axes.heroVariant)).toEqual(["fullbleed-left", "text", "center"]);
    for (const p of wrapped) expect(p.sections.filter((x) => x.type === "hero").map((x) => x.variant)).toEqual([p.axes.heroVariant]);
  });

  it("Hero가 section_plan에 없으면 header 바로 뒤에 넣는다", () => {
    const profile = withProfile({ section_plan: REF_A.section_plan.filter((x) => x.type !== "hero") });
    for (const p of compose({ profile })) expect(p.sections[1]).toMatchObject({ type: "hero", variant: p.axes.heroVariant });
  });

  it("그리드: 첫 services/portfolio 변형에서 A, 나머지는 사다리 순서 · seed 홀수면 B·C 바꿈, 그 섹션에만 적용", () => {
    const even = compose({ profile: withProfile({ seed: "00000002" }) });
    expect(even.map((p) => p.axes.grid)).toEqual(["grid-3", "grid-2", "masonry"]);
    for (const p of even) {
      expect(p.sections.find((x) => x.type === "services")?.variant).toBe(p.axes.grid);
      expect(p.sections.find((x) => x.type === "portfolio")?.variant).toBe("masonry");
    }
    expect(compose({ profile: withProfile({ seed: "00000003" }) }).map((p) => p.axes.grid)).toEqual(["grid-3", "masonry", "grid-2"]);
    const masonryFirst = withProfile({ seed: "00000002", section_plan: [e("header", "transparent"), e("hero", "fullbleed-left"), e("portfolio", "masonry"), e("services", "grid-3"), e("about", "split"), e("contact", "form"), e("footer", "biz-extended")] });
    expect(compose({ profile: masonryFirst }).map((p) => p.axes.grid)).toEqual(["masonry", "grid-3", "grid-2"]);
  });

  it("그리드: 첫 services/portfolio 변형이 사다리 밖이면 A = 3열로 보고 구조안은 그대로", () => {
    const refE = baseOf({ hero: "ref-e" });
    expect(firstGridVariant(refE)).toBe("list");
    const plans = compose({ profile: refE });
    expect(plans.map((p) => p.axes.grid).sort()).toEqual(["grid-2", "grid-3", "masonry"]);
    expect(plans[0]!.axes.grid).toBe("grid-3");
    for (const p of plans) expect(p.sections.filter((x) => x.type === "services" || x.type === "portfolio").map((x) => x.variant)).toEqual(["list", "case-list", "insights-grid-3"]);
  });

  it.each([
    [1.25, [1.2, 1.333]],
    [1.2, [1.25, 1.333]],
    [1.333, [1.25, 1.2]],
    [1.28, [1.25, 1.333]],
    [1.33, [1.333, 1.25]],
  ] as const)("비율 %s → B·C = 사다리에서 A와 다른 가까운 순 %j", (scale, [b, c]) => {
    const profile = withProfile({ typography_tokens: { ...REF_A.typography_tokens, scale } });
    expect(compose({ profile }).map((p) => p.axes.typeScale)).toEqual([scale, b, c]);
  });
});

describe("composeCandidates — P-AC-23 공통 규칙", () => {
  const ALL: readonly (PurposeId | "none")[] = ["none", "booking", "inquiry", "sales"];

  it.each(IDS)("Hero %s × 목적 4종: 엔진 구조 판정 0 · 목적 필수 섹션 충족 · 자기 lint에 R-03/R-04 차단·R-07 없음", (hero) => {
    const profile = baseOf({ hero });
    for (const purpose of ALL) {
      for (const plan of compose({ profile, purpose })) {
        expect(structureIssues(plan.sections)).toEqual([]);
        expect(requiredSectionIssues(plan.sections, purpose).filter((i) => i.ruleId === "R-03" || i.ruleId === "R-04")).toEqual([]);
        expect(plan.lint).toEqual(lintPlan(plan.sections, { profile, purpose, contrast: "aa", library: SECTION_LIBRARY }));
        expect(plan.lint.filter((i) => i.severity === "block" && ["R-03", "R-04", "R-07"].includes(i.rule))).toEqual([]);
      }
    }
  });

  it("예약: 예약 폼(contact/booking)이 없으면 footer 앞에 추가 — 다른 contact(map-form)로는 채워지지 않는다", () => {
    for (const p of compose({ purpose: "booking" })) {
      expect(p.sections.at(-2)).toMatchObject({ type: "contact", variant: "booking" });
      expect(p.sections.some((x) => x.type === "contact" && x.variant === "map-form")).toBe(true);
      expect(p.summary[0]).toBe("목적 '예약' → Contact(예약) 추가 (R-04)");
    }
    const booked = withProfile({ section_plan: REF_A.section_plan.map((x) => (x.type === "contact" ? e("contact", "booking") : x)) });
    for (const p of compose({ profile: booked, purpose: "booking" })) {
      expect(p.sections.filter((x) => x.type === "contact")).toHaveLength(1);
      expect(p.summary[0]).toBe("구조 규칙 모두 충족");
    }
  });

  it("문의: 후반 1/3에 cta-band·contact가 없으면 footer 앞에 cta-band 추가, 있으면 그대로", () => {
    const early = withProfile({ section_plan: [e("header", "transparent"), e("hero", "fullbleed-left"), e("contact", "form"), e("about", "split"), e("services", "grid-3"), e("portfolio", "masonry"), e("faq", "accordion"), e("footer", "biz-extended")] });
    for (const p of compose({ profile: early, purpose: "inquiry" })) {
      expect(p.sections.at(-2)).toMatchObject({ type: "cta-band", variant: "banner" });
      expect(p.summary[0]).toMatch(/^목적 '문의' → .* 추가 \(R-03\)$/);
    }
    for (const p of compose({ purpose: "inquiry" })) expect(p.sections.some((x) => x.type === "cta-band")).toBe(false);
  });

  const LONG: readonly SectionPlanEntry[] = [
    e("header", "sticky-right-cta"), e("hero", "fullbleed-left"), e("about", "split"), e("services", "grid-3"), e("portfolio", "masonry"),
    e("statistics", "stats-3"), e("testimonials", "carousel"), e("pricing", "cards"), e("faq", "accordion"), e("contact", "form"),
    e("about", "text"), e("services", "list"), e("footer", "biz-extended"),
  ];

  it("본문(hero 포함) 9개 초과 → 고정 우선순위 끝(Pricing → FAQ …)에서 제외, 3줄째·전체 로그에 남김", () => {
    for (const p of compose({ profile: withProfile({ section_plan: LONG }) })) {
      expect(bodyCount(p)).toBe(9);
      expect(p.sections.some((x) => x.type === "pricing" || x.type === "faq")).toBe(false);
      expect(p.summary[2]).toBe("Pricing · FAQ 제외 — 본문 9개 상한 (R-01)");
      expect(p.log).toContain("Pricing 제외 — 본문 9개 상한 (R-01)");
      expect(p.log).toContain("FAQ 제외 — 본문 9개 상한 (R-01)");
    }
  });

  it("목적 섹션은 제외하지 않는다: 예약 추가로 10개가 되면 다른 섹션을 뺀다", () => {
    const nine = LONG.filter((x) => x.type !== "pricing" && x.type !== "faq");
    for (const p of compose({ profile: withProfile({ section_plan: nine }), purpose: "booking" })) {
      expect(bodyCount(p)).toBe(9);
      expect(p.sections.some((x) => x.type === "contact" && x.variant === "booking")).toBe(true);
      expect(p.summary[2]).toMatch(/제외 — 본문 9개 상한 \(R-01\)$/);
    }
  });

  it("문의 + 제외: 앞 섹션을 빼서 contact가 후반 1/3 밖으로 밀려나도 R-03을 다시 채운다", () => {
    const sections = [...LONG.slice(0, -1), e("portfolio", "grid-3"), LONG.at(-1)!];
    for (const p of compose({ profile: withProfile({ section_plan: sections }), purpose: "inquiry" })) {
      expect(bodyCount(p)).toBe(9);
      expect(structureIssues(p.sections)).toEqual([]);
      expect(requiredSectionIssues(p.sections, "inquiry").filter((i) => i.ruleId === "R-03")).toEqual([]);
    }
  });

  it("본문 5개 미만은 지어내지 않고 lint R-01 경고만", () => {
    const short = withProfile({ section_plan: [e("header", "transparent"), e("hero", "fullbleed-left"), e("services", "grid-3"), e("contact", "form"), e("footer", "biz-extended")] });
    for (const p of compose({ profile: short })) {
      expect(bodyCount(p)).toBe(3);
      expect(p.lint.filter((i) => i.rule === "R-01")).toHaveLength(1);
      expect(p.lint.find((i) => i.rule === "R-01")?.severity).toBe("block");
    }
  });

  it("모션: L2 → hero + 앞 본문 2개만 L2(≤ 3), 나머지 L1 · L1 → 모두 L1 · L0 → 모두 L0", () => {
    const l2 = compose({ profile: withProfile({ motion_preset: "L2" }) });
    for (const p of l2) expect(p.sections.map((x) => x.motion)).toEqual(["L1", "L2", "L2", "L2", "L1", "L1", "L1", "L1", "L1"]);
    for (const preset of ["L1", "L0"] as const) {
      for (const p of compose({ profile: withProfile({ motion_preset: preset }) })) expect(new Set(p.sections.map((x) => x.motion))).toEqual(new Set([preset]));
    }
  });

  it("Footer 사업자정보 없음 → 확장 변형으로 바꾸고 1줄째에 R-12", () => {
    const profile = baseOf({ hero: "ref-a", footer: "ref-b" });
    expect(profile.section_plan.at(-1)).toEqual({ type: "footer", variant: "minimal" });
    for (const p of compose({ profile })) {
      expect(p.sections.at(-1)).toMatchObject({ type: "footer", variant: "minimal-biz" });
      expect(p.summary[0]).toMatch(/\(R-12\)/);
      expect(p.lint.some((i) => i.rule === "R-12")).toBe(false);
    }
  });

  it("Footer가 없으면 기본 Footer(biz-extended)를 끝에 붙인다", () => {
    const profile = withProfile({ section_plan: REF_A.section_plan.filter((x) => x.type !== "footer") });
    for (const p of compose({ profile })) {
      expect(p.sections.at(-1)).toMatchObject({ type: "footer", variant: "biz-extended" });
      expect(p.summary[0]).toMatch(/Footer.*\(R-01\)/);
    }
  });

  it("바꿀 확장 변형이 없거나 라이브러리에서 찾을 수 없는 Footer → 그대로 두고 lint R-12 차단", () => {
    const noAlt: SectionLibrary = { ...SECTION_LIBRARY, sections: { ...SECTION_LIBRARY.sections, footer: { ...SECTION_LIBRARY.sections.footer, minimal: { label: "미니멀 · 링크만", hasBusinessInfo: false } } } };
    const minimal = baseOf({ hero: "ref-a", footer: "ref-b" });
    const unknown = withProfile({ section_plan: REF_A.section_plan.map((x) => (x.type === "footer" ? e("footer", "custom-foot") : x)) });
    for (const [profile, library, variant] of [[minimal, noAlt, "minimal"], [unknown, SECTION_LIBRARY, "custom-foot"]] as const) {
      for (const p of compose({ profile, library })) {
        expect(p.sections.at(-1)?.variant).toBe(variant);
        expect(p.lint.filter((i) => i.rule === "R-12").map((i) => i.severity)).toEqual(["block"]);
      }
    }
  });
});

describe("composeCandidates — P-AC-24 로그 3줄 · 전체 로그", () => {
  it("정확히 3줄: 적용 규칙 · 축 변경 · 제외 후보 (A = 프로필 값 그대로, B·C = 라이브러리 이름표)", () => {
    const [a, b, c] = compose({ profile: withProfile({ seed: "00000002" }) });
    expect(a!.summary).toEqual(["구조 규칙 모두 충족", "프로필 값 그대로", "제외한 섹션 없음"]);
    expect(b!.summary[1]).toBe("Hero 대형 이미지 + 하단 카피 · 카드 2열 · 비율 1.2 (A와 3축 다름)");
    expect(c!.summary[1]).toBe("Hero 스플릿 · 카드 마소니 · 비율 1.333 (A와 3축 다름)");
    for (const p of [a, b, c]) expect(p!.summary).toHaveLength(3);
  });

  it("전체 로그: 입력 요약(라이브러리·seed·생성기·목적·대비) · 규칙 판정 · 모션 배정 · 해시", () => {
    for (const p of compose({ purpose: "booking", contrast: "enhanced" })) {
      const text = p.log.join("\n");
      expect(text).toMatch(/라이브러리 1\.4/);
      expect(text).toContain(`seed ${REF_A.seed}`);
      expect(text).toContain(`생성기 ${GENERATOR_VERSION}`);
      expect(text).toMatch(/목적 예약/);
      expect(text).toMatch(/대비 강화/);
      expect(text).toContain("목적 '예약' → Contact(예약) 추가 (R-04)");
      expect(text).toMatch(/모션/);
      expect(p.log.at(-1)).toBe(`해시 ${p.hash}`);
    }
  });
});

describe("composeCandidates — 결정적 실패 (4.1 · 4.2 · P-S20)", () => {
  it("라이브러리를 찾지 못하면 3안 모두 UNSUPPORTED_COMBINATION, 재시도 없음", () => {
    const results = composeCandidates(inputOf({ library: undefined }));
    expect(results).toHaveLength(3);
    results.forEach((r, i) => {
      expect(r).toMatchObject({ id: CANDIDATE_IDS[i], status: "failed", errorCode: "UNSUPPORTED_COMBINATION", retryable: false });
      if (r.status === "failed") expect(r.message).toMatch(/^라이브러리 1\.4를 찾을 수 없습니다/);
    });
  });

  const heroLibrary = (keys: readonly string[]): SectionLibrary => ({
    ...SECTION_LIBRARY,
    sections: { ...SECTION_LIBRARY.sections, hero: Object.fromEntries(keys.map((k) => [k, SECTION_LIBRARY.sections.hero[k]!])) },
  });

  it("Hero 변형 2개 → C안만 실패(원인 + 바꿀 곳), 1개 → B·C 실패", () => {
    const two = composeCandidates(inputOf({ library: heroLibrary(["fullbleed-left", "split"]) }));
    expect(two.map((r) => r.status)).toEqual(["succeeded", "succeeded", "failed"]);
    expect(two[1]?.status === "succeeded" && two[1].plan.axes.heroVariant).toBe("split");
    const failed = two[2]!;
    expect(failed).toMatchObject({ id: "C", errorCode: "UNSUPPORTED_COMBINATION", retryable: false });
    if (failed.status === "failed") expect(failed.message).toMatch(/Hero 변형.*2개.* · .+/);
    const one = composeCandidates(inputOf({ library: heroLibrary(["fullbleed-left"]) }));
    expect(one.map((r) => r.status)).toEqual(["succeeded", "failed", "failed"]);
  });
});

describe("composeCandidates — 동결", () => {
  it("출력은 깊게 동결되고 입력 프로필은 동결되지 않는다", () => {
    const results = composeCandidates(inputOf({ purpose: "booking" }));
    const [a] = plansOf(results);
    for (const value of [results, results[0], a, a!.axes, a!.sections, a!.sections[0], a!.summary, a!.log, a!.lint]) expect(Object.isFrozen(value)).toBe(true);
    expect(() => (a!.sections as unknown as SectionPlanEntry[]).push(e("faq", "accordion"))).toThrow(TypeError);
    expect(() => {
      (a!.axes as { grid: string }).grid = "masonry";
    }).toThrow(TypeError);
    expect(Object.isFrozen(REF_A)).toBe(false);
    expect(Object.isFrozen(REF_A.section_plan)).toBe(false);
    expect(Object.isFrozen(REF_A.section_plan[0])).toBe(false);
    const failed = composeCandidates(inputOf({ library: undefined }));
    expect(failed.every((r) => Object.isFrozen(r))).toBe(true);
  });
});

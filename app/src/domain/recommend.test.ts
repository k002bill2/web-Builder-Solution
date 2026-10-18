import { describe, expect, it } from "vitest";
import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { referenceFixtures } from "../fixtures/references";
import {
  RECO_ITEMS,
  RECO_LIMIT,
  RECO_REASON_COUNT,
  RECO_WEIGHTS,
  hasRecoBrief,
  parseRecoBrief,
  recommend,
  type RecoBrief,
  type RecoReason,
  type RecoResult,
  type RecoSectionFit,
} from "./recommend";
import { RECO_SECTION_FIT } from "./recommendSectionFit";
import type { DesignReference } from "./reference";

const REFS: readonly DesignReference[] = [...referenceFixtures, ...generatedReferenceFixtures];
const MEDICAL_IDS = ["gen-medical-1", "gen-medical-2", "gen-medical-3", "ref-c"];

const brief = (b: Partial<RecoBrief>): RecoBrief => ({ purpose: [], audience: [], mood: [], ...b });
const T_REC_01 = brief({ industry: "medical", audience: ["family"], purpose: ["booking"] });

function refById(id: string): DesignReference {
  const ref = REFS.find((r) => r.id === id);
  if (!ref) throw new Error(`no ref ${id}`);
  return ref;
}

function reasonOf(result: RecoResult, item: RecoReason["item"]): RecoReason {
  const reason = result.breakdown.find((r) => r.item === item);
  if (!reason) throw new Error(`no reason ${item}`);
  return reason;
}

/** 결정적 셔플 — LCG(Numerical Recipes 상수), Math.random 금지 */
function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function expectSorted(results: readonly RecoResult[]) {
  for (let i = 1; i < results.length; i += 1) {
    const prev = results[i - 1]!;
    const cur = results[i]!;
    expect(prev.total).toBeGreaterThanOrEqual(cur.total);
    if (prev.total === cur.total) expect(prev.referenceId < cur.referenceId).toBe(true);
  }
}

describe("parseRecoBrief · hasRecoBrief", () => {
  it("카탈로그 필터 → 정규화(중복 제거 + 코드 단위 정렬 · concept → mood · 동결)", () => {
    const parsed = parseRecoBrief({
      industry: "medical",
      purpose: ["inquiry", "booking", "inquiry"],
      audience: ["family", "b2b", "family"],
      concept: ["warm", "bold", "warm"],
    });
    expect(parsed).toEqual({ industry: "medical", purpose: ["booking", "inquiry"], audience: ["b2b", "family"], mood: ["bold", "warm"] });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.purpose)).toBe(true);
    expect(Object.isFrozen(parsed.audience)).toBe(true);
    expect(Object.isFrozen(parsed.mood)).toBe(true);
  });

  it("없는 필드는 빈 배열 · 업종 없으면 키도 없다 · 입력 불변", () => {
    const filters = { purpose: ["sales", "booking"] as const };
    const parsed = parseRecoBrief({ purpose: [...filters.purpose] });
    expect(parsed).toEqual({ purpose: ["booking", "sales"], audience: [], mood: [] });
    expect("industry" in parsed).toBe(false);
    expect(filters.purpose).toEqual(["sales", "booking"]);
  });

  it("업종 또는 목적이 있어야 계산한다(타깃·무드만은 근거 부족)", () => {
    expect(hasRecoBrief(brief({ industry: "medical" }))).toBe(true);
    expect(hasRecoBrief(brief({ purpose: ["sales"] }))).toBe(true);
    expect(hasRecoBrief(brief({ audience: ["family"], mood: ["warm"] }))).toBe(false);
    expect(hasRecoBrief(brief({}))).toBe(false);
  });
});

describe("recommend — 순위 (RECO-AC-01 · T-REC-01)", () => {
  it("T-REC-01 병·의원·family·예약 → 정확히 5개 · 총점 내림차순 · 동점 id 순 (실측 고정)", () => {
    const results = recommend(T_REC_01, REFS, RECO_SECTION_FIT);
    expect(results).toHaveLength(RECO_LIMIT);
    expectSorted(results);
    // 업종 불일치도 제외하지 않는다(RECO-SPEC 1.2) — 예약·family·섹션 충족 후보(45)가 섹션 불충족 ref-c(40)·문의 전용 gen-medical-2(30)보다 앞
    expect(results.map((r) => [r.referenceId, r.total])).toEqual([
      ["gen-medical-1", 60],
      ["gen-medical-3", 60],
      ["gen-beauty-3", 45],
      ["gen-education-4", 45],
      ["ref-c", 40],
    ]);
    expect(results.every((r) => r.max === 70)).toBe(true);
    for (const r of results) {
      expect(r.total).toBe(r.breakdown.reduce((sum, b) => sum + b.points, 0));
    }
  });

  it("후보가 많아도 최대 RECO_LIMIT", () => {
    expect(recommend(brief({ purpose: ["booking"] }), REFS, RECO_SECTION_FIT)).toHaveLength(RECO_LIMIT);
  });

  it("총점 0 후보는 반환하지 않는다", () => {
    expect(recommend(brief({ industry: "retail" }), REFS, RECO_SECTION_FIT)).toEqual([]);
    const medicalOnly = recommend(brief({ industry: "medical" }), REFS, RECO_SECTION_FIT);
    expect(medicalOnly.map((r) => r.referenceId)).toEqual(MEDICAL_IDS);
  });

  it("업종·목적 둘 다 없으면 계산하지 않는다 → 동결 빈 배열", () => {
    const results = recommend(brief({ audience: ["family"], mood: ["trust"] }), REFS, RECO_SECTION_FIT);
    expect(results).toEqual([]);
    expect(Object.isFrozen(results)).toBe(true);
  });
});

describe("recommend — 동점·결정성 (RECO-AC-02 · AC-03 · T-REC-02)", () => {
  it("동점은 id 코드 단위 오름차순(로캘 아님)", () => {
    expect(recommend(brief({ industry: "medical" }), REFS, RECO_SECTION_FIT).map((r) => [r.referenceId, r.total])).toEqual([
      ["gen-medical-1", 15],
      ["gen-medical-2", 15],
      ["gen-medical-3", 15],
      ["ref-c", 15],
    ]);
    const ref = refById("ref-c");
    const upper = { ...ref, id: "Z-ref" };
    const lower = { ...ref, id: "a-ref" };
    // 코드 단위: "Z"(0x5A) < "a"(0x61) — localeCompare면 a가 앞
    const ids = recommend(brief({ industry: "medical" }), [lower, upper], {}).map((r) => r.referenceId);
    expect(ids).toEqual(["Z-ref", "a-ref"]);
  });

  it("입력 배열 순서를 10회 섞어도 결과가 깊은 동일", () => {
    const briefs = [T_REC_01, brief({ industry: "medical" }), brief({ purpose: ["booking", "inquiry"], mood: ["trust", "warm"] })];
    for (const b of briefs) {
      const base = recommend(b, REFS, RECO_SECTION_FIT);
      expectSorted(base);
      for (let seed = 1; seed <= 10; seed += 1) {
        expect(recommend(b, seededShuffle(REFS, seed), RECO_SECTION_FIT)).toEqual(base);
      }
    }
  });

  it("brief 배열 순서·중복이 결과를 바꾸지 않는다", () => {
    const messy = brief({ industry: "medical", purpose: ["inquiry", "booking", "inquiry"], audience: ["family", "family"], mood: ["clean", "trust", "clean"] });
    const clean = brief({ industry: "medical", purpose: ["booking", "inquiry"], audience: ["family"], mood: ["clean", "trust"] });
    expect(recommend(messy, REFS, RECO_SECTION_FIT)).toEqual(recommend(clean, REFS, RECO_SECTION_FIT));
  });

  it("같은 입력 2회 → 깊은 동일 · 결과 전 단계 동결 · 입력 불변", () => {
    const refs = [...REFS];
    const before = JSON.stringify({ T_REC_01, refs, RECO_SECTION_FIT });
    const a = recommend(T_REC_01, refs, RECO_SECTION_FIT);
    const b = recommend(T_REC_01, refs, RECO_SECTION_FIT);
    expect(a).toEqual(b);
    expect(JSON.stringify({ T_REC_01, refs, RECO_SECTION_FIT })).toBe(before);
    expect(refs.map((r) => r.id)).toEqual(REFS.map((r) => r.id));
    expect(Object.isFrozen(a)).toBe(true);
    for (const result of a) {
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.reasons)).toBe(true);
      expect(Object.isFrozen(result.breakdown)).toBe(true);
      for (const reason of [...result.reasons, ...result.breakdown]) {
        expect(Object.isFrozen(reason)).toBe(true);
        expect(Object.isFrozen(reason.matched)).toBe(true);
      }
    }
  });
});

describe("recommend — 근거 (RECO-AC-04 · T-REC-03)", () => {
  it("결과마다 근거 정확히 3개 (점수 내림차순, 항목 순) · breakdown 7항목 항목 순", () => {
    const results = recommend(T_REC_01, REFS, RECO_SECTION_FIT);
    for (const r of results) {
      expect(r.reasons).toHaveLength(RECO_REASON_COUNT);
      expect(r.breakdown.map((b) => b.item)).toEqual(RECO_ITEMS);
      const order = (x: RecoReason) => RECO_ITEMS.indexOf(x.item);
      for (let i = 1; i < r.reasons.length; i += 1) {
        const prev = r.reasons[i - 1]!;
        const cur = r.reasons[i]!;
        expect(prev.points > cur.points || (prev.points === cur.points && order(prev) < order(cur))).toBe(true);
      }
      expect(r.reasons).toEqual(r.reasons.map((x) => r.breakdown.find((b) => b.item === x.item)));
      for (const b of r.breakdown) {
        expect(b.max).toBe(RECO_WEIGHTS[b.item]);
        expect(b.key).toBe(`reco.reason.${b.item}.${b.state}`);
        expect(Number.isInteger(b.points)).toBe(true);
      }
    }
  });

  it("반례: 업종만 입력 + 미측정 생성 후보 → 근거 3개 중 2개는 0점 no-input", () => {
    const [result] = recommend(brief({ industry: "medical" }), [refById("gen-medical-1")], RECO_SECTION_FIT);
    expect(result).toBeDefined();
    expect(result!.reasons.map((r) => [r.item, r.points, r.state])).toEqual([
      ["industry", 15, "match"],
      ["purpose", 0, "no-input"],
      ["mood", 0, "no-input"],
    ]);
    expect(result!.breakdown.map((r) => r.state)).toEqual(["match", "no-input", "no-input", "no-input", "no-input", "unmeasured", "unmeasured"]);
  });

  it("반례: 목적 불일치는 0점 miss로 채운다", () => {
    const [result] = recommend(brief({ industry: "medical", purpose: ["sales"] }), [refById("gen-medical-1")], RECO_SECTION_FIT);
    expect(result!.reasons.map((r) => [r.item, r.points, r.state, r.matched])).toEqual([
      ["industry", 15, "match", ["medical"]],
      ["purpose", 0, "miss", []],
      ["mood", 0, "no-input", []],
    ]);
    expect(reasonOf(result!, "sections").state).toBe("no-input");
  });
});

describe("recommend — 항목 점수", () => {
  const scoreOf = (b: RecoBrief, id: string, fit: RecoSectionFit = RECO_SECTION_FIT) => {
    const [result] = recommend(b, [refById(id)], fit);
    if (!result) throw new Error("no result");
    return result;
  };

  it("purpose — 교집합 있으면 10, matched = 교집합 코드 순", () => {
    const r = reasonOf(scoreOf(brief({ purpose: ["inquiry", "booking"] }), "ref-c"), "purpose");
    expect([r.points, r.state, r.matched]).toEqual([10, "match", ["booking", "inquiry"]]);
  });

  it("mood — 교집합 × 5, 최대 10 · 2개 이상 match · 1개 partial · 0 miss", () => {
    const base = { industry: "medical" as const };
    expect(reasonOf(scoreOf(brief({ ...base, mood: ["trust", "clean", "warm"] }), "ref-c"), "mood")).toMatchObject({ points: 10, state: "match", matched: ["clean", "trust"] });
    expect(reasonOf(scoreOf(brief({ ...base, mood: ["warm", "trust"] }), "ref-c"), "mood")).toMatchObject({ points: 5, state: "partial", matched: ["trust"] });
    expect(reasonOf(scoreOf(brief({ ...base, mood: ["warm"] }), "ref-c"), "mood")).toMatchObject({ points: 0, state: "miss", matched: [] });
  });

  it("audience — 교집합 있으면 15, 없으면 miss", () => {
    expect(reasonOf(scoreOf(brief({ industry: "medical", audience: ["family", "b2b"] }), "ref-c"), "audience")).toMatchObject({ points: 15, state: "match", matched: ["family"] });
    expect(reasonOf(scoreOf(brief({ industry: "medical", audience: ["b2b"] }), "ref-c"), "audience")).toMatchObject({ points: 0, state: "miss", matched: [] });
  });

  it("sections — sales는 k에서 빠진다: [booking, inquiry, sales] k=2, m=1 → partial 10", () => {
    const b = brief({ industry: "medical", purpose: ["booking", "inquiry", "sales"] });
    expect(reasonOf(scoreOf(b, "ref-c", { "ref-c": ["booking"] }), "sections")).toMatchObject({ points: 10, max: 20, state: "partial", matched: ["booking"] });
    expect(reasonOf(scoreOf(b, "ref-c", { "ref-c": ["booking", "inquiry"] }), "sections")).toMatchObject({ points: 20, state: "match", matched: ["booking", "inquiry"] });
    expect(reasonOf(scoreOf(b, "ref-c", { "ref-c": [] }), "sections")).toMatchObject({ points: 0, state: "miss", matched: [] });
    expect(reasonOf(scoreOf(b, "ref-c", {}), "sections")).toMatchObject({ points: 0, state: "miss", matched: [] });
    expect(reasonOf(scoreOf(brief({ industry: "medical", purpose: ["sales"] }), "ref-c", { "ref-c": ["booking"] }), "sections")).toMatchObject({ points: 0, state: "no-input" });
  });
});

describe("recommend — 품질 항목 (RECO-AC-06 · RQ-02 B)", () => {
  it("미측정 후보는 unmeasured · value 키 없음 · 0/0", () => {
    const [result] = recommend(T_REC_01, [refById("gen-medical-1")], RECO_SECTION_FIT);
    for (const item of ["accessibility", "performance"] as const) {
      const r = reasonOf(result!, item);
      expect(r).toMatchObject({ points: 0, max: 0, state: "unmeasured", matched: [], key: `reco.reason.${item}.unmeasured` });
      expect("value" in r).toBe(false);
    }
  });

  it("측정 후보는 value = 픽스처 측정값 · 점수는 0/0(순위 밖)", () => {
    const ref = refById("ref-c");
    if ("status" in ref.scores) throw new Error("ref-c must be measured");
    const [result] = recommend(T_REC_01, [ref], RECO_SECTION_FIT);
    expect(reasonOf(result!, "accessibility")).toMatchObject({ points: 0, max: 0, state: "match", value: ref.scores.accessibility });
    expect(reasonOf(result!, "performance")).toMatchObject({ points: 0, max: 0, state: "match", value: ref.scores.performance });
  });
});

describe("recommend — 후보 집합 (RECO-AC-07 · T-REC-05)", () => {
  it("external_observed 후보는 완전 일치여도 제외된다(대조: internal이면 1위)", () => {
    const perfect = { ...refById("ref-c"), id: "a-perfect", visualTags: ["trust", "clean"] as const };
    const fit: RecoSectionFit = { ...RECO_SECTION_FIT, "a-perfect": ["booking", "inquiry"] };
    const b = brief({ industry: "medical", purpose: ["booking", "inquiry"], audience: ["family"], mood: ["trust", "clean"] });
    const control = recommend(b, [...REFS, { ...perfect, licenseStatus: "internal" }], fit);
    expect(control[0]).toMatchObject({ referenceId: "a-perfect", total: 70 });
    const observed = recommend(b, [...REFS, { ...perfect, licenseStatus: "external_observed" }], fit);
    expect(observed.map((r) => r.referenceId)).not.toContain("a-perfect");
    expect(observed).toHaveLength(RECO_LIMIT);
  });
});

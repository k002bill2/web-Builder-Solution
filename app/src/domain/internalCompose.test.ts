import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createDocFromCandidate } from "../engine/doc/createDocFromCandidate";
import { RENDERED_VARIANTS } from "../features/studio/renderedVariants";
import { generatedReferenceComparisonAttributes, generatedReferenceDetailFixtures } from "../fixtures/generatedReferenceDetails";
import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { referenceFixtures } from "../fixtures/references";
import { hash } from "./hash";
import {
  GENERATED_FIXTURE_FILES,
  composeInternalReferences,
  defaultComposeSpec,
  engineGateOf,
  paletteFailures,
  type ComposeSpec,
  type EngineGate,
} from "./internalCompose";
import { INDUSTRY_SPECS, INTERNAL_GENERATOR_VERSION, INTERNAL_PALETTES, MAX_ATTEMPTS } from "./internalComposeData";
import { generateInternalFixture } from "./internalComposeRun";
import { lintPlan } from "./lintPlan";
import { SECTION_LIBRARY } from "./sectionLibrary";

const VERSION = INTERNAL_GENERATOR_VERSION;
const deps = { createDoc: createDocFromCandidate, renderedVariants: RENDERED_VARIANTS };
const gate = engineGateOf(deps, VERSION);
const spec = () => defaultComposeSpec(referenceFixtures, referenceComparisonAttributes);
const compose = (s: ComposeSpec = spec(), g: EngineGate = gate) => composeInternalReferences(s, VERSION, g);
/** 앱 루트(vitest cwd) 기준 — jsdom 환경의 import.meta.url은 파일 URL이 아니다 */
const fixtureText = (name: string) => readFileSync(join(process.cwd(), "src/fixtures", name), "utf8");
const TARGET_INDUSTRIES = INDUSTRY_SPECS.map((s) => s.industry);

describe("팔레트 표 (SPEC m3p 2.6 ③ — 대비 게이트와 같은 판정)", () => {
  it("표의 팔레트는 모두 흰 버튼 글자·본문·교차 배경·보조 글자 AA를 통과한다", () => {
    expect(INTERNAL_PALETTES.flatMap(paletteFailures)).toEqual([]);
  });

  it("primary가 흰 글자와 AA 미달이면 실패로 잡는다 — surface 기준이 아니라 ON_PRIMARY 기준(Codex r1 P2 반례)", () => {
    expect(paletteFailures({ ...INTERNAL_PALETTES[0]!, id: "pale", primary: "#BBBBBB" })).toEqual([expect.stringMatching(/^pale C-1 /)]);
  });

  it("AA 미달 팔레트는 보정하지 않고 표에서 빼며 리포트에 남긴다", () => {
    const pale = { ...INTERNAL_PALETTES[0]!, id: "pale", primary: "#BBBBBB" };
    const out = compose({ ...spec(), palettes: [pale, ...INTERNAL_PALETTES] });
    expect(out.references.every((r) => r.colorPalette.primary !== "#BBBBBB")).toBe(true);
    expect(out.report).toContainEqual(expect.stringMatching(/^팔레트 제외\(대비 AA\): pale C-1/));
  });
});

describe("composeInternalReferences (M3P-AC-U1~U4)", () => {
  it("U1: 같은 입력 2회 → 깊은 동등·직렬화 바이트 동일, 입력 객체는 바뀌지 않고 출력은 깊게 동결된다", () => {
    const input = spec();
    const before = JSON.stringify(input);
    const a = compose(input);
    const b = compose(input);
    expect(b).toEqual(a);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(JSON.stringify(input)).toBe(before);
    expect(Object.isFrozen(a.references[0]!.colorPalette)).toBe(true);
    expect(Object.isFrozen(a.details[a.references[0]!.id]!.similar.industry)).toBe(true);
  });

  it("U2: 생성 15개(MQ-M3P-2 A) · 대상 5업종 각 기존 포함 4개 · 업종 안 hero(레이아웃) 중복 0 · 출력 상한 24 이하", () => {
    const out = compose();
    expect(out.references).toHaveLength(15);
    expect(out.report.filter((line) => line.includes("모자람"))).toEqual([]);
    const all = [...referenceFixtures, ...out.references];
    for (const industry of TARGET_INDUSTRIES) {
      const layouts = all.filter((r) => r.industry === industry).map((r) => r.layoutType);
      expect(layouts, industry).toHaveLength(4);
      expect(new Set(layouts).size, industry).toBe(4);
    }
    expect(all).toHaveLength(21);
  });

  it("U3: 모든 생성 레퍼런스가 게이트 1~4 통과 — 엔진 문서 생성·실렌더 변형, lint block 0, 대비 AA", () => {
    const out = compose();
    for (const r of out.references) {
      const plan = out.comparisons[r.id]!.sectionPlan;
      expect(gate(plan), r.id).toBeUndefined();
      const lint = lintPlan(plan.map((s) => ({ ...s, motion: "L1" as const })), {
        profile: {
          source_reference_ids: [r.id], visual_direction: "", layout_direction: "",
          color_tokens: Object.fromEntries(out.details[r.id]!.palette.map((p) => [p.role, { $type: "color", $value: p.hex }])) as never,
          typography_tokens: out.details[r.id]!.typography, spacing_tokens: out.details[r.id]!.spacing, motion_preset: "L1",
          component_choices: { card_style: { style: out.comparisons[r.id]!.card.style, surfaceTone: "light" } },
          section_plan: plan, library_version: "", seed: "", selection_mode: "template",
        },
        purpose: r.purpose[0]!, contrast: "aa", library: SECTION_LIBRARY,
      });
      expect(lint.filter((i) => i.severity === "block"), r.id).toEqual([]);
    }
  });

  it("U3: 엔진 게이트가 거부한 후보는 버리고, 시도 상한을 넘으면 모자란 채로 리포트한다(조용히 채우지 않음)", () => {
    const out = compose(spec(), () => "UNKNOWN_VARIANT 시험 거부");
    expect(out.references).toEqual([]);
    expect(out.report).toContainEqual(`education 1번째 모자람 (시도 상한 ${MAX_ATTEMPTS})`);
    expect(out.report).toContainEqual(expect.stringContaining("UNKNOWN_VARIANT 시험 거부"));
  });

  it("U3: 실제 엔진 게이트는 폴백 변형·R-02 위반을 거부한다", () => {
    const plan = generatedReferenceComparisonAttributes[generatedReferenceFixtures[0]!.id]!.sectionPlan;
    expect(gate(plan.map((s) => (s.type === "about" || s.type === "services" ? { ...s, variant: "없는-변형" } : s)))).toMatch(/실렌더 목록 밖/);
    expect(gate([plan[0]!, ...plan.slice(2, -1), plan[1]!, plan.at(-1)!])).toBeDefined();
  });

  it("U4: 정규 키 중복 0 · 기존 6개와 근접 중복(섹션 순서열 + 대표색) 0", () => {
    const out = compose();
    const keys = out.references.map((r) => {
      const a = out.comparisons[r.id]!;
      const bodies = a.sectionPlan.filter((s) => !["header", "footer", "hero"].includes(s.type)).map((s) => `${s.type}/${s.variant}`).sort();
      return [r.industry, r.layoutType, bodies.join(","), r.colorPalette.primary, a.card.style].join("|");
    });
    expect(new Set(keys).size).toBe(keys.length);
    const seq = (id: string, plans: typeof out.comparisons) => plans[id]!.sectionPlan.map((s) => `${s.type}/${s.variant}`).join(">");
    const existing = new Set(referenceFixtures.map((r) => `${seq(r.id, referenceComparisonAttributes)}|${r.colorPalette.primary}`));
    expect(out.references.filter((r) => existing.has(`${seq(r.id, out.comparisons)}|${r.colorPalette.primary}`))).toEqual([]);
  });

  it("생성 레퍼런스는 internal · library_composition · 미측정 · 키 빈 값 · id 순이고 유사 추천은 그룹당 6개 이하", () => {
    const out = compose();
    expect(out.references.map((r) => r.id)).toEqual([...out.references.map((r) => r.id)].sort());
    for (const r of out.references) {
      expect(r).toMatchObject({ licenseStatus: "internal", sourceKind: "library_composition", key: "", scores: { status: "unmeasured" } });
      for (const ids of Object.values(out.details[r.id]!.similar)) expect(ids.length).toBeLessThanOrEqual(6);
    }
  });
});

describe("생성 픽스처 가드 (M3P-AC-G1·G2·G5)", () => {
  it("G1: 커밋된 생성 픽스처 2개 = 생성기 재실행 결과(바이트 완전 일치)", () => {
    const { files } = generateInternalFixture(deps);
    for (const name of GENERATED_FIXTURE_FILES) expect(fixtureText(name), name).toBe(files[name]);
  });

  it("G1: 모듈로 읽은 생성 픽스처 = 생성기 출력", () => {
    const out = compose();
    expect(generatedReferenceFixtures).toEqual(out.references);
    expect(generatedReferenceDetailFixtures).toEqual(out.details);
    expect(generatedReferenceComparisonAttributes).toEqual(out.comparisons);
  });

  it("G2: 생성 픽스처에 URL·스크립트·이벤트 속성·href·APFS 0", () => {
    // 값(데이터) 전체 — TS 타입 표기(Readonly<…>)는 데이터가 아니므로 값 직렬화로 본다
    const data = JSON.stringify([generatedReferenceFixtures, generatedReferenceDetailFixtures, generatedReferenceComparisonAttributes]);
    for (const pattern of [/https?:/i, /\/\//, /<script/i, /\bon[a-z]+=/i, /href/i, /apfs/i, /data:/i, /</]) expect(data, String(pattern)).not.toMatch(pattern);
    // 파일 텍스트(주석 포함)에도 URL·APFS 0
    for (const name of GENERATED_FIXTURE_FILES) for (const pattern of [/https?:/i, /<script/i, /apfs/i]) expect(fixtureText(name), `${name} ${pattern}`).not.toMatch(pattern);
  });

  it("G5: 기존 6개 픽스처 3벌 바이트 변경 0 (db9f25e 해시)", () => {
    expect(hash(fixtureText("references.ts"))).toBe("bea53875");
    expect(hash(fixtureText("referenceDetails.ts"))).toBe("574fbca2");
    expect(hash(fixtureText("referenceComparisons.ts"))).toBe("4c0ffbaf");
  });
});

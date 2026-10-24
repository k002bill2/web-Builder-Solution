import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { kitVars } from "../../../kit/tokens";
import { SAMPLE_KIT_TOKENS } from "../../../render/testing/sampleKitTokens";
import { designTokensJson, sectionsJson } from "./sampleJson";

describe("design-tokens.json 직렬화 (SMP-AC-A02·A03)", () => {
  const doc = sampleDoc();

  it("A02 — 같은 입력 2회 = 같은 문자열 · 2칸 들여쓰기 · 끝 개행 · cssVars = kitVars()", () => {
    const a = designTokensJson(SAMPLE_KIT_TOKENS, doc);
    expect(designTokensJson(SAMPLE_KIT_TOKENS, doc)).toBe(a);
    expect(a.endsWith("}\n")).toBe(true);
    expect(a.split("\n")[1]).toMatch(/^ {2}"\$schema": "design-sample\/tokens@0",$/);
    const parsed = JSON.parse(a);
    expect(parsed.cssVars).toEqual(kitVars(SAMPLE_KIT_TOKENS));
    expect(parsed.source).toEqual({ kind: "internal", profileVersion: doc.profileVersion, candidateId: doc.candidateId, generatorVersion: doc.generatorVersion, libraryVersion: doc.libraryVersion });
    expect(Object.keys(parsed)).toEqual(["$schema", "source", "color", "font", "typeScale", "space", "radius", "card", "media", "motion", "cssVars"]);
    expect(parsed.motion.preset).toEqual(doc.sections.map((s) => s.motion));
  });

  it("A03 — px 단위 0", () => {
    expect(designTokensJson(SAMPLE_KIT_TOKENS, sampleDoc())).not.toMatch(/\d\s*px\b/);
  });
});

describe("sections.json 직렬화 (SMP-AC-A04)", () => {
  it("순서·type·variant·tone·motion만 — 슬롯 값·instanceId 0", () => {
    const doc = sampleDoc();
    const text = sectionsJson(doc);
    const parsed = JSON.parse(text);
    expect(parsed.$schema).toBe("design-sample/sections@0");
    expect(parsed.sections).toEqual(doc.sections.map((s, i) => ({ order: i + 1, type: s.type, variant: s.variant, tone: s.tone, motion: s.motion })));
    expect(text).not.toMatch(/instanceId|slots/);
    doc.sections.forEach((s) => expect(text).not.toContain(`"${s.instanceId}"`));
    expect(text.endsWith("\n")).toBe(true);
  });
});

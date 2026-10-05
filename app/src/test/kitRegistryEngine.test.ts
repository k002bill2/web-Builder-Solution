import { sampleDoc, withSections } from "../engine/testing/sampleDoc";
import { SECTION_DEFINITIONS } from "../engine/sections/registry";
import { CANVAS_CAPTIONS, canvasCaption } from "../features/studio/canvasCaption";
import { RENDERED_VARIANTS } from "../features/studio/renderedVariants";
import { KIT_REGISTRY, kitFor } from "../kit/registry";
import { drawDoc } from "../render/testing/drawKit";

/**
 * 30/30 (M2B-2c · M2B-2 브리프 6절) — 부모 목록이 엔진 정의에서 파생(★A)되므로 "부모 = 엔진"은 구조상 참이다.
 * 뜻 있는 대조: 킷 레지스트리 = 엔진 SECTION_DEFINITIONS 정확 집합 · 모르는 쌍(no-such-variant)은 목록 밖 + 폴백 경로 유지.
 */
describe("KIT_REGISTRY = 엔진 SECTION_DEFINITIONS (30/30)", () => {
  it("정확 집합 30쌍 · 엔진 정의 중복 0 · 킷 레지스트리 중복 0", () => {
    const engine = SECTION_DEFINITIONS.map((d) => `${d.type}/${d.variant}`);
    expect(engine).toHaveLength(30);
    expect(new Set(engine).size).toBe(30);
    expect(Object.keys(KIT_REGISTRY)).toHaveLength(30);
    expect(Object.keys(KIT_REGISTRY).sort()).toEqual([...engine].sort());
  });

  it("unknown 방어: no-such-variant → 부모 목록 밖 · kitFor undefined · 렌더 문서 폴백(표식 1) · 캔버스 캡션 '일부'", () => {
    expect(RENDERED_VARIANTS).not.toContain("cta-band/no-such-variant");
    expect(RENDERED_VARIANTS.some((key) => key.endsWith("/no-such-variant"))).toBe(false);
    const unknown = { ...sampleDoc().sections.find((s) => s.type === "cta-band")!, variant: "no-such-variant" };
    expect(kitFor(unknown)).toBeUndefined();
    const doc = withSections(sampleDoc(), sampleDoc().sections.map((s) => (s.instanceId === unknown.instanceId ? unknown : s)));
    const c = drawDoc(doc);
    expect(c.querySelectorAll('[data-fallback="true"]')).toHaveLength(1);
    expect(c.querySelector('[data-fallback="true"]')!.closest("[data-instance-id]")).toHaveAttribute("data-instance-id", "s-cta");
    expect(canvasCaption(doc, true)).toBe(CANVAS_CAPTIONS.partial(8, 1));
    expect(canvasCaption(sampleDoc(), true)).toBe(CANVAS_CAPTIONS.f1);
  });
});

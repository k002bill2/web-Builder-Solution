import type { SectionMotion, SectionType } from "../engine/contracts/pageDoc";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc } from "./testing/drawKit";

/**
 * 렌더 data-motion (M2B-4b · SPEC-MOTION-FONT 1.3·1.4 · MF-AC-U1) — 섹션 루트 실효 레벨 = min(section.motion, maxMotion), L0 = 속성 없음.
 * 첫 화면 = main 문서 순서상 첫 hero + 그 뒤 본문 2자리(faq·contact·폴백도 자리는 차지하고 속성 0) · hero가 없으면 main 첫 2자리 · hero 앞 본문 = 0.
 * header = 위치와 무관 min(motion, L1) · footer = 0. 사이트 루트 data-motion-play = 0(정적 HTML 생성기만 붙인다).
 */
type Row = readonly [type: SectionType, variant: string, motion: SectionMotion];
/** no-such-variant = 킷·엔진에 없는 변형(폴백 자리) — 슬롯은 cards-3 기본값을 빌린다(렌더 경로 전용, drawKit withUnknownCta와 같은 방식) */
const docOf = (rows: readonly Row[]) =>
  withSections(sampleDoc(), rows.map(([type, variant, motion], i) => ({ ...section(type, variant === "no-such-variant" ? "cards-3" : variant, `m${i}`, { motion }), variant })));
const motions = (rows: readonly Row[]) => {
  const site = drawDoc(docOf(rows)).querySelector("[data-site-root]")!;
  return { site, levels: rows.map((_, i) => site.querySelector(`#s-m${i}`)?.getAttribute("data-motion") ?? null) };
};

describe("렌더 data-motion (MF-AC-U1)", () => {
  it("L2 문서: header L1 · hero L2 · hero 뒤 본문 2개 = min(motion, maxMotion) · 3번째 이후 0 · footer 0 · 사이트 루트 data-motion-play 0", () => {
    const { site, levels } = motions([
      ["header", "sticky-right-cta", "L2"],
      ["hero", "split", "L2"],
      ["services", "cards-3", "L2"],
      ["portfolio", "grid-3", "L2"],
      ["statistics", "stats-3", "L2"],
      ["cta-band", "banner", "L2"],
      ["footer", "minimal", "L2"],
    ]);
    expect(levels).toEqual(["L1", "L2", "L2", "L2", null, null, null]);
    expect(site.hasAttribute("data-motion-play")).toBe(false);
    expect(site.ownerDocument.querySelectorAll("[data-motion-play]")).toHaveLength(0);
  });

  it("faq·contact 가 첫 화면 자리에 와도 속성 0 — 자리는 차지한다(그 뒤 본문 = 첫 화면 밖)", () => {
    const { levels } = motions([
      ["hero", "center", "L2"],
      ["faq", "accordion", "L2"],
      ["contact", "form", "L2"],
      ["services", "cards-3", "L2"],
    ]);
    expect(levels).toEqual(["L2", null, null, null]);
    expect(motions([["hero", "text", "L1"], ["contact", "booking", "L1"], ["about", "story", "L1"]]).levels).toEqual(["L1", null, "L1"]);
  });

  it("L0 프리셋 = 속성 0 · L1 프리셋 = header·hero·본문 2개 L1", () => {
    const rows = (motion: SectionMotion): Row[] => [
      ["header", "sticky-hamburger", motion],
      ["hero", "fullbleed-left", motion],
      ["about", "story", motion],
      ["services", "cards-2", motion],
      ["pricing", "tiers-2", motion],
      ["footer", "biz-extended", motion],
    ];
    expect(motions(rows("L0")).levels).toEqual([null, null, null, null, null, null]);
    expect(motions(rows("L1")).levels).toEqual(["L1", "L1", "L1", "L1", null, null]);
  });

  it("경계: hero 없음 = main 첫 2자리 · hero 앞 본문 = 0 · 폴백(킷 없음) 섹션 = 속성 0이지만 자리 차지", () => {
    expect(motions([["about", "story", "L2"], ["services", "list", "L2"], ["portfolio", "masonry", "L2"]]).levels).toEqual(["L2", "L1", null]);
    expect(motions([["about", "text", "L2"], ["hero", "image", "L2"], ["services", "cards-3", "L2"], ["portfolio", "grid-2", "L2"]]).levels).toEqual([null, "L2", "L2", "L2"]);
    const { site, levels } = motions([["hero", "grid", "L2"], ["services", "no-such-variant", "L2"], ["statistics", "stats-3", "L2"], ["about", "story", "L2"]]);
    expect(site.querySelectorAll("[data-fallback]").length).toBeGreaterThan(0);
    expect(levels).toEqual(["L2", null, "L2", null]);
    expect(site.querySelector("[data-fallback] [data-motion], [data-fallback][data-motion]")).toBeNull();
  });

  it("maxMotion 상한: about/text·services/list·testimonials·pricing(L1) 의 L2 = L1 · header L2 = L1 · footer 상한 L0", () => {
    expect(motions([["hero", "split", "L2"], ["about", "text", "L2"], ["testimonials", "quotes-2", "L2"]]).levels).toEqual(["L2", "L1", "L1"]);
    expect(motions([["header", "transparent", "L2"], ["hero", "split", "L1"], ["pricing", "tiers-2", "L2"], ["services", "list", "L2"], ["footer", "minimal-biz", "L2"]]).levels).toEqual(["L1", "L1", "L1", "L1", null]);
  });
});

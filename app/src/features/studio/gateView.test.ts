import { section } from "../../engine/testing/sampleDoc";
import { passingDoc } from "../../engine/testing/gateKit";
import { runGate } from "../../engine/gate/runGate";
import { sampleTheme } from "../../engine/testing/sampleTheme";
import { fallbackReason, gateBlockReason, gateHeadText, gateRowWord } from "./gateView";

describe("게이트·내보내기 문장 (SPEC 5.12 · 5.13 · m2a 3.2 A)", () => {
  it("구조 미리보기 이유 — 이름 3개까지 + '외 k개' · 0개면 없음", () => {
    const four = [section("portfolio", "masonry", "a"), section("testimonials", "quotes-2", "b"), section("cta-band", "banner", "c"), section("portfolio", "masonry", "d")];
    expect(fallbackReason(four)).toBe("구조 미리보기 섹션 4개(Portfolio · Testimonials · CTA Band 외 1개)가 있어 내보낼 수 없습니다 — 실제 렌더가 있는 변형으로 바꾸거나 지우면 열립니다");
    expect(fallbackReason(four.slice(0, 2))).toBe("구조 미리보기 섹션 2개(Portfolio · Testimonials)가 있어 내보낼 수 없습니다 — 실제 렌더가 있는 변형으로 바꾸거나 지우면 열립니다");
    expect(fallbackReason([])).toBeUndefined();
  });

  it("게이트 차단 이유 — '차단 {n}건({첫 줄 이름}: {원인}) — 고치면 열립니다' · 통과면 없음 · 머리 Tag · 상태 단어", () => {
    const blocked = runGate(passingDoc({ meta: { title: "브랜드 홈", description: "" } }), sampleTheme());
    expect(gateBlockReason(blocked)).toBe("차단 1건(SEO 메타: 설명 없음) — 고치면 열립니다");
    expect(gateHeadText({ block: 1, warn: 1 })).toBe("차단 1 · 경고 1");
    expect(gateHeadText({ block: 0, warn: 2 })).toBe("경고 2");
    expect(gateHeadText({ block: 0, warn: 0 })).toBe("통과");
    expect(blocked.rows.map(gateRowWord)).toEqual(["통과", "통과", "통과", "통과", "통과", "차단 1", "통과", "측정 전"]);
    expect(gateBlockReason(runGate(passingDoc(), sampleTheme()))).toBeUndefined();
  });
});

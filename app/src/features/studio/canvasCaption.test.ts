import { sampleDoc, section, withSections } from "../../engine/testing/sampleDoc";
import { kitFor } from "../../kit/registry";
import { withUnknownCta } from "../../render/testing/drawKit";
import { CANVAS_CAPTIONS, canvasCaption } from "./canvasCaption";

/** 캔버스 캡션 등급 3상태 (m2a 3.4 · K-AC-33) — 실렌더 판정 = 렌더러 있는 변형 키 목록(RENDERED_VARIANTS, 킷 레지스트리 가드 대조) */
describe("canvasCaption (3.4)", () => {
  it("문구 = 3.4 표 그대로 · '시안' 단어 0", () => {
    expect(CANVAS_CAPTIONS.f0).toBe("구조 미리보기 (F0) — 섹션 구성과 실제 문구만 보여 줍니다. 실제 모양으로 그린 섹션은 아직 없습니다.");
    expect(CANVAS_CAPTIONS.partial(9, 2)).toBe("실제 렌더 (F1 · 일부) — 섹션 9개 중 2개는 아직 구조 미리보기입니다. 이 섹션이 있으면 HTML·zip으로 내보낼 수 없습니다.");
    expect(CANVAS_CAPTIONS.f1).toBe("실제 렌더 (F1) — 프로필의 색·글자로 그린 페이지입니다. 이미지는 고른 이미지 또는 자체 그래픽이고, 글꼴·모션은 아직 기본 설정입니다.");
    for (const text of [CANVAS_CAPTIONS.f0, CANVAS_CAPTIONS.partial(9, 2), CANVAS_CAPTIONS.f1]) expect(text).not.toContain("시안");
  });

  // M2B-2c 이관: cta-band/banner가 실렌더(30/30) → 렌더러 없는 예시를 같은 자리의 no-such-variant로 옮긴다 — 단언 그대로
  it("일부 실렌더: sampleDoc(cta-band 자리만 렌더러 없음 — no-such-variant) → 섹션 8개 중 1개", () => {
    const doc = withUnknownCta(sampleDoc());
    expect(kitFor(doc.sections.find((s) => s.type === "cta-band")!)).toBeUndefined(); // 예시 전제
    expect(canvasCaption(doc, true)).toBe(CANVAS_CAPTIONS.partial(8, 1));
  });

  it("모두 실렌더: 렌더러 있는 변형만 → F1 · 모두 폴백: 렌더러 없는 변형만 → F0", () => {
    const doc = sampleDoc();
    expect(canvasCaption(withSections(doc, doc.sections.filter((s) => s.type !== "cta-band")), true)).toBe(CANVAS_CAPTIONS.f1);
    const unrendered = [{ ...section("hero", "split", "s-hero"), variant: "no-such-variant" }, { ...section("cta-band", "banner", "s-cta"), variant: "no-such-variant" }];
    for (const s of unrendered) expect(kitFor(s)).toBeUndefined(); // 예시 전제 — M2b가 변형을 늘려도 렌더러 없는 쌍이어야 F0 판정이 뜻을 가짐
    expect(canvasCaption(withSections(doc, unrendered), true)).toBe(CANVAS_CAPTIONS.f0);
  });

  it("킷 토큰 없음(프로필 조회 전·실패) → 렌더 문서가 전부 폴백으로 그리므로 F0", () => {
    expect(canvasCaption(sampleDoc(), false)).toBe(CANVAS_CAPTIONS.f0);
  });
});

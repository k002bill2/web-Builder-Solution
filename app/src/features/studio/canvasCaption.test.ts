import type { ImageSlotValue, SectionInstance } from "../../engine/contracts/pageDoc";
import { sampleDoc, section, withSections } from "../../engine/testing/sampleDoc";
import { kitFor } from "../../kit/registry";
import { withUnknownCta } from "../../render/testing/drawKit";
import { CANVAS_CAPTIONS, canvasCaption } from "./canvasCaption";

/** 캔버스 캡션 등급 3상태 (m2a 3.4 · K-AC-33) — 실렌더 판정 = 렌더러 있는 변형 키 목록(RENDERED_VARIANTS, 킷 레지스트리 가드 대조) */
describe("canvasCaption (3.4)", () => {
  it("문구 = 3.4 표 + F2(MQ-C8 ★A) · '시안'은 F2만", () => {
    expect(CANVAS_CAPTIONS.f0).toBe("구조 미리보기 (F0) — 섹션 구성과 실제 문구만 보여 줍니다. 실제 모양으로 그린 섹션은 아직 없습니다.");
    expect(CANVAS_CAPTIONS.partial(9, 2)).toBe("실제 렌더 (F1 · 일부) — 섹션 9개 중 2개는 아직 구조 미리보기입니다. 이 섹션이 있으면 HTML·zip으로 내보낼 수 없습니다.");
    // 모두 실렌더 = F2(M2c · MQ-C8 ★A — 키 이름 f1은 기존 참조 유지). "시안"은 F2만, "최종"은 붙이지 않는다(F3 게이트·발행 전)
    expect(CANVAS_CAPTIONS.f1).toBe("시안 (F2) — 프로필의 색·글자·글꼴·모션과 고른 이미지 또는 자체 그래픽으로 그린 페이지입니다.");
    for (const text of [CANVAS_CAPTIONS.f0, CANVAS_CAPTIONS.partial(9, 2)]) expect(text).not.toContain("시안");
    expect(CANVAS_CAPTIONS.f1).not.toContain("최종");
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

  it("F2 + 잃은 이미지(켜진 로컬 id가 images 맵에 없음) → 끝에 ' 다시 골라야 하는 이미지 N장은 자체 그래픽으로 보입니다.' · 있는 id·꺼진 슬롯 제외 · 구조 미리보기 섹션 있으면 안 붙음", () => {
    const [A, B, C] = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333"];
    const doc = sampleDoc();
    const use = (s: SectionInstance, key: string, id: string, enabled = true): SectionInstance => ({ ...s, slots: { ...s.slots, [key]: { ...(s.slots[key] as ImageSlotValue), source: id as ImageSlotValue["source"], enabled } } });
    const rendered = doc.sections.filter((s) => s.type !== "cta-band");
    const withIds = withSections(doc, rendered.map((s) => (s.type === "hero" ? use(s, "image", A) : s.type === "about" ? use(s, "image", B) : s)));
    const image = { blob: new Blob(["x"]), width: 10, height: 10 };
    expect(canvasCaption(withIds, true, { [A]: image })).toBe(`${CANVAS_CAPTIONS.f1} 다시 골라야 하는 이미지 1장은 자체 그래픽으로 보입니다.`);
    expect(canvasCaption(withIds, true)).toBe(`${CANVAS_CAPTIONS.f1} 다시 골라야 하는 이미지 2장은 자체 그래픽으로 보입니다.`);
    expect(canvasCaption(withIds, true, { [A]: image, [B]: image })).toBe(CANVAS_CAPTIONS.f1);
    const off = withSections(doc, rendered.map((s) => (s.type === "about" ? use(s, "image", C, false) : s)));
    expect(canvasCaption(off, true)).toBe(CANVAS_CAPTIONS.f1);
    expect(canvasCaption(withSections(withIds, [...withIds.sections, ...withUnknownCta(doc).sections.filter((s) => s.type === "cta-band")]), true)).toBe(CANVAS_CAPTIONS.partial(8, 1));
  });
});

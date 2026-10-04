import { describe, expect, it } from "vitest";
import { section } from "../../engine/testing/sampleDoc";
import { getSectionDefinition } from "../../engine/sections/registry";
import { slotIssue } from "./canvasIssues";

/** 캔버스 문제(5.7 · r4.13 (3)) — 빈 필수 글자 슬롯도 "차단" 문제(섹션 사각형 기준). 판정은 게이트 R-13과 같다(없는 키 = 빈 값 · 공백만 = 빈 값) */
describe("slotIssue — 빈 필수 칸 (r4.13 (3) · MQ-4)", () => {
  const hero = section("hero", "fullbleed-left", "s-hero");
  const entry = (key: string) => getSectionDefinition("hero", "fullbleed-left")!.slots.find((e) => e.key === key)!;

  it("빈 값 · 공백만 · 없는 키 → block · 문장 = 이름표 + 게이트 빈 필수 문장 · 섹션 사각형 · id 규칙 그대로", () => {
    const withoutCta = Object.fromEntries(Object.entries(hero.slots).filter(([key]) => key !== "cta"));
    for (const slots of [{ ...hero.slots, cta: "" }, { ...hero.slots, cta: "   " }, withoutCta]) {
      expect(slotIssue({ ...hero, slots }, entry("cta"))).toEqual({ id: "canvas-issue-s-hero-cta", level: "block", text: "버튼 문구 — 필수 입력입니다", onSection: true });
    }
  });

  it("필수 아닌 빈 칸 · 채운 필수 칸 → 문제 없음 · 글자 수 문제는 슬롯 사각형(onSection 없음)", () => {
    const optional = getSectionDefinition("hero", "fullbleed-left")!.slots.find((e) => e.kind !== "image" && !e.required)!;
    expect(slotIssue({ ...hero, slots: { ...hero.slots, [optional.key]: "" } }, optional)).toBeUndefined();
    expect(slotIssue(hero, entry("cta"))).toBeUndefined();
    expect(slotIssue({ ...hero, slots: { ...hero.slots, title: "가".repeat(30) } }, entry("title"))).toEqual({ id: "canvas-issue-s-hero-title", level: "warn", text: "제목이 권장 28자를 넘었습니다 (30/28자)" });
  });
});

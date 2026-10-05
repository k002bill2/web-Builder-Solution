import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc } from "../render/testing/drawKit";

/** pricing/tiers-2 (M2B-2c · SPEC-BODY B1-10) — 동등한 요금제 카드 2개. 두 카드 계산 스타일 동등·2열/1열 실측(KD-AC-18 [B])은 P-B */
const pricingDoc = (slots: Readonly<Record<string, string>> = {}, tone: "base" | "alt" = "base") =>
  withSections(
    sampleDoc(),
    sampleDoc().sections.map((s) => {
      if (s.instanceId !== "s-services") return s;
      const base = section("pricing", "tiers-2", "s-pricing", { tone });
      return { ...base, slots: { ...base.slots, ...slots } };
    }),
  );
const pricing = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="pricing/tiers-2"]')!;
const css = () => readFileSync("src/kit/kit.css", "utf8");
const cssSection = (marker: string) => {
  const at = css().indexOf(marker);
  expect(at, marker).toBeGreaterThan(-1);
  return css().slice(at, css().indexOf("\n}\n", at));
};

describe("pricing/tiers-2 (B1-10)", () => {
  it("KD-AC-18 · KD-AC-08 [U]: 킷 · 머리(h2 + 소개) → ul[role=list] > li 2 · li 안 순서 이름 h3 → 가격 p → 설명 p · 두 카드 class·속성 같음 · 추천 표식·버튼·링크 0", () => {
    const s = pricing(drawDoc(pricingDoc({ intro: "소개", plan1Price: "문의", plan2Price: "99,000" })));
    expect(s).toHaveAttribute("data-kit");
    expect(s.getAttribute("aria-labelledby")).toBe("h-s-pricing");
    expect(s.querySelector("h2")).toHaveAttribute("id", "h-s-pricing");
    expect(s.querySelectorAll("h2")).toHaveLength(1);
    expect(s.querySelector('[data-slot="intro"]')).not.toBeNull();
    const list = s.querySelector("ul")!;
    expect(list).toHaveAttribute("role", "list");
    const items = [...list.children];
    expect(items).toHaveLength(2);
    items.forEach((li, i) => {
      const n = i + 1;
      expect(li).toHaveAttribute("data-surface", "card");
      expect([...li.children].map((el) => `${el.tagName}:${el.getAttribute("data-slot")}`)).toEqual([`H3:plan${n}Name`, `P:plan${n}Price`, `P:plan${n}Body`]);
    });
    const shape = (li: Element) => [...li.querySelectorAll("*")].map((el) => `${el.tagName}.${el.className}`);
    expect(items[0]!.className).toBe(items[1]!.className);
    expect(shape(items[0]!)).toEqual(shape(items[1]!));
    expect(s.querySelectorAll("h3")).toHaveLength(2);
    expect(s.querySelectorAll("a, button, [tabindex], img, svg, mark, strong, em")).toHaveLength(0);
    expect(s.textContent).not.toMatch(/추천|인기|BEST/i);
  });

  it("KD-AC-18 · KD-AC-03 [U]: 가격·이름·설명 글자 = 슬롯 그대로 — 통화·단위·'부터' 붙이기 0 · 기본 '문의' 그대로 · 상한 20·20·120자", () => {
    const texts = { heading: "가".repeat(40), intro: "나".repeat(160), plan1Name: "w".repeat(20), plan2Name: "기본", plan1Price: "문의", plan2Price: "99,000", plan1Body: "다".repeat(120), plan2Body: "포함 내용" };
    const s = pricing(drawDoc(pricingDoc(texts)));
    for (const [key, text] of Object.entries(texts)) expect(s.querySelector(`[data-slot="${key}"]`)!.textContent).toBe(text);
    expect(pricing(drawDoc(pricingDoc())).querySelector('[data-slot="plan1Price"]')!.textContent).toBe("문의");
    const long = pricing(drawDoc(pricingDoc({ plan1Price: "월 정액 문의 바랍니다" })));
    expect(long.querySelector('[data-slot="plan1Price"]')!.textContent).toBe("월 정액 문의 바랍니다");
  });

  it("KD-AC-04 [U]: intro·planNBody 빈 값 → 요소 0 · planNName·planNPrice 빈 값 → 그 요소만 0, 카드 2개 유지 · 빈 p·h3·li 0", () => {
    const s = pricing(drawDoc(pricingDoc({ intro: "", plan1Body: " ", plan2Name: "", plan2Price: "" })));
    expect(s.querySelector('[data-slot="intro"]')).toBeNull();
    const items = [...s.querySelectorAll("li")];
    expect(items).toHaveLength(2);
    expect([...items[0]!.children].map((el) => el.getAttribute("data-slot"))).toEqual(["plan1Name", "plan1Price"]);
    expect([...items[1]!.children].map((el) => el.getAttribute("data-slot"))).toEqual(["plan2Body"]);
    expect([...s.querySelectorAll("p, h3, li, h2")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });

  it("KD-AC-18 · 05 · 07 [G]: 카드 면·2열 재사용 · 가격 ink · 제목 굵기 · tabular-nums · t2(lg t3) · 이름 ↔ 가격 s2 · 가격 ↔ 설명 s3 · primary 글자·값별 선택자·재배치 0", () => {
    const block = cssSection("/* pricing/tiers-2");
    expect(block).toMatch(/\.kit-plan \{[^}]*gap: var\(--site-s2\);/);
    expect(block).toMatch(/\.kit-plan-price \{[^}]*margin: 0;[^}]*font-size: var\(--site-t2\);[^}]*font-weight: var\(--site-weight-heading\);[^}]*line-height: 1\.25;[^}]*font-variant-numeric: tabular-nums;[^}]*color: var\(--site-ink\);/);
    expect(block).toMatch(/\.kit-plan-price \+ \.kit-card-body \{[^}]*margin-top: calc\(var\(--site-s3\) - var\(--site-s2\)\);/);
    expect(block).toMatch(/@media \(width >= 64rem\) \{\s*\.kit-plan-price \{\s*font-size: var\(--site-t3\);/);
    expect(block).not.toMatch(/data-layout|\border\s*:|-reverse|grid-area|grid-row|nowrap|text-overflow|--site-primary|--site-muted|nth-child|:first-child|:last-child|content:/);
  });
});

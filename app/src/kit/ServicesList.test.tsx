import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc } from "../render/testing/drawKit";

/** services/list (M2B-2a · SPEC-BODY B1-2) — [U] 마크업·나누기·CSS 규칙. 1280 2단 · 768 2열 · 390 1열 실측(KD-AC-10 [B])은 P-B */
const listDoc = (slots: Readonly<Record<string, string>> = {}, tone: "base" | "alt" = "alt") =>
  withSections(
    sampleDoc(),
    sampleDoc().sections.map((s) => {
      if (s.instanceId !== "s-services") return s;
      const base = section("services", "list", "s-services", { tone });
      return { ...base, slots: { ...base.slots, ...slots } };
    }),
  );
const list = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="services/list"]')!;
const items = (s: HTMLElement) => [...s.querySelectorAll("li")].map((li) => li.textContent!.replace(/\s+/g, " ").trim());
const css = () => readFileSync("src/kit/kit.css", "utf8");
const block = (selector: string, from = 0) => {
  const at = css().indexOf(`${selector} {`, from);
  expect(at, selector).toBeGreaterThan(-1);
  return css().slice(at, css().indexOf("}", at));
};

describe("services/list (B1-2)", () => {
  it("구조 [U]: section aria-labelledby = h2 · 머리(제목·소개) → ul[role=list] > li(기본 3개, 순서 유지) · h3 0 · 링크·포커스 0", () => {
    const s = list(drawDoc(listDoc()));
    expect(s).toHaveAttribute("data-kit");
    expect(s.getAttribute("aria-labelledby")).toBe("h-s-services");
    expect(s.querySelector("h2")).toHaveAttribute("id", "h-s-services");
    expect(s.querySelector('[data-slot="intro"]')!.tagName).toBe("P");
    const ul = s.querySelector("ul")!;
    expect(ul).toHaveAttribute("role", "list");
    expect(items(s)).toEqual(["서비스 1", "서비스 2", "서비스 3"]);
    expect(s.querySelectorAll("h3, a, button, [tabindex]")).toHaveLength(0);
  });

  it('KD-AC-10 [U]: " 상담 ·· 진료 · \\n 검사 " → li 3개(상담·진료·검사)', () => {
    expect(items(list(drawDoc(listDoc({ items: " 상담 ·· 진료 · \n 검사 " }))))).toEqual(["상담", "진료", "검사"]);
  });

  it('KD-AC-10 [U]: " 상담 ·· 진료 \\n 검사 " → li 2개("상담"·"진료 검사" — 줄바꿈은 구분자 아님, 공백 접힘 white-space normal)', () => {
    const s = list(drawDoc(listDoc({ items: " 상담 ·· 진료 \n 검사 " })));
    expect(items(s)).toEqual(["상담", "진료 검사"]);
    // 입력 = 출력(KD-AC-03): 킷은 조각 글자를 바꾸지 않고, 접힘은 CSS(white-space normal — pre-line 0)가 한다
    expect(s.querySelectorAll("li")[1]!.textContent).toBe("진료 \n 검사");
    expect(block(".kit-list-item")).not.toMatch(/white-space:\s*pre/);
  });

  it("KD-AC-04 [U]: 조각 0(빈 값·가운뎃점뿐) → ul 0 · 소개 빈 값 → 소개 0 · 빈 p·li 0", () => {
    for (const value of ["", " · ·· "]) {
      const s = list(drawDoc(listDoc({ items: value, intro: " " })));
      expect(s.querySelector("ul")).toBeNull();
      expect(s.querySelector('[data-slot="intro"]')).toBeNull();
      expect([...s.querySelectorAll("p, li, h2")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
    }
  });

  it("KD-AC-03 [U]: 상한 글자(제목 40 · 소개 160 · 항목 400) — 조각의 합 = 원문 조각 · 한 조각 400자 = 항목 1개", () => {
    const texts = { heading: "가".repeat(40), intro: "나".repeat(160), items: "다".repeat(400) };
    const s = list(drawDoc(listDoc(texts)));
    expect(s.querySelector('[data-slot="heading"]')!.textContent).toBe(texts.heading);
    expect(s.querySelector('[data-slot="intro"]')!.textContent).toBe(texts.intro);
    expect(items(s)).toEqual([texts.items]);
    const many = Array.from({ length: 20 }, (_, i) => `항목${i + 1}`);
    expect(items(list(drawDoc(listDoc({ items: many.join(" · ") }))))).toEqual(many);
  });

  it("KD-AC-10 · 토큰 [U]: lg 이상 머리 5 : 목록 7(같은 행) · md~lg 목록 column-count 2 + 항목 break-inside avoid · md 미만 1열 · 항목 ink 제목 굵기 · 구분선 muted 장식 · 소개 --kit-soft", () => {
    const at = css().indexOf("/* services/list");
    expect(at).toBeGreaterThan(-1);
    const section = css().slice(at, css().indexOf("\n}\n", at));
    expect(section).toMatch(/@media \(width >= 64rem\) \{\s*\.kit-list-grid \{\s*display: grid;\s*grid-template-columns: 5fr 7fr;/);
    expect(section).toMatch(/@media \(48rem <= width < 64rem\) \{\s*\.kit-list \{\s*columns: 2;/);
    const item = block(".kit-list-item", at);
    expect(item).toContain("break-inside: avoid");
    expect(item).toContain("color: var(--site-ink)");
    expect(item).toContain("font-weight: var(--site-weight-heading)");
    expect(item).toContain("border-top: var(--site-stroke-1) solid var(--site-muted)");
    expect(block(".kit-list", at)).toContain("border-bottom: var(--site-stroke-1) solid var(--site-muted)");
    expect(block(".kit-services-intro")).toContain("color: var(--kit-soft)");
    expect(section).not.toMatch(/\border\s*:|-reverse|grid-area|grid-row/);
  });
});

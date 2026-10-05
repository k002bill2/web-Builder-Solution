import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc } from "../render/testing/drawKit";

/** statistics/stats-3 (M2B-2b · SPEC-BODY B1-8) — 수치 → 설명 목록. 12자 수치 한 줄 · 3칸/세로 실측(KD-AC-16 [B])은 P-B */
const statsDoc = (slots: Readonly<Record<string, string>> = {}, tone: "base" | "alt" = "base") =>
  withSections(
    sampleDoc(),
    sampleDoc().sections.map((s) => {
      if (s.instanceId !== "s-services") return s;
      const base = section("statistics", "stats-3", "s-stats", { tone });
      return { ...base, slots: { ...base.slots, ...slots } };
    }),
  );
const stats = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="statistics/stats-3"]')!;
const css = () => readFileSync("src/kit/kit.css", "utf8");
const cssSection = (marker: string) => {
  const at = css().indexOf(marker);
  expect(at, marker).toBeGreaterThan(-1);
  return css().slice(at, css().indexOf("\n}\n", at));
};

describe("statistics/stats-3 (B1-8)", () => {
  it("KD-AC-16 · KD-AC-08 [U]: 킷 · h2 1 · ul[role=list] > li 3(번호 순서) · li 안 순서 수치 → 설명(p) · dl·dt·dd·h3 0 · 포커스 0", () => {
    const s = stats(drawDoc(statsDoc()));
    expect(s).toHaveAttribute("data-kit");
    expect(s.getAttribute("aria-labelledby")).toBe("h-s-stats");
    expect(s.querySelector("h2")).toHaveAttribute("id", "h-s-stats");
    expect(s.querySelectorAll("h2")).toHaveLength(1);
    expect(s.querySelectorAll("h3, dl, dt, dd")).toHaveLength(0);
    const list = s.querySelector("ul")!;
    expect(list).toHaveAttribute("role", "list");
    expect(list).toHaveClass("kit-stats");
    const items = [...list.children];
    expect(items).toHaveLength(3);
    items.forEach((li, i) => {
      expect([...li.children].map((el) => `${el.tagName}:${el.getAttribute("data-slot")}`)).toEqual([`P:stat${i + 1}Value`, `P:stat${i + 1}Label`]);
      expect(li.firstElementChild).toHaveClass("kit-stat-value");
      expect(li.lastElementChild).toHaveClass("kit-stat-label");
    });
    expect(s.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
  });

  it("KD-AC-16 · KD-AC-03 [U]: 수치 글자 = 슬롯 그대로(서식·변환 0) — 12자 시험 문자열 '1,234,567,89' · '24시간' · ' 100+ ' · 설명 상한 30자", () => {
    const texts = { heading: "가".repeat(40), stat1Value: "1,234,567,89", stat2Value: "24시간", stat3Value: " 100+ ", stat1Label: "나".repeat(30), stat2Label: "w".repeat(30), stat3Label: "설명" };
    const s = stats(drawDoc(statsDoc(texts)));
    for (const [key, text] of Object.entries(texts)) expect(s.querySelector(`[data-slot="${key}"]`)!.textContent).toBe(text);
  });

  it("KD-AC-16 · KD-AC-04 [U]: statNValue 빈 값 → 그 li 0(남은 칸 순서 유지) · statNLabel 빈 값 → 설명만 0 · 수치 전부 빈 값 → ul 0 · 빈 p·li 0", () => {
    const s = stats(drawDoc(statsDoc({ stat2Value: " ", stat3Label: "" })));
    const items = [...s.querySelectorAll("li")];
    expect(items.map((li) => li.firstElementChild!.getAttribute("data-slot"))).toEqual(["stat1Value", "stat3Value"]);
    expect(items[1]!.querySelector('[data-slot="stat3Label"]')).toBeNull();
    expect(s.querySelector('[data-slot="stat2Label"]')).toBeNull();
    const none = stats(drawDoc(statsDoc({ stat1Value: "", stat2Value: "", stat3Value: "" })));
    expect(none.querySelectorAll("ul, li")).toHaveLength(0);
    expect(none.querySelector("h2")).not.toBeNull();
    expect([...s.querySelectorAll("p, li, h2")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });

  it("KD-AC-16 · 05 · 07 [U]: 1열 기본(칸 위 구분선) · md 이상 3칸 고정 트랙 + 칸 사이 세로 구분선 · 수치 t2(lg t3) 제목 굵기 · 줄 높이 명시 · tabular-nums · ink · 설명 --kit-soft · primary 글자 0 · nowrap·재배치 0", () => {
    const block = cssSection("/* statistics/stats-3");
    expect(block).toMatch(/\.kit-stat-value \{[^}]*font-size: var\(--site-t2\);[^}]*font-weight: var\(--site-weight-heading\);[^}]*line-height: 1\.25;[^}]*font-variant-numeric: tabular-nums;[^}]*color: var\(--site-ink\);/);
    expect(block).toMatch(/\.kit-stat-label \{[^}]*color: var\(--kit-soft\);/);
    expect(block).toMatch(/@media \(width >= 48rem\) \{\s*\.kit-stats \{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
    expect(block).toMatch(/@media \(width >= 64rem\) \{\s*\.kit-stat-value \{\s*font-size: var\(--site-t3\);/);
    expect(block).not.toMatch(/data-layout|\border\s*:|-reverse|grid-area|grid-row|nowrap|text-overflow|--site-primary|nth-child|auto-fit/);
  });
});

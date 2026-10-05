import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc, patch } from "../render/testing/drawKit";

/** about/text (M2B-2a · SPEC-BODY B1-1) — about/story 이미지 꺼짐과 같은 마크업(AboutStory 재사용). [B] 3폭 1단·prose-max 실측은 P-B */
const textDoc = (over = {}) =>
  withSections(
    sampleDoc(),
    sampleDoc().sections.map((s) => (s.instanceId === "s-about" ? section("about", "text", "s-about", over) : s)),
  );
const about = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section^="about/"]')!;
const css = () => readFileSync("src/kit/kit.css", "utf8");

describe("about/text (B1-1)", () => {
  it("KD-AC-09 [U]: 킷으로 그린다 · figure·img 0 · data-layout single · about/story 이미지 꺼짐 문서와 data-section만 다르고 마크업 같음", () => {
    const text = about(drawDoc(textDoc()));
    expect(text).toHaveAttribute("data-kit");
    expect(text.dataset.section).toBe("about/text");
    expect(text.querySelectorAll("figure, img")).toHaveLength(0);
    expect(text).toHaveAttribute("data-layout", "single");
    const story = about(drawDoc(patch(sampleDoc(), "s-about", { image: { ...(sampleDoc().sections[2]!.slots.image as object), enabled: false } as never })));
    expect(story.dataset.section).toBe("about/story");
    const strip = (el: HTMLElement) => el.outerHTML.replace(/ data-section="[^"]*"/, "");
    expect(strip(text)).toBe(strip(story));
  });

  it("KD-AC-09 [U]: 글 묶음 최대 폭 = prose-max(1단 선택자) · 본문 줄바꿈 그대로(pre-line) · 가운데 정렬 0", () => {
    expect(css()).toMatch(/\.kit-about\[data-layout="single"\] \.kit-about-text \{\s*max-width: var\(--site-prose-max\);/);
    const block = css().slice(css().indexOf(".kit-about-body {"), css().indexOf("}", css().indexOf(".kit-about-body {")));
    expect(block).toContain("white-space: pre-line");
    expect(css().slice(css().indexOf("/* about/story"), css().indexOf("/* services/cards-3"))).not.toMatch(/text-align:\s*center/);
  });

  it("KD-AC-03 · KD-AC-08 [U]: 상한 글자(제목 40 · 본문 400) 그대로 · h2 1 · h3 0", () => {
    const texts = { heading: "가".repeat(40), body: "나".repeat(200) + "\n" + "다".repeat(199) };
    const s = about(drawDoc(textDoc({ slots: texts })));
    for (const [key, value] of Object.entries(texts)) expect(s.querySelector(`[data-slot="${key}"]`)!.textContent).toBe(value);
    expect(s.querySelectorAll("h2")).toHaveLength(1);
    expect(s.querySelectorAll("h3")).toHaveLength(0);
  });
});

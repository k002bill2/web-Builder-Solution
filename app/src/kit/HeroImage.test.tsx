import { readFileSync } from "node:fs";
import type { ImageSlotValue } from "../engine/contracts/pageDoc";
import { drawDoc, heroDoc, patch } from "../render/testing/drawKit";

/** hero/image (M2B-1a · SPEC-BOUND B-8 · KB-AC-20~22) — [U] 마크업·CSS 규칙. 위아래 위치·비율 실측은 브라우저 */
const ID = "11111111-1111-4111-8111-111111111111";
const hero = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="hero/image"]')!;
const img = (over: Partial<ImageSlotValue> = {}): ImageSlotValue => ({ kind: "image", enabled: true, source: ID as ImageSlotValue["source"], alt: "공간 전경", decorative: false, ...over });
const css = () => readFileSync("src/kit/kit.css", "utf8");

describe("hero/image (B-8)", () => {
  it("킷 등록 · 구조: section 루트 1 · aria-labelledby = h1 id · 톤 면 · 폴백 표식 0", () => {
    const c = drawDoc(heroDoc("image"));
    expect(c.querySelectorAll('[data-section="hero/image"]')).toHaveLength(1);
    const h = hero(c);
    expect(h.querySelector("[data-kit-marker]")).toBeNull();
    expect(h.getAttribute("aria-labelledby")).toBe(h.querySelector("h1")!.id);
    expect(h).toHaveAttribute("data-surface", "surface");
    expect(hero(drawDoc(heroDoc("image", { tone: "base" })))).toHaveAttribute("data-surface", "bg");
    expect(h.querySelector('[data-slot="subtitle"]')).toHaveClass("kit-hx-lead");
  });

  it("KB-AC-20 [U]: DOM에서 h1(카피)이 미디어보다 앞 · 미디어 안 글자 0 · 보이는 순서는 그리드 영역 이름(media 위 · copy 아래)만 — order·절대 위치 0", () => {
    const h = hero(drawDoc(heroDoc("image")));
    const media = h.querySelector("[data-media]")!;
    expect(h.querySelector("h1")!.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(media.textContent).toBe("");
    expect(css()).toMatch(/\.kit-hx--image \{[^}]*grid-template-areas: "media" "copy"/);
    const block = css().slice(css().indexOf("/* hero/image"));
    expect(block).not.toMatch(/\border:|position: absolute/);
  });

  it("KB-AC-21 규칙: 미디어 비율 390 4:3 · md 16:9 · lg 21:9 · 폭 100%", () => {
    const block = css().slice(css().indexOf("/* hero/image"));
    expect(block).toMatch(/\.kit-hx-wide \{[^}]*width: 100%;[^}]*aspect-ratio: 4 \/ 3/);
    expect(block).toMatch(/aspect-ratio: 16 \/ 9/);
    expect(block).toMatch(/aspect-ratio: 21 \/ 9/);
  });

  it("B-8 5: 로컬 이미지 → img(alt · fetchpriority high · 즉시 로드) / 플레이스홀더 → 그라디언트 aria-hidden", () => {
    const h = hero(drawDoc(patch(heroDoc("image"), "s-hero", { image: img() }), { [ID]: "blob:null/abc" }));
    expect(h.querySelectorAll("img")).toHaveLength(1);
    expect(h.querySelector("img")).toHaveAttribute("alt", "공간 전경");
    expect(h.querySelector("img")).toHaveAttribute("fetchpriority", "high");
    expect(h.querySelector("img")).not.toHaveAttribute("loading");
    expect(hero(drawDoc(heroDoc("image"))).querySelector("[data-media]")).toHaveAttribute("aria-hidden", "true");
  });

  it("KB-AC-22: 이미지 끔 → 미디어 요소 0 · 카피 1열(kit-hx--solo)", () => {
    const h = hero(drawDoc(patch(heroDoc("image"), "s-hero", { image: img({ enabled: false }) })));
    expect(h.querySelectorAll("[data-media], img, figure")).toHaveLength(0);
    expect(h).toHaveClass("kit-hx--solo");
  });

  it("0.8 · 상한: 부제 빈 값 → 부제 0 / 제목 40 · 부제 120 · CTA 16 그대로", () => {
    expect(hero(drawDoc(patch(heroDoc("image"), "s-hero", { subtitle: "" }))).querySelector('[data-slot="subtitle"]')).toBeNull();
    const [title, subtitle, cta] = ["가".repeat(40), "나".repeat(120), "다".repeat(16)];
    const f = hero(drawDoc(patch(heroDoc("image"), "s-hero", { title, subtitle, cta })));
    expect(["h1", '[data-slot="subtitle"]', '[data-slot="cta"]'].map((q) => f.querySelector(q)!.textContent)).toEqual([title, subtitle, cta]);
  });
});

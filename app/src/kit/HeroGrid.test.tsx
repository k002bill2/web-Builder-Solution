import { readFileSync } from "node:fs";
import type { ImageSlotValue } from "../engine/contracts/pageDoc";
import { drawDoc, heroDoc, patch } from "../render/testing/drawKit";

/** hero/grid (M2B-1a · SPEC-BOUND B-6 · KB-AC-15~17) — [U] 마크업. 보이는 타일 수·높이 실측은 브라우저(KB-AC-16) */
const ID = "11111111-1111-4111-8111-111111111111";
const hero = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="hero/grid"]')!;
const img = (over: Partial<ImageSlotValue> = {}): ImageSlotValue => ({ kind: "image", enabled: true, source: ID as ImageSlotValue["source"], alt: "매장 내부", decorative: false, ...over });

describe("hero/grid (B-6)", () => {
  it("킷 등록 · 구조: section 루트 1 · aria-labelledby = h1 id · 카피(h1 → 부제 → CTA) → 타일 격자 · 톤 면(alt surface · base bg) · 폴백 표식 0", () => {
    const c = drawDoc(heroDoc("grid"));
    expect(c.querySelectorAll('[data-section="hero/grid"]')).toHaveLength(1);
    const h = hero(c);
    expect(h.querySelector("[data-kit-marker]")).toBeNull();
    const h1 = h.querySelector("h1")!;
    expect(h.getAttribute("aria-labelledby")).toBe(h1.id);
    expect(h1.compareDocumentPosition(h.querySelector(".kit-hx-tiles")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(h).toHaveAttribute("data-surface", "surface");
    expect(hero(drawDoc(heroDoc("grid", { tone: "base" })))).toHaveAttribute("data-surface", "bg");
    expect(h.querySelector('[data-slot="subtitle"]')).toHaveClass("kit-hx-lead");
  });

  it("KB-AC-15: 사용자 이미지 → img 정확히 1(alt 1회 · fetchpriority high) · 타일 B·C aria-hidden · 타일 안 글자 0", () => {
    const h = hero(drawDoc(patch(heroDoc("grid"), "s-hero", { image: img() }), { [ID]: "blob:null/abc" }));
    expect(h.querySelectorAll("img")).toHaveLength(1);
    expect(h.querySelector("img")).toHaveAttribute("alt", "매장 내부");
    expect(h.querySelector("img")).toHaveAttribute("fetchpriority", "high");
    const tiles = [...h.querySelectorAll(".kit-hx-tiles > *")];
    expect(tiles).toHaveLength(3);
    for (const t of tiles.slice(1)) expect(t).toHaveAttribute("aria-hidden", "true");
    for (const t of tiles) expect(t.textContent).toBe("");
  });

  it("KB-AC-15: 플레이스홀더 → img 0 · 자체 그래픽 타일 1(aria-hidden · SPEC m2c 4절)", () => {
    const h = hero(drawDoc(heroDoc("grid")));
    expect(h.querySelectorAll("img")).toHaveLength(0);
    expect(h.querySelectorAll('[data-media="art"]')).toHaveLength(1);
    expect(h.querySelector('[data-media="art"]')).toHaveAttribute("aria-hidden", "true");
  });

  it("KB-AC-17: 이미지 끔 → 타일 격자 요소 0 · 카피 1열(kit-hx--solo)", () => {
    const h = hero(drawDoc(patch(heroDoc("grid"), "s-hero", { image: img({ enabled: false }) })));
    expect(h.querySelectorAll(".kit-hx-tiles, .kit-hx-tile, [data-media], img")).toHaveLength(0);
    expect(h).toHaveClass("kit-hx--solo");
  });

  it("KB-AC-16 규칙: md 미만 B·C display none · md 이상 B·C 보임 · A 2행 · lg 이상 카피 5 : 타일 7", () => {
    const css = readFileSync("src/kit/kit.css", "utf8");
    expect(css).toMatch(/\.kit-hx-tile--b \{[^}]*display: none/);
    expect(css).toMatch(/\.kit-hx-tile--a \{[^}]*grid-row: span 2/);
    expect(css).toMatch(/grid-template-columns: 5fr 7fr/);
  });
});

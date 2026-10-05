import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import type { ImageSlotValue, SectionInstance, SectionType } from "../engine/contracts/pageDoc";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { PageDocument } from "../render/PageDocument";
import { drawDoc } from "../render/testing/drawKit";
import { SAMPLE_KIT_TOKENS } from "../render/testing/sampleKitTokens";
import { artSeed, artShapes } from "./art";

/**
 * 자체 그래픽 — 토큰 기반 결정적 SVG (SPEC m2c 4절 · MQ-C6 ★A) · 이미지 맞춤(3절) · 내보내기 즉시 로드(5.3).
 * 빈 이미지 슬롯(플레이스홀더·잃은 이미지)마다 SVG 1장 — 입력 = (patternId, type, variant, slotKey) · instanceId·시각·난수 0.
 */
const ID = "33333333-3333-4333-8333-333333333333";
/** 이미지 슬롯이 있는 변형 전부(SPEC m2c 0절 표) */
const IMAGE_VARIANTS: ReadonlyArray<readonly [SectionType, string]> = [
  ["hero", "fullbleed-left"],
  ["hero", "split"],
  ["hero", "grid"],
  ["hero", "image"],
  ["about", "story"],
  ["portfolio", "grid-3"],
  ["portfolio", "grid-2"],
  ["portfolio", "masonry"],
  ["footer", "biz-extended-map"],
];
const imageSlots = (s: SectionInstance) => Object.keys(s.slots).filter((k) => typeof s.slots[k] === "object");
const setImages = (s: SectionInstance, value: (old: ImageSlotValue) => ImageSlotValue): SectionInstance => ({
  ...s,
  slots: Object.fromEntries(Object.entries(s.slots).map(([k, v]) => [k, typeof v === "object" ? value(v) : v])),
});
const only = (...sections: SectionInstance[]) => withSections(sampleDoc(), sections);
const arts = (c: HTMLElement) => [...c.querySelectorAll<SVGSVGElement>(".kit-art svg")];

describe("자체 그래픽 결정성 (IMG-AC-19)", () => {
  it("같은 입력 2회 렌더 → 마크업 바이트 동일 · instanceId만 다른 두 섹션 → 동일 · 이미지 슬롯 있는 변형 전부 빈 슬롯 = SVG", () => {
    for (const [type, variant] of IMAGE_VARIANTS) {
      const a = section(type, variant, "s-a");
      const first = arts(drawDoc(only(a))).map((svg) => svg.outerHTML);
      expect(first.length, `${type}/${variant}`).toBe(imageSlots(a).length);
      expect(arts(drawDoc(only(a))).map((svg) => svg.outerHTML)).toEqual(first);
      expect(arts(drawDoc(only(section(type, variant, "s-b")))).map((svg) => svg.outerHTML)).toEqual(first);
    }
  });

  it("시드 = (patternId, type, variant, slotKey) — 같은 시드 같은 도형 · 도형 3계열이 모두 쓰인다 · 도형 ≤ 12 · 좌표 소수 1자리", () => {
    expect(artSeed("diagonal", "hero", "image", "image")).toBe(artSeed("diagonal", "hero", "image", "image"));
    expect(artShapes(artSeed("diagonal", "hero", "image", "image"))).toEqual(artShapes(artSeed("diagonal", "hero", "image", "image")));
    const all = IMAGE_VARIANTS.flatMap(([type, variant]) => imageSlots(section(type, variant, "s")).map((slot) => artShapes(artSeed("diagonal", type, variant, slot))));
    const families = new Set([...all, ...["a", "b", "c", "d", "e", "f", "g", "h"].map((p) => artShapes(artSeed(p, "hero", "image", "image")))].map((art) => art.family));
    expect([...families].sort()).toEqual(["circles", "diagonal", "dots"]);
    for (const art of all) {
      expect(art.shapes.length).toBeLessThanOrEqual(12);
      for (const shape of art.shapes) for (const value of Object.values(shape.attrs)) for (const n of value.split(/[ ,]/)) expect(n).toMatch(/^-?\d+(\.\d)?$/);
    }
  });

  it("잃은 이미지(로컬 id인데 URL 없음) = 플레이스홀더 기본 무늬와 같은 그림 — 로컬 id는 시드에 넣지 않는다", () => {
    const lost = setImages(section("about", "story", "s-about"), (v) => ({ ...v, source: ID as ImageSlotValue["source"] }));
    expect(arts(drawDoc(only(lost))).map((svg) => svg.outerHTML)).toEqual(arts(drawDoc(only(section("about", "story", "s-about")))).map((svg) => svg.outerHTML));
  });
});

describe("자체 그래픽 접근성·가드 (IMG-AC-20)", () => {
  it("svg aria-hidden=true · focusable=false · viewBox 0 0 100 100 slice · 글자·title 0 · href·image·use·url() 0 · 색 속성(fill·stroke·style) 0 — class kit-art-*만", () => {
    for (const [type, variant] of IMAGE_VARIANTS) {
      for (const svg of arts(drawDoc(only(section(type, variant, "s-a"))))) {
        expect(svg).toHaveAttribute("aria-hidden", "true");
        expect(svg).toHaveAttribute("focusable", "false");
        expect(svg).toHaveAttribute("viewBox", "0 0 100 100");
        expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");
        expect(svg.closest("[data-media]")).toHaveAttribute("aria-hidden", "true");
        expect(svg.closest("[data-media]")).toHaveAttribute("data-media", "art");
        expect(svg.textContent).toBe("");
        expect(svg.querySelectorAll("title, text, image, use, a, defs, style")).toHaveLength(0);
        expect(svg.outerHTML).not.toMatch(/href|url\(|fill=|stroke=|style=|#[0-9a-f]{3,8}\b/i);
        const classes = [...svg.querySelectorAll("*")].map((el) => el.getAttribute("class"));
        expect(classes.every((c) => /^kit-art-(bg|[123])$/.test(c ?? ""))).toBe(true);
        expect(svg.firstElementChild).toHaveAttribute("class", "kit-art-bg");
      }
    }
  });

  it("kit.css: kit-art-* 칠 = --site-* 토큰만(hex 0) · 바깥 칸 크기는 그대로(svg는 칸을 채움)", () => {
    const css = readFileSync("src/kit/kit.css", "utf8");
    for (const cls of ["kit-art-bg", "kit-art-1", "kit-art-2", "kit-art-3"]) expect(css).toMatch(new RegExp(`\\.${cls} \\{\\s*fill: var\\(--site-[a-z-]+\\);`));
    expect(css).toMatch(/\.kit-art > svg \{[^}]*width: 100%;[^}]*height: 100%;/);
    expect(css).not.toMatch(/kit-gradient/);
  });
});

describe("스위치 꺼짐 = 미디어 요소 0 (IMG-AC-21 · SPEC r2 4절 정정)", () => {
  it("이미지 슬롯 있는 변형 전부 — 모든 이미지 슬롯 꺼짐이면 svg·img·[data-media] 0", () => {
    for (const [type, variant] of IMAGE_VARIANTS) {
      const s = setImages(section(type, variant, "s-a"), (v) => ({ ...v, enabled: false }));
      const c = drawDoc(only(s));
      expect(c.querySelectorAll("svg, img, [data-media]"), `${type}/${variant}`).toHaveLength(0);
    }
  });
});

describe("이미지 맞춤 (IMG-AC-18)", () => {
  it("사용자 이미지 = cover 가운데(hero·grid·about·갤러리) · 지도 = contain + 배경 --site-surface", () => {
    const css = readFileSync("src/kit/kit.css", "utf8");
    expect(css).toMatch(/\.kit-img \{[^}]*object-fit: cover;[^}]*object-position: center;/);
    expect(css).toMatch(/\.kit-footer-map-img \{[^}]*object-fit: contain;[^}]*background: var\(--site-surface\);/);
    const urls = { [ID]: "blob:null/1" };
    const withImage = (type: SectionType, variant: string) => setImages(section(type, variant, "s-a"), (v) => ({ ...v, source: ID as ImageSlotValue["source"] }));
    for (const [type, variant] of IMAGE_VARIANTS) for (const img of drawDoc(only(withImage(type, variant)), urls).querySelectorAll("img")) expect(img).toHaveClass("kit-img");
    expect(drawDoc(only(withImage("footer", "biz-extended-map")), urls).querySelector("img")).toHaveClass("kit-img", "kit-footer-map-img");
  });
});

describe("내보내기 즉시 로드 (IMG-AC-26b 렌더 쪽 · SPEC m2c 5.3-1)", () => {
  const doc = () =>
    only(
      setImages(section("hero", "image", "s-hero"), (v) => ({ ...v, source: ID as ImageSlotValue["source"] })),
      setImages(section("portfolio", "grid-3", "s-p"), (v) => ({ ...v, source: ID as ImageSlotValue["source"] })),
    );
  const loads = (c: HTMLElement) => [...c.querySelectorAll("img")].map((img) => `${img.getAttribute("loading")}|${img.getAttribute("fetchpriority")}`);
  it('loading "eager" → hero 밖 img도 lazy 없음 · hero fetchpriority high 유지 · 없으면 지금처럼 hero 밖 lazy', () => {
    const urls = { [ID]: "blob:null/1" };
    const eager = render(<PageDocument doc={doc()} kitTokens={SAMPLE_KIT_TOKENS} images={urls} loading="eager" />).container;
    expect(loads(eager)).toEqual(["null|high", "null|null", "null|null", "null|null"]);
    const preview = render(<PageDocument doc={doc()} kitTokens={SAMPLE_KIT_TOKENS} images={urls} />).container;
    expect(loads(preview)).toEqual(["null|high", "lazy|null", "lazy|null", "lazy|null"]);
  });
});

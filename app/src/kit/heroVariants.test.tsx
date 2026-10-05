import { readFileSync } from "node:fs";
import type { ImageSlotValue, PageDoc } from "../engine/contracts/pageDoc";
import { STATIC_MENU_SCRIPT, buildStaticHtml } from "../features/studio/staticHtml/staticMarkup";
import { drawDoc, heroDoc, patch, withUnknownCta, without } from "../render/testing/drawKit";
import { KIT_REGISTRY } from "./registry";

/** hero 5변형 공통 (M2B-1a · SPEC-BOUND 4.1 KB-AC-30·32·33·35 hero 몫 · K-AC-04·09) — [U]·[G]. 계산 스타일 일치는 브라우저 */
const VARIANTS = ["split", "center", "grid", "text", "image"] as const;
const FILES = { split: "HeroSplit", center: "HeroCenter", grid: "HeroGrid", text: "HeroText", image: "HeroImage" } as const;
const WITH_IMAGE = new Set(["split", "grid", "image"]);
const kitCss = readFileSync("src/kit/kit.css", "utf8");
const heroCss = kitCss.slice(kitCss.indexOf("/* hero 섹션 톤 4변형 공통"));

/** 변형별 문서 2벌 — alt 톤 + 이미지 켬(플레이스홀더) / base 톤 + 이미지 끔 */
const docs = (v: string): PageDoc[] => {
  const a = heroDoc(v, { tone: "alt" });
  const b = heroDoc(v, { tone: "base" });
  if (!WITH_IMAGE.has(v)) return [a, b];
  const image = b.sections.find((s) => s.instanceId === "s-hero")!.slots.image as ImageSlotValue;
  return [a, patch(b, "s-hero", { image: { ...image, enabled: false } })];
};
const staticPage = (doc: PageDoc) => {
  const markup = drawDoc(without(doc, "cta-band")).querySelector("[data-site-root]")!.outerHTML;
  return new DOMParser().parseFromString(buildStaticHtml({ markup, css: kitCss, title: "t", description: "d" }), "text/html");
};

describe("hero 5변형 공통", () => {
  it("KB-AC-33: KIT_REGISTRY에 5쌍 등록 · 문서마다 data-section 루트 1 · 폴백 표식 0(cta-band 자리 no-such-variant 폴백만) · h1 = 1 · hero는 main 안", () => {
    for (const v of VARIANTS) {
      expect(KIT_REGISTRY[`hero/${v}`], v).toBeDefined();
      const site = drawDoc(withUnknownCta(heroDoc(v))).querySelector("[data-site-root]")!; // M2B-2c 이관: 폴백 예시 = cta-band 자리 no-such-variant
      expect(site.querySelectorAll(`[data-section="hero/${v}"]`), v).toHaveLength(1);
      expect(site.querySelector(`[data-section="hero/${v}"] [data-kit-marker]`), v).toBeNull();
      expect(site.querySelectorAll("[data-fallback]"), v).toHaveLength(1);
      expect(site.querySelectorAll("h1"), v).toHaveLength(1);
      expect(site.querySelector(`main > [data-section="hero/${v}"]`), v).not.toBeNull();
    }
  });

  it("K-AC-04: 5변형 × 2벌 — 빈 p·h1·a·span 0 · 부제 빈 값이면 부제 요소 0", () => {
    for (const v of VARIANTS)
      for (const doc of [...docs(v), patch(heroDoc(v), "s-hero", { subtitle: "" })]) {
        const h = drawDoc(doc).querySelector(`[data-section="hero/${v}"]`)!;
        expect([...h.querySelectorAll("p, h1, a, span")].filter((el) => el.textContent!.trim() === ""), v).toHaveLength(0);
      }
  });

  it("KB-AC-30 [G]: 5변형 파일 — iframe 0 · 외부 URL 리터럴 0 (상태·핸들러·모션·hex·px·DS 토큰은 kitGuard가 kit/ 전체로 검사)", () => {
    for (const name of [...Object.values(FILES), "heroCopy"]) {
      const text = readFileSync(`src/kit/${name}.tsx`, "utf8");
      expect(text, name).not.toMatch(/iframe|https?:\/\//);
    }
    expect(heroCss).not.toMatch(/https?:\/\/|url\(/);
  });

  it("KB-AC-35 [G]: kit.css 선택자에 정적 HTML이 지우는 속성(data-section·data-surface·data-slot·data-media·data-instance-id) 0", () => {
    const selectors = [...kitCss.matchAll(/([^{}]+)\{/g)].map(([, s]) => s!.trim()).filter((s) => !s.startsWith("@"));
    expect(selectors.filter((s) => /\[data-(section|surface|slot|media|instance-id)/.test(s))).toEqual([]);
  });

  it("KB-AC-35 · 32 [U]: 정적 HTML 결과 — hero 규칙의 선택자가 남은 마크업에 전부 매칭(class·data-tone) · data-surface 지워짐 · script = 고정 1개", () => {
    const pages = VARIANTS.flatMap((v) => docs(v).map(staticPage));
    for (const page of pages) {
      expect(page.querySelectorAll("script")).toHaveLength(1);
      expect(page.querySelector("script")!.textContent).toBe(STATIC_MENU_SCRIPT);
      expect(page.querySelector("[data-surface], [data-section]")).toBeNull();
    }
    const selectors = [...heroCss.matchAll(/([^{}]+)\{/g)]
      .map(([, s]) => s!.trim())
      .filter((s) => !s.startsWith("@") && !s.startsWith("/*"))
      .flatMap((s) => s.split(",").map((x) => x.replace(/\/\*[\s\S]*?\*\//g, "").trim()));
    expect(selectors.length).toBeGreaterThan(20);
    const unmatched = selectors.filter((sel) => !pages.some((page) => page.querySelector(sel)));
    expect(unmatched).toEqual([]);
    // 톤별 부제 색 — data-tone(정적 HTML 보존) 기준 .kit-body 규칙이 정적 결과에서도 걸린다
    const alt = staticPage(heroDoc("split", { tone: "alt" }));
    expect(alt.querySelector('.kit-body[data-tone="alt"] .kit-hx-lead')).not.toBeNull();
  });
});

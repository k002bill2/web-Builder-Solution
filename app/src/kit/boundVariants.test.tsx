import { readFileSync } from "node:fs";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { STATIC_MENU_SCRIPT, buildStaticHtml } from "../features/studio/staticHtml/staticMarkup";
import { boundDoc, drawDoc, heroDoc, patch, withUnknownCta, without } from "../render/testing/drawKit";
import { KIT_REGISTRY } from "./registry";

/** header 3 + footer 3 공통 (M2B-1b · SPEC-BOUND 4.1 KB-AC-30·32·33·35 header·footer 몫 · K-AC-04) — [U]·[G]. 계산 스타일 일치는 브라우저 */
const HEADERS = ["sticky-hamburger", "sticky-two-tier", "transparent"] as const;
const FOOTERS = ["biz-extended-map", "minimal", "minimal-biz"] as const;
const FILES = ["HeaderStickyHamburger", "HeaderStickyTwoTier", "HeaderTransparent", "headerParts", "FooterBizExtendedMap", "FooterMinimal"];
const kitCss = readFileSync("src/kit/kit.css", "utf8");
const block = (from: string, to: string) => kitCss.slice(kitCss.indexOf(from), kitCss.indexOf(to));
const boundCss = block("/* header/sticky-hamburger", "/* 이미지 슬롯 공통") + block("/* footer/biz-extended-map", "/* 본문 섹션 공통");

/** 정적 HTML 판정 문서 — 변형마다 규칙이 갈리는 상태를 모두 덮는다(면 3종 + 구분선 · 보조 줄 data-always · 지도 켬) */
const docs = (): PageDoc[] => [
  boundDoc("header", "sticky-hamburger"),
  boundDoc("header", "sticky-two-tier"),
  patch(boundDoc("header", "sticky-two-tier"), "s-header", { nav: "" }),
  boundDoc("header", "transparent"),
  boundDoc("header", "transparent", heroDoc("center")),
  boundDoc("header", "transparent", heroDoc("split", { tone: "alt" })),
  boundDoc("header", "transparent", without(sampleDoc(), "hero")),
  ...FOOTERS.map((v) => boundDoc("footer", v)),
];
/** 괄호 밖 콤마로만 나눈다(:where(a, span) 보존) */
const splitList = (s: string) => s.split(/,(?![^()]*\))/).map((x) => x.trim());
const staticPage = (doc: PageDoc) => {
  const markup = drawDoc(without(doc, "cta-band")).querySelector("[data-site-root]")!.outerHTML;
  return new DOMParser().parseFromString(buildStaticHtml({ markup, css: kitCss, title: "t", description: "d" }), "text/html");
};

describe("header 3 + footer 3 공통", () => {
  it("KB-AC-33: KIT_REGISTRY에 6쌍 등록 · 문서마다 data-section 루트 1 · 폴백 표식 0(cta-band 자리 no-such-variant만) · header·footer = 사이트 루트 직계(main 밖)", () => {
    for (const [type, list] of [["header", HEADERS], ["footer", FOOTERS]] as const)
      for (const v of list) {
        const key = `${type}/${v}`;
        expect(KIT_REGISTRY[key], key).toBeDefined();
        const site = drawDoc(withUnknownCta(boundDoc(type, v))).querySelector("[data-site-root]")!; // M2B-2c 이관: 폴백 예시 = cta-band 자리 no-such-variant
        expect(site.querySelectorAll(`[data-section="${key}"]`), key).toHaveLength(1);
        expect(site.querySelector(`[data-section="${key}"] [data-kit-marker]`), key).toBeNull();
        expect(site.querySelectorAll("[data-fallback]"), key).toHaveLength(1);
        expect(site.querySelector(`:scope > [data-section="${key}"]`), key).not.toBeNull();
      }
  });

  it("K-AC-04: 판정 문서 전부 — 6변형 루트 안 빈 p·li·a·span·address 0 · 빈 ul 0", () => {
    for (const doc of docs()) {
      const site = drawDoc(doc).querySelector("[data-site-root]")!;
      for (const root of site.querySelectorAll('[data-section^="header/"], [data-section^="footer/"]')) {
        expect([...root.querySelectorAll("p, li, a, span, address")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
        expect([...root.querySelectorAll("ul")].filter((ul) => ul.children.length === 0)).toHaveLength(0);
      }
    }
  });

  it("KB-AC-30 [G]: 6변형 파일 — iframe 0 · 외부 URL 리터럴 0 · 새 CSS 블록에 외부 URL·url() 0 (상태·핸들러·모션·hex·px·DS 토큰은 kitGuard가 kit/ 전체로 검사)", () => {
    for (const name of FILES) expect(readFileSync(`src/kit/${name}.tsx`, "utf8"), name).not.toMatch(/iframe|https?:\/\//);
    expect(boundCss.length).toBeGreaterThan(1000);
    expect(boundCss).not.toMatch(/https?:\/\/|url\(/);
  });

  it("KB-AC-32 [U]: 정적 HTML 결과 script = r4.12 고정 1개(바이트 일치) — header 3변형 각각 · data-surface·data-section 지워짐", () => {
    for (const doc of docs()) {
      const page = staticPage(doc);
      expect(page.querySelectorAll("script")).toHaveLength(1);
      expect(page.querySelector("script")!.textContent).toBe(STATIC_MENU_SCRIPT);
      expect(page.querySelector("[data-surface], [data-section]")).toBeNull();
    }
  });

  it("KB-AC-35 [U]: 정적 HTML 결과 — header·footer 새 규칙의 선택자가 남은 마크업(class·data-site-root·data-kit·data-always)에 전부 매칭 · :has() 1줄 대상 존재", () => {
    const pages = docs().map(staticPage);
    const selectors = [...boundCss.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g)]
      .map(([, s]) => s!.trim())
      .filter((s) => !s.startsWith("@"))
      .flatMap(splitList);
    const has = selectors.filter((s) => s.includes(":has("));
    expect(has).toEqual(["[data-site-root]:has(> .kit-header--two-tier) [data-kit]"]);
    const plain = selectors.filter((s) => !s.includes(":has(")).map((s) => s.replace(/:popover-open/g, ""));
    expect(plain.length).toBeGreaterThan(25);
    expect(plain.filter((sel) => !pages.some((page) => page.querySelector(sel)))).toEqual([]);
    const twoTier = staticPage(boundDoc("header", "sticky-two-tier"));
    expect(twoTier.querySelector("[data-site-root] > .kit-header--two-tier")).not.toBeNull();
    expect(twoTier.querySelectorAll("[data-site-root] [data-kit]").length).toBeGreaterThan(3);
    // 면 클래스 3종 · 구분선 · 보조 줄 data-always · 지도 칸이 정적 결과에 남는다
    for (const sel of [".kit-header--face-primary", ".kit-header--face-surface", ".kit-header--face-bg.kit-header--edge", ".kit-tier[data-always]", ".kit-footer--map .kit-footer-map", ".kit-body.kit-footer-min"])
      expect(pages.some((page) => page.querySelector(sel)), sel).toBe(true);
  });
});

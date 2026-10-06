import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { referenceFixtures } from "../fixtures/references";
import { referenceRenderInput } from "./referenceDoc";
import { buildThumbnail, buildThumbnails, thumbnailIds, THUMB_HEIGHT, THUMB_WIDTH } from "./entry";
import { thumbnailIssues } from "./guards";

/** 빌드 render CSS 대신 고정 CSS — 테스트가 dist에 의존하지 않는다 */
const CSS = "/*! tailwindcss | https://tailwindcss.com */@font-face{font-family:X;src:url(/assets/x.woff2)}[data-site-root]{color:red}@media (width>=64rem){.kit-hero{display:grid}}@media (width<48rem){.kit-hero{display:block}}";
/** 썸네일 대상 = 카탈로그 카드 id 전체(큐레이션 6 + 생성 15, ADR-004 개정 7 결정 5) — 키 맵 없이 카드는 id별로 판단하지 않으므로 빠진 id 0을 빌드가 보장한다 */
const IDS = [...referenceFixtures, ...generatedReferenceFixtures].map((r) => r.id);

describe("referenceRenderInput — 레퍼런스 → 렌더 입력", () => {
  it("카드 21개(큐레이션 6 + 생성 15) 모두 문서·킷 토큰을 만든다 — 팔레트 5역할·카드·비율은 픽스처 값", () => {
    expect(IDS).toHaveLength(21);
    expect(IDS.filter((id) => id.startsWith("gen-"))).toHaveLength(15);
    for (const id of IDS) {
      const { doc, kitTokens } = referenceRenderInput(id);
      expect(doc.sections.length).toBeGreaterThan(3);
      expect(Object.keys(kitTokens.palette).sort()).toEqual(["bg", "ink", "muted", "primary", "surface"]);
    }
    const a = referenceRenderInput("ref-a");
    expect(a.kitTokens).toMatchObject({ palette: { primary: "#8B5E3C", bg: "#FFFFFF" }, card: { tone: "light", style: "bordered-lg" }, mediaRatio: "16:9", space: { grid: 8, sectionGap: 96 } });
    expect(referenceRenderInput("ref-b").kitTokens.card).toEqual({ tone: "dark", style: "elevated" });
  });
  it("모르는 id는 throw", () => {
    expect(() => referenceRenderInput("ref-zz")).toThrow(/ref-zz/);
  });
});

describe("buildThumbnail — SVG writer (M3P-AC-U8·G2·G6)", () => {
  it("같은 레퍼런스 → 같은 문자열(고정 경로 thumbs/{id}.svg — 버전은 빌드 상수), 다른 레퍼런스 → 다른 문자열", () => {
    const one = buildThumbnail("ref-a", CSS);
    const two = buildThumbnail("ref-a", CSS);
    expect(two).toEqual(one);
    expect(Object.keys(one).sort()).toEqual(["id", "svg"]);
    expect(buildThumbnail("ref-b", CSS).svg).not.toBe(one.svg);
    expect(buildThumbnail("gen-cafe-fnb-1", CSS).svg).not.toBe(buildThumbnail("gen-beauty-1", CSS).svg);
  });
  it("viewBox 1280×960 · @media 0(1280 기준으로 풀림) · 글꼴 파일 0 · 주석 0", () => {
    const { svg } = buildThumbnail("ref-c", CSS);
    expect([THUMB_WIDTH, THUMB_HEIGHT]).toEqual([1280, 960]);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1280" height="960" viewBox="0 0 1280 960">/);
    expect(svg).not.toMatch(/@media|@font-face|woff2|tailwindcss\.com/);
    expect(svg).toContain(".kit-hero{display:grid}");
    expect(svg).not.toContain(".kit-hero{display:block}");
  });
  it("대상 = 카드 id 전체 21개, 21장 전부 가드 위반 0 — 중첩 svg 네임스페이스 = SVG(XML 파싱) · 외부 참조 0", () => {
    expect(thumbnailIds()).toEqual(IDS);
    const all = buildThumbnails(CSS);
    expect(all.map((t) => t.id)).toEqual(IDS);
    for (const t of all) expect(thumbnailIssues(t.svg)).toEqual([]);
    const xml = new DOMParser().parseFromString(all[0]!.svg, "image/svg+xml");
    const nested = [...xml.getElementsByTagNameNS("*", "svg")].slice(1);
    expect(nested.length).toBeGreaterThan(0);
    expect(nested.every((n) => n.namespaceURI === "http://www.w3.org/2000/svg")).toBe(true);
  });
});

describe("thumbnailIssues — 반례 (가드가 실제로 잡는다)", () => {
  const good = buildThumbnail("ref-a", CSS).svg;
  const inject = (s: string) => good.replace("<foreignObject", `${s}<foreignObject`);
  it.each([
    ["외부 http", inject('<image href="http://x.example/a.png"/>'), /http/],
    ["프로토콜 상대 //", good.replace("[data-site-root]{", "[data-site-root]{background:url(//x.example/a.png);"), /\/\//],
    ["script", inject("<script>1</script>"), /script/],
    ["on 속성", good.replace("<div data-site-root", '<div onclick="x()" data-site-root'), /on\*/],
    ["외부 href", inject('<a href="/catalog">x</a>'), /href/],
    ["이전 브랜드", good.replace("[data-site-root]{", `[data-site-root]{--${["a", "p", "f", "s"].join("")}-x:1;`), /이전 브랜드/],
    ["@media 남음", good.replace("[data-site-root]{", "@media (width>=1px){a{b:c}}[data-site-root]{"), /@media/],
    ["viewBox 다름", good.replace('viewBox="0 0 1280 960"', 'viewBox="0 0 1280 900"'), /viewBox/],
    ["XML 깨짐", good.replace("</svg>", ""), /XML/],
  ])("%s", (_name, svg, pattern) => {
    expect(thumbnailIssues(svg).join(" | ")).toMatch(pattern);
  });
  it("중첩 svg가 XHTML 네임스페이스로 떨어지면 잡는다", () => {
    const bad = good.replace(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 100 100"/, '<svg xmlns="http://www.w3.org/1999/xhtml" viewBox="0 0 100 100"');
    expect(bad).not.toBe(good);
    expect(thumbnailIssues(bad).join(" | ")).toMatch(/네임스페이스/);
  });
});

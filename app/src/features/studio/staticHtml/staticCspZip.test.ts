import { createHash } from "node:crypto";
import { brand } from "../../../brand/brand.config";
import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { drawDoc, without } from "../../../render/testing/drawKit";
import { KIT_CSS } from "../testing/reactZipFixture";
import * as markupModule from "./staticMarkup";
import { STATIC_CSP_HTML, STATIC_MENU_SCRIPT_HASH, assertStaticHead, buildStaticHtml } from "./staticMarkup";

/** CSP-SPEC 1.2 상수(1줄) 그대로 — 생성기 상수와 비교해 조립 오타를 잡는다 */
const SPEC_CSP_ZIP =
  "default-src 'none'; script-src 'sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg='; style-src 'unsafe-inline'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'";
const CSP_META_ZIP = `<meta http-equiv="Content-Security-Policy" content="${SPEC_CSP_ZIP}">`;
/** 2단계 전에는 export가 없다 → RED가 import 실패가 아니라 단언 실패로 나오게 모듈 객체로 읽는다 */
const zipPolicy = () => (markupModule as Record<string, unknown>).STATIC_CSP_ZIP as string | undefined;

const siteMarkup = (doc = without(sampleDoc(), "cta-band")) => drawDoc(doc).querySelector("[data-site-root]")!.outerHTML;
const parts = { css: "[data-site-root]{color:var(--site-ink)}[data-kit]{display:block}", title: "모던 카페", description: "스페셜티 커피", target: "zip" as const };
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");
const scriptHashOf = (text: string) => `sha256-${createHash("sha256").update(text, "utf8").digest("base64")}`;
const policyHashOf = (content: string) => content.match(/script-src '(sha256-[^']+)'/)?.[1];

/** zip 기준 입력 — basic(CSP-1이 남긴 base 픽스처) · assets(이미지 참조 + assets/fonts @font-face + 고지 · 실제 zip과 같은 모양) */
const FIXTURES: readonly (readonly [string, () => Parameters<typeof buildStaticHtml>[0]])[] = [
  ["zip-basic", () => ({ ...parts, markup: siteMarkup() })],
  [
    "zip-assets",
    () => ({
      ...parts,
      css: `${parts.css}@font-face{font-family:"Pretendard";font-weight:400;font-style:normal;font-display:swap;src:url(assets/fonts/Pretendard-400.woff2) format("woff2")}`,
      notice: "Fonts: SIL OFL 1.1 — see LICENSES.md",
      images: { "id-1": "assets/images/img-01.webp" },
      markup: '<div data-site-root="" style="--site-ink:#222"><img alt="" src="image:id-1"><a href="#s-x">x</a><section id="s-x"></section></div>',
    }),
  ],
];

describe("CSP-AC-07(zip) 기준 출력 — CSP meta 1개를 지우면 base 생성기 출력과 바이트 동일", () => {
  it.each(FIXTURES)("%s", async (name, input) => {
    await expect(buildStaticHtml(input()).replace(CSP_META_ZIP, "")).toMatchFileSnapshot(`./__fixtures__/csp-base-${name}.html`);
  });
  it.each(FIXTURES)("%s — meta 문자열이 정확히 1번 들어 있다", (_, input) => {
    expect(buildStaticHtml(input()).split(CSP_META_ZIP)).toHaveLength(2);
  });
});

describe("CSP-AC-02 static-zip index.html head — CSP meta 1개 · charset 다음 2번째 · content = STATIC_CSP_ZIP", () => {
  it.each(FIXTURES)("%s", (_, input) => {
    const head = parse(buildStaticHtml(input())).head;
    const metas = head.querySelectorAll("meta[http-equiv]");
    expect(metas).toHaveLength(1);
    expect(head.children[0]!.getAttribute("charset")).toBe("utf-8");
    expect(head.children[1]).toBe(metas[0]);
    expect(metas[0]!.getAttribute("http-equiv")).toBe("Content-Security-Policy");
    expect(metas[0]!.getAttribute("content")).toBe(SPEC_CSP_ZIP);
    expect(zipPolicy()).toBe(SPEC_CSP_ZIP);
  });

  it("AC-04(zip) 다시 파싱한 유일 script의 sha256 = CSP content 안 해시 · AC-03 정책 안 해시 = 상수", () => {
    for (const [, input] of FIXTURES) {
      const doc = parse(buildStaticHtml(input()));
      const scripts = doc.querySelectorAll("script");
      expect(scripts).toHaveLength(1);
      expect(scriptHashOf(scripts[0]!.textContent ?? "")).toBe(policyHashOf(doc.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute("content") ?? ""));
    }
    expect(policyHashOf(zipPolicy() ?? "")).toBe(STATIC_MENU_SCRIPT_HASH);
  });
});

describe("CSP-AC-06(zip) F-15 — zip head meta[http-equiv] = 정확히 1개 · STATIC_CSP_ZIP 문자 동일 · 두 번째 자식", () => {
  const validHead = () => parse(buildStaticHtml({ ...parts, markup: siteMarkup() })).head;
  const cspOf = (head: HTMLHeadElement) => head.querySelector('meta[http-equiv="Content-Security-Policy"]')!;

  it("정상 = 통과 · 같은 head를 html 대상으로 검사 = throw(정책 교차)", () => {
    expect(() => assertStaticHead(validHead(), "zip")).not.toThrow();
    expect(() => assertStaticHead(validHead(), "html")).toThrow("정적 HTML head");
  });

  it("zip head에 html 정책(data:) = throw · content 1글자 = throw · meta 0 = throw", () => {
    const html = validHead();
    cspOf(html).setAttribute("content", STATIC_CSP_HTML);
    expect(() => assertStaticHead(html, "zip")).toThrow("정적 HTML head");
    const changed = validHead();
    cspOf(changed).setAttribute("content", SPEC_CSP_ZIP.replace("'self';", "'self' ;"));
    expect(() => assertStaticHead(changed, "zip")).toThrow("정적 HTML head");
    const missing = validHead();
    cspOf(missing).remove();
    expect(() => assertStaticHead(missing, "zip")).toThrow("정적 HTML head");
  });

  it("두 번째 meta[http-equiv]·위치 변경·base·link = throw", () => {
    for (const extra of ['<meta http-equiv="refresh" content="0;url=https://x.test">', CSP_META_ZIP, '<base href="https://x.test/">', '<link rel="stylesheet" href="https://x.test/a.css">']) {
      const head = validHead();
      head.insertAdjacentHTML("beforeend", extra);
      expect(() => assertStaticHead(head, "zip"), extra).toThrow("정적 HTML head");
    }
    const late = validHead();
    late.append(cspOf(late));
    expect(() => assertStaticHead(late, "zip")).toThrow("정적 HTML head");
  });
});

describe("CSP-AC-08(zip) 정책 상수 형식 — SPEC 1.2 표", () => {
  it("지시어 집합 = 1.2 표 · 'self'는 img·font만 · data:·http(s):·*·'unsafe-eval' 0 · 브랜드 0", () => {
    const policy = zipPolicy() ?? "";
    const directives = Object.fromEntries(policy.split("; ").map((d) => d.split(" ")).map(([name, ...values]) => [name, values]));
    expect(directives).toEqual({
      "default-src": ["'none'"],
      "script-src": [`'${STATIC_MENU_SCRIPT_HASH}'`],
      "style-src": ["'unsafe-inline'"],
      "img-src": ["'self'"],
      "font-src": ["'self'"],
      "base-uri": ["'none'"],
      "form-action": ["'none'"],
    });
    expect(policy).not.toMatch(/data:|https?:|\*|'unsafe-eval'|frame-ancestors|report-uri|report-to|sandbox/);
    expect(policy.toLowerCase()).not.toContain(brand.name.toLowerCase());
    expect(policy.toLowerCase()).not.toContain(["a", "p", "f", "s"].join(""));
  });
});

describe("CSP-AC-11 zip index.html — head <style>·style 속성·img src에 data: 0 (zip 정책에 data: 없음, SPEC 1.2.1)", () => {
  /** 판정 함수 — 어긋나면(data: 리소스가 생기면) 그 시점에 이 테스트가 실패해 1.2.1 개정을 강제한다 */
  const dataUses = (html: string) => {
    const doc = parse(html);
    return [
      ...[...doc.querySelectorAll("style")].map((s) => s.textContent ?? ""),
      ...[...doc.querySelectorAll("[style]")].map((el) => el.getAttribute("style") ?? ""),
      ...[...doc.querySelectorAll("img")].map((img) => img.getAttribute("src") ?? ""),
    ].filter((text) => /data:/i.test(text));
  };

  it("킷 CSS 원문(kit.css·motion.css) + 픽스처 zip 출력 = data: 0", () => {
    const kitCss = KIT_CSS["kit.css"] + KIT_CSS["motion.css"];
    for (const [, input] of FIXTURES) expect(dataUses(buildStaticHtml({ ...input(), css: kitCss + input().css }))).toEqual([]);
  });

  it("판정 함수가 data:를 잡는다(마크업 검사는 zip CSS의 data:를 통과시킨다 — 어긋남의 증거)", () => {
    const html = buildStaticHtml({ ...parts, markup: siteMarkup(), css: "[data-kit]{background:url(data:image/png;base64,QUJD)}" });
    expect(dataUses(html)).toHaveLength(1);
  });
});

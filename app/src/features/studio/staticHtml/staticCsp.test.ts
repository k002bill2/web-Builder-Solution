import { createHash } from "node:crypto";
import { brand } from "../../../brand/brand.config";
import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { drawDoc, without } from "../../../render/testing/drawKit";
import { STATIC_CSP_HTML, STATIC_MENU_SCRIPT, STATIC_MENU_SCRIPT_HASH, assertStaticHead, buildStaticHtml } from "./staticMarkup";

/** CSP-SPEC 1.1 상수(1줄) 그대로 — 생성기 상수와 비교해 조립 오타를 잡는다 */
const SPEC_CSP_HTML =
  "default-src 'none'; script-src 'sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg='; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'";
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${SPEC_CSP_HTML}">`;

const siteMarkup = (doc = without(sampleDoc(), "cta-band")) => drawDoc(doc).querySelector("[data-site-root]")!.outerHTML;
const CSS = "[data-site-root]{color:var(--site-ink)}[data-kit]{display:block}";
const parts = { css: CSS, title: "모던 카페", description: "스페셜티 커피" };
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

/** 테스트 전용 해시(Node crypto) — 생성기는 해시를 계산하지 않는다(SPEC 2.1) */
const scriptHashOf = (text: string) => `sha256-${createHash("sha256").update(text, "utf8").digest("base64")}`;
const policyHashOf = (content: string) => content.match(/script-src '(sha256-[^']+)'/)?.[1];
/** CSP-AC-04 판정 — 최종 HTML을 다시 파싱해 유일 <script> textContent의 sha256이 CSP meta 안 해시와 같은가 */
function scriptMatchesPolicy(html: string): boolean {
  const doc = parse(html);
  const scripts = doc.querySelectorAll("script");
  const metas = doc.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
  if (scripts.length !== 1 || metas.length !== 1) return false;
  return scriptHashOf(scripts[0]!.textContent ?? "") === policyHashOf(metas[0]!.getAttribute("content") ?? "");
}

/** CSP-AC-07 기준 입력 — base `ec32f407` 생성기 출력을 파일 스냅샷으로 고정했다(구현 전 기록) */
const FIXTURES: readonly (readonly [string, () => Parameters<typeof buildStaticHtml>[0]])[] = [
  ["basic", () => ({ ...parts, markup: siteMarkup() })],
  ["notice", () => ({ ...parts, markup: siteMarkup(), notice: "Fonts: Pretendard\nSIL OPEN FONT LICENSE Version 1.1" })],
  ["no-about", () => ({ ...parts, title: "다른 가게", description: "다른 설명", markup: siteMarkup(without(without(sampleDoc(), "cta-band"), "about")) })],
  ["images", () => ({ css: "", title: "t", description: "d", images: { "id-1": "data:image/webp;base64,QUJD" }, markup: '<div data-site-root=""><img alt="" src="image:id-1"></div>' })],
];

describe("CSP-AC-01 static-html head — CSP meta 1개 · charset 다음 2번째 · content = STATIC_CSP_HTML", () => {
  it.each(FIXTURES)("%s", (_, input) => {
    const head = parse(buildStaticHtml(input())).head;
    const metas = head.querySelectorAll("meta[http-equiv]");
    expect(metas).toHaveLength(1);
    expect(head.children[0]!.getAttribute("charset")).toBe("utf-8");
    expect(head.children[1]).toBe(metas[0]);
    expect(metas[0]!.getAttribute("http-equiv")).toBe("Content-Security-Policy");
    expect(metas[0]!.getAttribute("content")).toBe(STATIC_CSP_HTML);
    expect(metas[0]!.getAttribute("content")).toBe(SPEC_CSP_HTML);
  });

  it("zip 대상 출력은 html 정책을 쓰지 않는다(2단계 — zip 정책·기준 픽스처는 staticCspZip.test.ts)", () => {
    const zip = buildStaticHtml({ ...parts, markup: siteMarkup(), target: "zip" });
    expect(zip).not.toContain(STATIC_CSP_HTML);
    expect(zip.split("http-equiv")).toHaveLength(2);
  });
});

describe("CSP-AC-03·04·05 메뉴 스크립트 해시 — 상수 옆 고정 + 대조", () => {
  it("AC-03 STATIC_MENU_SCRIPT_HASH = Node crypto sha256(STATIC_MENU_SCRIPT) · SPEC 0절 값", () => {
    expect(STATIC_MENU_SCRIPT_HASH).toBe(scriptHashOf(STATIC_MENU_SCRIPT));
    expect(STATIC_MENU_SCRIPT_HASH).toBe("sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg=");
    expect(policyHashOf(STATIC_CSP_HTML)).toBe(STATIC_MENU_SCRIPT_HASH);
  });

  it.each(FIXTURES)("AC-04 %s — 다시 파싱한 유일 script의 sha256 = CSP content 안 해시", (_, input) => {
    expect(scriptMatchesPolicy(buildStaticHtml(input()))).toBe(true);
  });

  it("AC-05 RED 증거 — 스크립트 1글자를 바꾸면 03·04 판정이 실패한다", () => {
    const changed = STATIC_MENU_SCRIPT.replace('"click"', '"clicK"');
    expect(changed).not.toBe(STATIC_MENU_SCRIPT);
    expect(changed).toHaveLength(STATIC_MENU_SCRIPT.length);
    expect(scriptHashOf(changed)).not.toBe(STATIC_MENU_SCRIPT_HASH);
    const html = buildStaticHtml({ ...parts, markup: siteMarkup() });
    const tampered = html.replace(`<script>${STATIC_MENU_SCRIPT}</script>`, `<script>${changed}</script>`);
    expect(tampered).not.toBe(html);
    expect(scriptMatchesPolicy(html)).toBe(true);
    expect(scriptMatchesPolicy(tampered)).toBe(false);
  });
});

describe("CSP-AC-06 F-15 개정 — head meta[http-equiv] = 정확히 1개 · 정책 상수 문자 동일 · 두 번째 자식", () => {
  const validHead = () => parse(buildStaticHtml({ ...parts, markup: siteMarkup() })).head;
  const cspOf = (head: HTMLHeadElement) => head.querySelector('meta[http-equiv="Content-Security-Policy"]')!;

  it("정상 head 1개 = 통과", () => {
    expect(() => assertStaticHead(validHead(), "html")).not.toThrow();
  });

  it("두 번째 meta[http-equiv](refresh·CSP 중복·대소문자 변형) 주입 = throw", () => {
    for (const extra of [
      '<meta http-equiv="refresh" content="0;url=https://x.test">',
      `<meta http-equiv="Content-Security-Policy" content="${SPEC_CSP_HTML}">`,
      `<meta http-equiv="content-security-policy" content="default-src *">`,
    ]) {
      const head = validHead();
      head.insertAdjacentHTML("beforeend", extra);
      expect(() => assertStaticHead(head, "html"), extra).toThrow("정적 HTML head");
    }
  });

  it("CSP content 1글자 변경 = throw", () => {
    const head = validHead();
    cspOf(head).setAttribute("content", SPEC_CSP_HTML.replace("'none';", "'none' ;"));
    expect(() => assertStaticHead(head, "html")).toThrow("정적 HTML head");
  });

  it("위치 변경(첫 자식·style 뒤) = throw", () => {
    const first = validHead();
    first.prepend(cspOf(first));
    expect(() => assertStaticHead(first, "html")).toThrow("정적 HTML head");
    const late = validHead();
    late.append(cspOf(late));
    expect(() => assertStaticHead(late, "html")).toThrow("정적 HTML head");
  });

  it("html인데 CSP meta 0 = throw · http-equiv 값 변경 = throw", () => {
    const missing = validHead();
    cspOf(missing).remove();
    expect(() => assertStaticHead(missing, "html")).toThrow("정적 HTML head");
    const renamed = validHead();
    cspOf(renamed).setAttribute("http-equiv", "Content-Security-Policy-Report-Only");
    expect(() => assertStaticHead(renamed, "html")).toThrow("정적 HTML head");
  });

  it("base·link = throw(현행 유지) · html 정책 head를 zip 대상으로 검사 = throw(정책 교차)", () => {
    for (const extra of ['<base href="https://x.test/">', '<link rel="stylesheet" href="https://x.test/a.css">']) {
      const head = validHead();
      head.insertAdjacentHTML("beforeend", extra);
      expect(() => assertStaticHead(head, "html"), extra).toThrow("정적 HTML head");
    }
    expect(() => assertStaticHead(validHead(), "zip")).toThrow("정적 HTML head");
  });
});

describe("CSP-AC-07 불변 — base 출력에서 CSP meta 1개를 지운 것과 바이트 동일", () => {
  it.each(FIXTURES)("%s", async (name, input) => {
    const html = buildStaticHtml(input());
    expect(html.split(CSP_META)).toHaveLength(2);
    await expect(html.replace(CSP_META, "")).toMatchFileSnapshot(`./__fixtures__/csp-base-${name}.html`);
  });
});

describe("CSP-AC-08 정책 상수 형식", () => {
  const directives = () => STATIC_CSP_HTML.split("; ").map((d) => d.split(" "));

  it("SPEC 1.1 문자 동일 · default-src 'none' 시작 · 지시어 집합 = 1.1 표(각 1번)", () => {
    expect(STATIC_CSP_HTML).toBe(SPEC_CSP_HTML);
    expect(STATIC_CSP_HTML.startsWith("default-src 'none'")).toBe(true);
    expect(directives().map(([name]) => name)).toEqual(["default-src", "script-src", "style-src", "img-src", "font-src", "base-uri", "form-action"]);
    expect(Object.fromEntries(directives().map(([name, ...values]) => [name, values]))).toEqual({
      "default-src": ["'none'"],
      "script-src": [`'${STATIC_MENU_SCRIPT_HASH}'`],
      "style-src": ["'unsafe-inline'"],
      "img-src": ["data:"],
      "font-src": ["data:"],
      "base-uri": ["'none'"],
      "form-action": ["'none'"],
    });
  });

  it("'unsafe-eval' 0 · script-src에 'unsafe-inline' 0 · http:·https:·* 0 · meta가 무시하는 지시어 0 · 브랜드 문자열 0(F-14)", () => {
    expect(STATIC_CSP_HTML).not.toContain("'unsafe-eval'");
    expect(directives().find(([name]) => name === "script-src")).not.toContain("'unsafe-inline'");
    expect(STATIC_CSP_HTML).not.toMatch(/https?:|\*/);
    expect(STATIC_CSP_HTML).not.toMatch(/frame-ancestors|report-uri|report-to|sandbox/);
    expect(STATIC_CSP_HTML.toLowerCase()).not.toContain(brand.name.toLowerCase());
    expect(STATIC_CSP_HTML.toLowerCase()).not.toContain(["a", "p", "f", "s"].join(""));
  });
});

// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * 배포 헤더 가드 (보안 감사 2026-10-18 F-02 · SEC REPORT I-6) — app/vercel.json(Vercel 루트 디렉터리 = app)의 CSP·nosniff.
 * 앱 문서와 렌더 문서(render.html — 앱이 `sandbox="allow-scripts"` iframe으로 싣는다)는 정책이 달라 규칙 두 개가 겹치지 않아야 한다.
 * ACAO는 넣지 않는다 — Vercel 기본 `*`가 불투명 출처 렌더 문서의 모듈 스크립트·CSS·글꼴 CORS를 통과시킨다(값 2개면 CORS 실패).
 */
const FILE = fileURLToPath(new URL("../../vercel.json", import.meta.url));
const CSP_KEYS = ["Content-Security-Policy", "Content-Security-Policy-Report-Only"];

type Rule = { readonly source: string; readonly headers: readonly { readonly key: string; readonly value: string }[] };
const rules = (): readonly Rule[] => (JSON.parse(readFileSync(FILE, "utf8")) as { headers?: Rule[] }).headers ?? [];
const matching = (path: string) => rules().filter((rule) => new RegExp(`^${rule.source}$`).test(path));
const ruleFor = (path: string): Rule => {
  const found = matching(path);
  expect(found, path).toHaveLength(1);
  return found[0]!;
};
const header = (rule: Rule, key: string) => rule.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;
const directives = (rule: Rule): ReadonlyMap<string, readonly string[]> => {
  const values = rule.headers.filter((h) => CSP_KEYS.includes(h.key));
  expect(values, rule.source).toHaveLength(1);
  return new Map(
    values[0]!.value
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter((tokens) => tokens[0])
      .map(([name, ...sources]) => [name!, sources]),
  );
};

const APP_PATHS = ["/", "/catalog", "/studio", "/assets/index-abc.js", "/assets/render-abc.js", "/thumbs/x.svg", "/render.htmlx"];
const RENDER = "/render.html";

describe("vercel.json 배포 헤더", () => {
  it("app/vercel.json이 있다", () => {
    expect(existsSync(FILE)).toBe(true);
  });

  it("모든 경로에 규칙이 정확히 하나 맞는다(앱 규칙·렌더 규칙이 겹치지 않는다)", () => {
    for (const path of [...APP_PATHS, RENDER]) ruleFor(path);
    expect(ruleFor(RENDER).source).not.toBe(ruleFor("/").source);
    for (const path of APP_PATHS) expect(ruleFor(path).source, path).toBe(ruleFor("/").source);
  });

  it("어느 규칙도 ACAO·X-Frame-Options를 넣지 않는다", () => {
    for (const rule of rules()) {
      expect(header(rule, "Access-Control-Allow-Origin"), rule.source).toBeUndefined();
      expect(header(rule, "X-Frame-Options"), rule.source).toBeUndefined();
    }
  });

  it("두 규칙 모두 nosniff · 스크립트·스타일 'self'만 · object/base 'none'", () => {
    for (const path of ["/", RENDER]) {
      const rule = ruleFor(path);
      const csp = directives(rule);
      expect(header(rule, "X-Content-Type-Options"), path).toBe("nosniff");
      expect(csp.get("default-src"), path).toEqual(["'self'"]);
      expect(csp.get("script-src"), path).toEqual(["'self'"]);
      expect(csp.get("style-src"), path).toEqual(["'self'"]);
      expect(csp.get("object-src"), path).toEqual(["'none'"]);
      expect(csp.get("base-uri"), path).toEqual(["'none'"]);
      // PNG svg data URL · 인라인 아이콘(data:) · 업로드 이미지 object URL(blob:)
      expect(csp.get("img-src"), path).toEqual(["'self'", "data:", "blob:"]);
    }
  });

  it("앱 문서: 다른 문서에 실리지 않는다 · 렌더 iframe만 같은 출처로 싣는다", () => {
    const csp = directives(ruleFor("/"));
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("frame-src")).toEqual(["'self'"]);
    expect(csp.get("connect-src")).toEqual(["'self'"]);
  });

  it("렌더 문서: 앱(같은 출처)만 싣는다 · serializeSite의 blob: fetch 허용", () => {
    const csp = directives(ruleFor(RENDER));
    expect(csp.get("frame-ancestors")).toEqual(["'self'"]);
    expect(csp.get("frame-src")).toEqual(["'none'"]);
    expect(csp.get("connect-src")).toEqual(["'self'", "blob:"]);
  });
});

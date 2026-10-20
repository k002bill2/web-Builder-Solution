import { brand } from "../../../brand/brand.config";
import * as templates from "./templates";
import { VITE_CONFIG, indexHtml } from "./templates";

/** CSP-SPEC 1.3.2 상수(1줄) 그대로 */
const SPEC_REACT_ZIP_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'";
/** 2단계 전에는 export가 없다 → RED가 import 실패가 아니라 단언 실패로 나오게 모듈 객체로 읽는다 */
const reactPolicy = () => (templates as Record<string, unknown>).REACT_ZIP_CSP as string | undefined;

describe("CSP-AC-09 React zip — vite.config.ts 템플릿에 build 전용 CSP plugin · 소스 index.html은 meta 0", () => {
  it("REACT_ZIP_CSP = SPEC 1.3.2 문자 동일 · 지시어 집합 · 'unsafe-inline'·'unsafe-eval'·http(s):·* 0 · 브랜드 0", () => {
    const policy = reactPolicy() ?? "";
    expect(policy).toBe(SPEC_REACT_ZIP_CSP);
    expect(Object.fromEntries(policy.split("; ").map((d) => d.split(" ")).map(([name, ...values]) => [name, values]))).toEqual({
      "default-src": ["'none'"],
      "script-src": ["'self'"],
      "style-src": ["'self'"],
      "img-src": ["'self'", "data:"],
      "font-src": ["'self'"],
      "base-uri": ["'none'"],
      "form-action": ["'none'"],
    });
    expect(policy).not.toMatch(/'unsafe-inline'|'unsafe-eval'|https?:|\*/);
    expect(policy.toLowerCase()).not.toContain(brand.name.toLowerCase());
  });

  it("vite.config.ts = CSP 상수 1개 · apply: \"build\" · head-prepend meta 주입 · plugins 끝에 csp", () => {
    expect(VITE_CONFIG).toContain(`const CSP = ${JSON.stringify(SPEC_REACT_ZIP_CSP)};`);
    expect(VITE_CONFIG.split(SPEC_REACT_ZIP_CSP)).toHaveLength(2);
    expect(VITE_CONFIG).toContain('apply: "build"');
    expect(VITE_CONFIG).toContain('"http-equiv": "Content-Security-Policy"');
    expect(VITE_CONFIG).toContain('injectTo: "head-prepend"');
    expect(VITE_CONFIG).toContain("plugins: [react(), tailwindcss(), csp]");
    expect(VITE_CONFIG).not.toMatch(/https?:\/\//);
  });

  it("vite.config.ts 템플릿을 그대로 실행한 plugin이 meta 태그 1개를 돌려준다(transformIndexHtml 반환 형태)", async () => {
    const body = VITE_CONFIG.replace(/^import .*$/gm, "").replace(/: Plugin/, "").replace("export default defineConfig(", "return (");
    const config = new Function("react", "tailwindcss", body)(() => "react", () => "tailwind") as { plugins: unknown[] };
    const csp = config.plugins[2] as { name: string; apply: string; transformIndexHtml: () => unknown };
    expect(csp.apply).toBe("build");
    expect(csp.transformIndexHtml()).toEqual([{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: SPEC_REACT_ZIP_CSP }, injectTo: "head-prepend" }]);
  });

  it("소스 index.html entry에 http-equiv 0(dev 서버 영향 0 — SPEC 1.3.1)", () => {
    expect(indexHtml("t", "d")).not.toContain("http-equiv");
  });
});

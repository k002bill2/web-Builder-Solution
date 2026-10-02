import { describe, expect, it } from "vitest";
import { checkBundle } from "./bundleBudget.mjs";

/**
 * 번들 검사 판정 (ADR-004 개정 2 결정 5) — 픽스처 manifest + 주입한 크기(KB)로 판정만 본다.
 * 앱 엔트리 = index.html · 렌더 엔트리 = render.html (이름 고정) · 그 밖 엔트리 = 실패 · 렌더 JS ≤ 90 · CSS ≤ 30 · 공유 청크 참고 출력.
 */
const SIZES = {
  "assets/index.js": 20,
  "assets/client.js": 60,
  "assets/page.js": 10,
  "assets/lazy.js": 30,
  "assets/render.js": 5,
  "assets/registry.js": 3,
  "assets/render.css": 4,
  "assets/kit.css": 2,
  "assets/index.css": 9,
};
const sizeOf = (file) => SIZES[file] ?? 0;

const manifest = (extra = {}) => ({
  "index.html": { file: "assets/index.js", isEntry: true, imports: ["_client.js"], dynamicImports: ["src/pages/Page.tsx"], css: ["assets/index.css"] },
  "_client.js": { file: "assets/client.js" },
  "src/pages/Page.tsx": { file: "assets/page.js", isDynamicEntry: true, imports: ["index.html", "_registry.js"], dynamicImports: ["src/Lazy.ts"] },
  "src/Lazy.ts": { file: "assets/lazy.js", isDynamicEntry: true },
  "_registry.js": { file: "assets/registry.js" },
  "render.html": { file: "assets/render.js", isEntry: true, imports: ["_client.js", "_registry.js"], css: ["assets/render.css"], dynamicImports: ["src/render/Kit.ts"] },
  "src/render/Kit.ts": { file: "assets/kit.js", isDynamicEntry: true, css: ["assets/kit.css"] },
  ...extra,
});
const scenarios = [{ name: "/page", page: "src/pages/Page.tsx", auto: ["src/Lazy.ts"] }];
const run = (m, opts = {}) => checkBundle({ manifest: m, sizeOf, scenarios, renderAuto: ["src/render/Kit.ts"], ...opts });

describe("checkBundle — 엔트리 이름 고정 · 렌더 문서 판정 (ADR-004 개정 2 결정 5)", () => {
  it("엔트리 2개 — 공통 = index.html 닫힘(렌더 엔트리를 공통으로 잡지 않는다) · 라우트 합계는 지금과 같은 방식", () => {
    const { lines, failures } = run(manifest());
    expect(failures).toEqual([]);
    expect(lines).toContain("[bundle] 공통 JS (gzip, 참고): 80.00KB");
    expect(lines).toContain("[bundle] /page 첫 화면 합계: 93.00KB / 예산 100KB · 진입 직후 자동 로드 포함: 123.00KB / 예산 125KB");
  });

  it("렌더 문서 = render.html 닫힘 + 자동 dynamic import · CSS = 그 범위의 css 합 · 공유 청크(앱과 같은 파일)는 양쪽에 세고 목록 출력", () => {
    const { lines } = run(manifest());
    // JS: render 5 + client 60 + registry 3 + kit.js 0 = 68 · CSS: render.css 4 + kit.css 2 = 6
    expect(lines).toContain("[bundle] 렌더 문서(render.html) JS 합계: 68.00KB / 예산 90KB · CSS 합계: 6.00KB / 예산 30KB");
    expect(lines).toContain("[bundle]   렌더 문서 중 앱과 공유: assets/client.js 60.00KB, assets/registry.js 3.00KB (합 63.00KB, 양쪽에 다 센다)");
  });

  it("render.html 엔트리가 없으면 실패", () => {
    const m = manifest();
    delete m["render.html"];
    expect(run(m).failures).toContain("렌더 문서: manifest에 render.html 엔트리가 없습니다");
  });

  it("index.html·render.html 밖의 엔트리가 있으면 실패(조용히 틀린 값 방지)", () => {
    const { failures } = run(manifest({ "other.html": { file: "assets/other.js", isEntry: true } }));
    expect(failures).toContain("manifest에 알 수 없는 엔트리 other.html — 엔트리는 index.html·render.html만 허용합니다");
  });

  it("index.html 엔트리가 없으면 실패", () => {
    const m = manifest();
    delete m["index.html"];
    expect(run(m).failures).toContain("앱: manifest에 index.html 엔트리가 없습니다");
  });

  it("렌더 문서 JS > 90 또는 CSS > 30이면 실패 · 렌더 자동 목록 키가 manifest에 없으면 실패", () => {
    const heavy = checkBundle({ manifest: manifest(), sizeOf: (f) => (f === "assets/render.js" ? 30 : f === "assets/render.css" ? 29 : sizeOf(f)), scenarios, renderAuto: ["src/render/Kit.ts"] });
    expect(heavy.failures).toEqual(["렌더 문서: JS 93.00KB > 90KB", "렌더 문서: CSS 31.00KB > 30KB"]);
    expect(run(manifest(), { renderAuto: ["src/render/Gone.ts"] }).failures).toContain("렌더 문서: manifest에 src/render/Gone.ts가 없습니다 (경로 변경 시 RENDER_AUTO를 고치세요)");
  });

  it("앱 라우트 예산 판정은 그대로 — 첫 화면 > 100 · 진입 직후 > 125 실패", () => {
    const { failures } = checkBundle({ manifest: manifest(), sizeOf: (f) => (f === "assets/page.js" ? 25 : sizeOf(f)), scenarios, renderAuto: [] });
    expect(failures).toEqual(["/page: 첫 화면 108.00KB > 100KB", "/page: 진입 직후 자동 로드 포함 138.00KB > 125KB"]);
  });
});

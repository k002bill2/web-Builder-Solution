// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkBundle, ROUTE_BUDGET_KB } from "./bundleBudget.mjs";

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

  it("시나리오별 진입 직후 한도(ADR-004 개정 3 — /studio 127) — 그 시나리오만 바뀌고 다른 시나리오는 125 그대로", () => {
    const bigger = (f) => (f === "assets/lazy.js" ? 33 : sizeOf(f));
    const both = [
      { name: "/page", page: "src/pages/Page.tsx", auto: ["src/Lazy.ts"], eagerBudgetKb: 127 },
      { name: "/other", page: "src/pages/Page.tsx", auto: ["src/Lazy.ts"] },
    ];
    const { lines, failures } = checkBundle({ manifest: manifest(), sizeOf: bigger, scenarios: both, renderAuto: [] });
    expect(lines).toContain("[bundle] /page 첫 화면 합계: 93.00KB / 예산 100KB · 진입 직후 자동 로드 포함: 126.00KB / 예산 127KB");
    expect(failures).toEqual(["/other: 진입 직후 자동 로드 포함 126.00KB > 125KB"]);
    const over = checkBundle({ manifest: manifest(), sizeOf: (f) => (f === "assets/lazy.js" ? 35 : sizeOf(f)), scenarios: both.slice(0, 1), renderAuto: [] });
    expect(over.failures).toEqual(["/page: 진입 직후 자동 로드 포함 128.00KB > 127KB"]);
  });

  it("시나리오별 첫 화면 한도(ADR-004 개정 7 — /catalog 101) — 그 시나리오만 바뀌고 다른 시나리오·기본값은 100 그대로", () => {
    expect(ROUTE_BUDGET_KB).toBe(100);
    const bigger = (f) => (f === "assets/page.js" ? 17.5 : sizeOf(f));
    const both = [
      { name: "/page", page: "src/pages/Page.tsx", auto: ["src/Lazy.ts"], routeBudgetKb: 101 },
      { name: "/other", page: "src/pages/Page.tsx", auto: ["src/Lazy.ts"] },
    ];
    const { lines, failures } = checkBundle({ manifest: manifest(), sizeOf: bigger, scenarios: both, renderAuto: [] });
    expect(lines).toContain("[bundle] /page 첫 화면 합계: 100.50KB / 예산 101KB · 진입 직후 자동 로드 포함: 130.50KB / 예산 125KB");
    expect(lines).toContain("[bundle] /other 첫 화면 합계: 100.50KB / 예산 100KB · 진입 직후 자동 로드 포함: 130.50KB / 예산 125KB");
    expect(failures).toEqual([
      "/page: 진입 직후 자동 로드 포함 130.50KB > 125KB",
      "/other: 첫 화면 100.50KB > 100KB",
      "/other: 진입 직후 자동 로드 포함 130.50KB > 125KB",
    ]);
    const over = checkBundle({ manifest: manifest(), sizeOf: (f) => (f === "assets/page.js" ? 18.5 : sizeOf(f)), scenarios: both.slice(0, 1), renderAuto: [] });
    expect(over.failures).toEqual(["/page: 첫 화면 101.50KB > 101KB", "/page: 진입 직후 자동 로드 포함 131.50KB > 125KB"]);
  });
});

/**
 * M2c 기준선 가드 (SPEC m2c 7절 · IMG-AC-29 · Codex r1 P2) — 한도(128·90·30)는 그대로 두고, 시작 실측 기준선 + 0.03 · 렌더 JS 멈춤선 89.70을 실패 조건으로 더한다.
 * baseline 미지정 = 개정 전 판정(한도만). 비교는 출력과 같은 소수 2자리.
 */
describe("checkBundle — M2c 기준선 가드 (IMG-AC-29)", () => {
  const BASE = { base: "test", eagerKb: { "/page": 123 }, toleranceKb: 0.03, renderJsStopKb: 89.7 };
  const sized = (over) => (f) => (f in over ? over[f] : sizeOf(f));
  const judge = (over, baseline = BASE) => checkBundle({ manifest: manifest(), sizeOf: sized(over), scenarios, renderAuto: ["src/render/Kit.ts"], baseline });

  it("개정 전후 — 한도 안(진입 123.47 < 125 · 렌더 JS 89.80 < 90)이라 개정 전은 통과, 기준선 + 0.03 · 멈춤선 89.70 위라 개정 뒤는 실패", () => {
    const over = { "assets/lazy.js": 30.47, "assets/render.js": 26.8 };
    expect(checkBundle({ manifest: manifest(), sizeOf: sized(over), scenarios, renderAuto: ["src/render/Kit.ts"] }).failures).toEqual([]);
    expect(judge(over).failures).toEqual(["/page: 진입 직후 자동 로드 포함 123.47KB > 기준선 123.00KB + 0.03KB", "렌더 문서: JS 89.80KB > 멈춤선 89.70KB"]);
  });

  it("진입 경계 — 기준선 + 0.03(123.03) 통과 · 123.04 실패", () => {
    expect(judge({ "assets/lazy.js": 30.03 }).failures).toEqual([]);
    expect(judge({ "assets/lazy.js": 30.04 }).failures).toEqual(["/page: 진입 직후 자동 로드 포함 123.04KB > 기준선 123.00KB + 0.03KB"]);
  });

  it("렌더 JS 경계 — 89.70 통과 · 89.71 실패 (한도 90은 그대로)", () => {
    expect(judge({ "assets/render.js": 26.7 }).failures).toEqual([]);
    expect(judge({ "assets/render.js": 26.71 }).failures).toEqual(["렌더 문서: JS 89.71KB > 멈춤선 89.70KB"]);
  });

  it("기준선 출력 줄 · 기준선 없는 시나리오는 한도 판정만(다른 시나리오 불변)", () => {
    const both = [...scenarios, { name: "/other", page: "src/pages/Page.tsx", auto: ["src/Lazy.ts"] }];
    const { lines, failures } = checkBundle({ manifest: manifest(), sizeOf: sized({ "assets/lazy.js": 31 }), scenarios: both, renderAuto: [], baseline: BASE });
    expect(lines).toContain("[bundle]   /page M2c 기준선 123.00KB + 0.03KB (멈춤 > 123.03KB)");
    expect(failures).toEqual(["/page: 진입 직후 자동 로드 포함 124.00KB > 기준선 123.00KB + 0.03KB"]);
  });

  it("기준선 파일 없음·형식 틀림·없는 시나리오 이름 = 실패(조용히 건너뛰지 않음)", () => {
    expect(judge({}, null).failures).toContain("M2c 기준선 파일이 없거나 형식이 틀립니다 (scripts/m2cBaseline.json)");
    expect(judge({}, { ...BASE, toleranceKb: "0.03" }).failures).toContain("M2c 기준선 파일이 없거나 형식이 틀립니다 (scripts/m2cBaseline.json)");
    expect(judge({}, { ...BASE, eagerKb: { "/gone": 1 } }).failures).toContain("M2c 기준선: 시나리오 /gone가 SCENARIOS에 없습니다");
  });

  it("기준선 파일 = /studio 감량분 잠금 기준선 고정(ADR-004 개정 8 · 8596c43 · /studio 진입 128.19 · 허용 0.03 · 렌더 JS 멈춤선 89.70) — 배분 레인이 올리면 이 기대값도 그 커밋에서 함께 갱신", () => {
    const file = JSON.parse(readFileSync(new URL("./m2cBaseline.json", import.meta.url), "utf8"));
    expect(file).toMatchObject({ base: "8596c43", eagerKb: { "/studio/:projectId": 128.19 }, toleranceKb: 0.03, renderJsStopKb: 89.7 });
    expect(Object.keys(file.eagerKb)).toEqual(["/studio/:projectId"]);
  });
});

describe("조작 뒤 보고 목록 (B-M2C-02 · IMG-AC-29) — 보고용 키 추가만, 판정 불변", () => {
  it("/studio 조작 뒤 목록에 이미지 패널·변환기 키 — imageStore·exportImages는 이름 없는 공유 청크라 이 두 키·exportFlow 닫힘에 집계된다", () => {
    const source = readFileSync(new URL("./check-bundle-size.mjs", import.meta.url), "utf8");
    const list = /const STUDIO_AFTER_ACTION = \[([\s\S]*?)\];/.exec(source)?.[1] ?? "";
    expect(list).toContain('"src/components/studio/ImageSlotPanel.tsx"');
    expect(list).toContain('"src/features/studio/images/ingest/index.ts"');
  });

  it("afterAction 키를 더해도 failures·합계 줄은 같고 '조작 뒤' 줄만 늘어난다", () => {
    const m = manifest({ "src/After.ts": { file: "assets/after.js", isDynamicEntry: true, imports: ["_client.js"] } });
    const sizes = (f) => (f === "assets/after.js" ? 7 : f === "assets/page.js" ? 25 : sizeOf(f));
    const judge = (afterAction) => checkBundle({ manifest: m, sizeOf: sizes, scenarios: [{ ...scenarios[0], afterAction }], renderAuto: [] });
    const before = judge([]);
    const after = judge(["src/After.ts"]);
    expect(after.failures).toEqual(before.failures);
    expect(before.failures.length).toBeGreaterThan(0);
    expect(after.lines.filter((line) => !line.includes("조작 뒤"))).toEqual(before.lines);
    expect(after.lines.filter((line) => line.includes("조작 뒤"))).toEqual(["[bundle]   /page 조작 뒤 src/After.ts: +7.00KB (1개 파일, 예산 판정 밖)"]);
  });
});

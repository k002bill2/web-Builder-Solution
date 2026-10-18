// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 추천 청크 import 간선 가드 (B-M3-04 · M3-1 QA note 5) — 로드 조건 단위 테스트(CatalogPageRecoLoad)는 로더 호출 수만 재서
 * 정적 side-effect import(m4-b)·로더 안쪽 정적 import(m4-c)를 못 잡고, 검사기(build)는 0.54KB 미만 정적 포함을 못 잡는다.
 * 여기서는 크기와 무관하게 간선 자체를 본다: RecoView·RecoApply·recoApplyFlow 는 어떤 소스도 정적(`import … from`·`export … from`·
 * 부수효과 `import "…"`)으로 끌어오지 않고, 동적 `import("…")` 은 로더 2개에만 있다. `import type`·`typeof import(…)` 은 번들에 남지 않아 허용.
 */
const SRC = fileURLToPath(new URL("../", import.meta.url));
const LAZY = /(^|\/)(RecoView|RecoApply|recoApplyFlow)(\.tsx?)?$/;
const STATIC = /\b(?:import|export)\s+(?!type\b)[^"';]*?\bfrom\s*["']([^"']+)["']|\bimport\s+["']([^"']+)["']/g;
const DYNAMIC = /(?<!\btypeof\s{0,8})\bimport\s*\(\s*["'`]([^"'`]+)["'`]/g;

export function lazyEdges(text: string): { readonly kind: "static" | "dynamic"; readonly spec: string }[] {
  const statics = [...text.matchAll(STATIC)].map((m) => m[1] ?? m[2] ?? "").filter((s) => LAZY.test(s));
  const dynamics = [...text.matchAll(DYNAMIC)].map((m) => m[1] ?? "").filter((s) => LAZY.test(s));
  return [...statics.map((spec) => ({ kind: "static" as const, spec })), ...dynamics.map((spec) => ({ kind: "dynamic" as const, spec }))];
}

const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return sources(path);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [path] : [];
  });

describe("recoImportGuard — 검출기 자체", () => {
  it("정적·재수출·부수효과·동적 import 를 잡고 import type·typeof import·다른 모듈은 통과", () => {
    const text = [
      'import RecoView from "../components/reco/RecoView";',
      'export * from "./recoApplyFlow";',
      'import "../components/reco/RecoView";',
      'import * as Apply from "./RecoApply.tsx";',
      'const m = await import("./RecoView");',
      'import type { ApplyPlan } from "./recoApplyFlow";',
      'type T = (typeof import("../components/reco/RecoView"))["default"];',
      'import { loadRecoApply } from "./recoApplyLoader";',
    ].join("\n");
    expect(lazyEdges(text).map((e) => e.kind)).toEqual(["static", "static", "static", "static", "dynamic"]);
  });
});

describe("recoImportGuard — 소스 전체", () => {
  const files = sources(SRC).map((path) => ({ file: relative(SRC, path), edges: lazyEdges(readFileSync(path, "utf8")) }));

  it("추천 청크를 정적으로 끌어오는 소스 0 (크기 무관)", () => {
    expect(files.flatMap(({ file, edges }) => edges.filter((e) => e.kind === "static").map((e) => `${file} → ${e.spec}`))).toEqual([]);
  });

  it("동적 import 는 로더 2개에만 — recoLoader(RecoView) · recoApplyLoader(RecoApply·recoApplyFlow)", () => {
    const dynamics = files.flatMap(({ file, edges }) => edges.filter((e) => e.kind === "dynamic").map((e) => `${file} → ${e.spec}`));
    expect(dynamics.sort()).toEqual([
      "components/reco/recoApplyLoader.ts → ./RecoApply",
      "components/reco/recoApplyLoader.ts → ./recoApplyFlow",
      "components/reco/recoLoader.ts → ./RecoView",
    ]);
  });
});

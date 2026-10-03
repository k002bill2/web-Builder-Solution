// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 렌더 문서 탑재 가드 (ADR-004 개정 2 결정 3 · engineImportGuard.test.ts와 같은 방식) — render.html 엔트리(src/render/main.tsx)에서
 * import를 따라간 **전체 그래프**에 앱 DS 컴포넌트(components/ds) · 엔진 문서 연산(engine/ops) · 게이트(engine/gate) · zod가 0개.
 * `import type`은 번들에 남지 않으므로 따라가지 않는다. 받은 문서 재검증(validatePageDoc)은 그래프에 있어야 한다.
 */
const SRC = fileURLToPath(new URL("../", import.meta.url));
const ENTRY = join(SRC, "render/main.tsx");

/** 값 import(정적 · export from · dynamic · 부작용)의 지정자 — `import type`·`export type` 제외 */
const SPECIFIER = /(?:\b(?:import|export)\s+(?!type\b)[^"';]*?\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"']+)["']/g;

const FORBIDDEN: readonly { readonly name: string; readonly test: (spec: string, target: string | undefined) => boolean }[] = [
  { name: "components/ds", test: (_s, t) => t !== undefined && t.startsWith(join(SRC, "components/ds")) },
  { name: "engine/ops", test: (_s, t) => t !== undefined && t.startsWith(join(SRC, "engine/ops")) },
  { name: "engine/gate", test: (_s, t) => t !== undefined && t.startsWith(join(SRC, "engine/gate")) },
  { name: "zod", test: (s) => s === "zod" || s.startsWith("zod/") },
];

function resolveFile(fromFile: string, spec: string, read: (path: string) => string | undefined): string | undefined {
  if (!spec.startsWith(".")) return undefined;
  const base = resolve(dirname(fromFile), spec);
  return [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find((p) => /\.(ts|tsx|css)$/.test(p) && read(p) !== undefined);
}

/** 엔트리에서 값 import를 따라간 파일 · 위반 목록 (readFile 주입 — 탐지기 자체 검사용) */
export function renderGraph(entry: string, read: (path: string) => string | undefined) {
  const files = new Set<string>();
  const violations: string[] = [];
  const visit = (file: string) => {
    if (files.has(file)) return;
    files.add(file);
    const text = read(file);
    if (text === undefined || file.endsWith(".css")) return;
    for (const [, spec] of text.matchAll(SPECIFIER)) {
      const next = resolveFile(file, spec!, read);
      const target = next ?? (spec!.startsWith(".") ? resolve(dirname(file), spec!) : undefined);
      for (const rule of FORBIDDEN) if (rule.test(spec!, target)) violations.push(`${relative(SRC, file)} → ${spec} (${rule.name})`);
      if (next) visit(next);
    }
  };
  visit(entry);
  return { files: [...files].map((f) => relative(SRC, f)), violations };
}

const readSource = (path: string) => (existsSync(path) && !path.endsWith("/") ? readFileSync(path, "utf8") : undefined);

describe("렌더 문서 import 가드 (ADR-004 개정 2 결정 3)", () => {
  it("render/main.tsx 그래프에 components/ds · engine/ops · engine/gate · zod 0개 · validatePageDoc·폴백은 있다", () => {
    const { files, violations } = renderGraph(ENTRY, readSource);
    expect(violations).toEqual([]);
    expect(files).toContain("engine/validate/validatePageDoc.ts");
    expect(files).toContain("render/fallback/canvasLayouts.ts");
  });

  it("탐지기 자체 검사 — 그래프를 따라가 간접 import까지 잡고, import type은 따라가지 않는다", () => {
    const at = (rel: string) => join(SRC, rel);
    const fake: Record<string, string> = {
      [at("render/main.tsx")]: 'import { a } from "./a";\nimport type { T } from "../engine/gate/types";\nimport "./style.css";',
      [at("render/a.ts")]: 'export { b } from "../engine/validate/validatePageDoc";\nconst m = import("../components/ds/Button");',
      [at("render/style.css")]: "",
    };
    const read = (p: string) => fake[p] ?? readSource(p);
    const { violations } = renderGraph(at("render/main.tsx"), read);
    expect(violations).toContain("render/a.ts → ../components/ds/Button (components/ds)");
    expect(violations.some((v) => v.includes("engine/gate"))).toBe(false);
    // 실제 파일로 간접 경로: validatePageDoc → reader … zod·ops·gate 없음
    expect(violations.some((v) => v.includes("zod"))).toBe(false);
    expect(renderGraph(at("render/main.tsx"), (p) => (p === at("render/main.tsx") ? 'import { z } from "zod";' : undefined)).violations).toEqual(["render/main.tsx → zod (zod)"]);
    expect(renderGraph(at("render/main.tsx"), (p) => (p === at("render/main.tsx") ? 'import { applyOp } from "../engine/ops/sectionOps";' : undefined)).violations).toEqual([
      "render/main.tsx → ../engine/ops/sectionOps (engine/ops)",
    ]);
  });
});

// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * pendingWrites import 간선 가드 (RS3-AC-12 대응 · rs23-port 항목 5) — 편집기·저장·메모리 저장소·후보 화면이
 * features/pending/pendingWrites 를 정적(`import … from`·`export … from`·부수효과 `import "…"`)으로도
 * 동적(`import("…")`)으로도 끌어오지 않는다. `import type` 은 번들에 남지 않아 허용한다.
 */
const SRC = fileURLToPath(new URL("../", import.meta.url));
const FILES = [
  "pages/StudioPage.tsx",
  "components/studio/StudioLayout.tsx",
  "features/studio/useDocSave.ts",
  "data/memoryProjectRepository.ts",
  "features/profile/CandidatesSection.tsx",
] as const;

const STATIC = /\b(?:import|export)\s+(?!type\b)[^"';]*?\bfrom\s*["']([^"']+)["']|\bimport\s+["']([^"']+)["']/g;
const DYNAMIC = /\bimport\s*\(\s*["'`]([^"'`]+)["'`]/g;
const isPending = (spec: string) => /(^|\/)pendingWrites(\.tsx?)?$/.test(spec);

export function pendingEdges(text: string): { readonly kind: "static" | "dynamic"; readonly spec: string }[] {
  const statics = [...text.matchAll(STATIC)].map((m) => m[1] ?? m[2] ?? "").filter(isPending);
  const dynamics = [...text.matchAll(DYNAMIC)].map((m) => m[1] ?? "").filter(isPending);
  return [...statics.map((spec) => ({ kind: "static" as const, spec })), ...dynamics.map((spec) => ({ kind: "dynamic" as const, spec }))];
}

describe("pendingImportGuard — 검출기 자체", () => {
  it("정적·재수출·부수효과·동적 import 를 잡고 import type·다른 모듈은 통과", () => {
    const text = [
      'import { readPending } from "../features/pending/pendingWrites";',
      'export { x } from "./pendingWrites.ts";',
      'import "../pending/pendingWrites";',
      'const m = await import("../features/pending/pendingWrites");',
      'import type { Pending } from "../features/pending/pendingWrites";',
      'import { y } from "../features/projects/pendingRows";',
    ].join("\n");
    expect(pendingEdges(text).map((e) => e.kind)).toEqual(["static", "static", "static", "dynamic"]);
  });
});

describe("pendingImportGuard — 대상 파일 간선 0", () => {
  it.each(FILES)("%s → pendingWrites 정적·동적 간선 0", (rel) => {
    const text = readFileSync(join(SRC, rel), "utf8");
    expect(pendingEdges(text)).toEqual([]);
  });
});

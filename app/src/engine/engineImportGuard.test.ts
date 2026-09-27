// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 번들 가드 (브리프 L4a 2·4절) — engine/ 밖 비테스트 파일이 engine을 import하지 않는다 → 화면 번들 영향 0.
 * 예외(EDITOR-A2 브리프 4절 · a2 D 레인 첫 커밋): 편집기 라우트 lazy 청크(`pages/StudioPage.tsx` · `components/studio/**` ·
 * `features/studio/**`)와 조작 뒤 청크(`data/startDocWrite.ts` — "편집 시작" onClick에서 로드)만 engine을 부를 수 있다.
 */
const SRC = fileURLToPath(new URL("../", import.meta.url));
const ENGINE = join(SRC, "engine");

/** 정적 import · export from · dynamic import() · 부작용 import의 모듈 지정자 */
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"']+)["']/g;

/** 상대 경로는 풀어서 engine/ 안인지 보고, 별칭 경로(예: "@/engine/…")는 경로 조각으로 본다 */
function pointsToEngine(fromFile: string, spec: string): boolean {
  if (!spec.startsWith(".")) return /(^|\/)engine(\/|$)/.test(spec);
  const target = resolve(dirname(fromFile), spec);
  return target === ENGINE || target.startsWith(`${ENGINE}/`);
}

/** SRC 기준 경로 — 정확히 같은 파일 또는 `/**` 접두 디렉터리 */
const ENGINE_IMPORT_ALLOWED: readonly string[] = ["pages/StudioPage.tsx", "components/studio/**", "features/studio/**", "data/startDocWrite.ts"];

function isAllowed(relPath: string): boolean {
  return ENGINE_IMPORT_ALLOWED.some((rule) => (rule.endsWith("/**") ? relPath.startsWith(rule.slice(0, -2)) : relPath === rule));
}

function engineImporters(files: readonly { readonly path: string; readonly text: string }[]): string[] {
  return files
    .filter(({ path, text }) => [...text.matchAll(SPECIFIER)].some(([, spec]) => pointsToEngine(path, spec!)))
    .map(({ path }) => relative(SRC, path))
    .filter((rel) => !isAllowed(rel));
}

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const productFiles = listFiles(SRC)
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .filter((f) => !f.startsWith(`${ENGINE}/`) && !/\.test\.tsx?$/.test(f));

describe("엔진 import 가드 (번들 0)", () => {
  it("engine/ 밖 비테스트 파일 중 허용 목록 밖에서 engine을 import하는 파일 0개", () => {
    expect(productFiles.length).toBeGreaterThan(20);
    const files = productFiles.map((path) => ({ path, text: readFileSync(path, "utf8") }));
    expect(engineImporters(files)).toEqual([]);
  });

  it("탐지기 자체 검사 — 정적·동적·re-export·부작용 import를 잡고, 이름만 비슷한 경로는 잡지 않는다", () => {
    const at = (name: string) => join(SRC, "pages", name);
    const files = [
      { path: at("A.tsx"), text: 'import { hashDoc } from "../engine/ops/hash";' },
      { path: at("B.tsx"), text: 'const m = await import("../engine/ops/sectionOps");' },
      { path: at("C.ts"), text: 'export { validatePageDoc } from "../engine/validate/validatePageDoc";' },
      { path: at("D.ts"), text: 'import "../engine/freeze";' },
      { path: at("E.ts"), text: 'import type { PageDoc } from "../engine/contracts/pageDoc";' },
      { path: at("F.ts"), text: 'import { x } from "../features/profile/profileEngine";' },
      { path: at("G.ts"), text: 'import { y } from "./engineering";' },
      { path: at("H.ts"), text: 'import { z } from "@/engine/ops/hash";' },
    ];
    expect(engineImporters(files)).toEqual(["pages/A.tsx", "pages/B.tsx", "pages/C.ts", "pages/D.ts", "pages/E.ts", "pages/H.ts"]);
  });

  it("허용 목록 — 편집기 라우트·startDocWrite만 통과하고, 이웃 경로(StudioPage 외 pages·data 다른 파일·접두만 같은 디렉터리)는 잡는다", () => {
    const spec = 'import { hashDoc } from "../engine/ops/hash";';
    const at = (rel: string) => ({ path: join(SRC, rel), text: rel.split("/").length > 2 ? spec.replace("../", "../../") : spec });
    const files = [
      at("pages/StudioPage.tsx"),
      at("components/studio/StudioToolbar.tsx"),
      at("features/studio/useStudioDoc.ts"),
      at("data/startDocWrite.ts"),
      at("pages/ProfilePage.tsx"),
      at("data/memoryProjectRepository.ts"),
      at("data/engineVariantMap.ts"),
      at("components/studioX/Leak.tsx"),
      at("features/profile/CandidatesSection.tsx"),
    ];
    expect(engineImporters(files)).toEqual([
      "pages/ProfilePage.tsx",
      "data/memoryProjectRepository.ts",
      "data/engineVariantMap.ts",
      "components/studioX/Leak.tsx",
      "features/profile/CandidatesSection.tsx",
    ]);
  });
});

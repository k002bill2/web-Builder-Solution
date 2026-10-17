// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * RS6-AC-G2 import 그래프 가드(INTEGRATE-6 2.2-3 · QA R3) — 같은 탭 어댑터 1개(BD-1) 조건을 구조로 고정한다.
 * - `openIdbPersistence` 호출 = `localSync.ts` 1곳 · `openLocalSync` 호출 = DocBook 청크 로더 + 저장소 `openLocal` 1쌍
 * - 코어 모듈(save/saveCore·coreIo) → `idbPersistence`·`persistence/` 값 import 0 · 코어 io(coreIo)는 진입 closure 밖(DocBook 청크만 import)
 * - IndexedDB 전역(`indexedDB`) 참조 파일 목록 고정 · `indexedDB.` 직접 호출 0
 * - RS6-AC-U15: localSync 이미지 키 = imageRecordId 경유만
 */
const SRC = fileURLToPath(new URL("../../../", import.meta.url));
const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
const product = listFiles(SRC)
  .filter(
    (f) =>
      /\.(ts|tsx)$/.test(f) &&
      !/\.test\.tsx?$/.test(f) &&
      !f.endsWith("save/testRig.ts") &&
      // 테스트 장치(RS6-L3b CP-A — 코어 있는 저장소 흉내, testRig와 같은 테스트 전용)
      !f.endsWith("testing/coreFixture.ts"),
  )
  .map((path) => ({
    rel: relative(SRC, path),
    text: readFileSync(path, "utf8"),
  }));
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");
/** 값 import(정적·재수출·부수효과·동적) 지정자 — `import type`은 번들에 남지 않아 뺀다 */
const valueSpecs = (source: string) => {
  const text = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return [
    ...[
      ...text.matchAll(
        /\b(?:import|export)\s+(?!type\b)[^"';]*?\bfrom\s*["']([^"']+)["']|\bimport\s+["']([^"']+)["']/g,
      ),
    ].map((m) => m[1] ?? m[2] ?? ""),
    ...[...text.matchAll(/\bimport\s*\(\s*["'`]([^"'`]+)["'`]/g)].map(
      (m) => m[1] ?? "",
    ),
  ];
};
const using = (pattern: RegExp) =>
  product
    .filter(({ text }) => pattern.test(text))
    .map(({ rel }) => rel)
    .sort();

describe("RS6-AC-G2 저장 코어 import 가드", () => {
  it("openIdbPersistence 호출 = localSync.ts 1곳(정의 파일 제외)", () => {
    expect(
      using(/openIdbPersistence/).filter(
        (rel) => rel !== "data/persistence/idbPersistence.ts",
      ),
    ).toEqual(["data/persistence/localSync.ts"]);
  });

  it("openLocalSync 호출 = DocBook 청크 로더(memoryDocBook) + 저장소 openLocal(memoryProjectRepository)뿐", () => {
    expect(using(/\.openLocalSync\(/)).toEqual([
      "data/memoryDocBook.ts",
      "data/memoryProjectRepository.ts",
    ]);
    expect(
      read("data/memoryProjectRepository.ts").match(/\.openLocalSync\(/g),
    ).toHaveLength(1);
  });

  it("코어 모듈은 영속 어댑터·persistence 값을 import하지 않는다(포트만)", () => {
    for (const rel of [
      "features/studio/save/saveCore.ts",
      "features/studio/save/coreIo.ts",
    ]) {
      expect(
        valueSpecs(read(rel)).filter((spec) =>
          /persistence|idbPersistence/.test(spec),
        ),
      ).toEqual([]);
    }
  });

  it("코어 io(coreIo)는 진입 closure 밖 — 값 import = DocBook 청크(memoryDocBook) 1곳 · 상태부·싱크·저장소는 타입만(④b)", () => {
    expect(
      product
        .filter(({ text }) =>
          valueSpecs(text).some((spec) => /save\/coreIo$/.test(spec)),
        )
        .map(({ rel }) => rel),
    ).toEqual(["data/memoryDocBook.ts"]);
    expect(valueSpecs(read("features/studio/save/saveCore.ts"))).toEqual([]);
    expect(
      valueSpecs(read("data/persistence/localSync.ts")).filter((spec) =>
        spec.includes("save/"),
      ),
    ).toEqual([]);
  });

  it("IndexedDB 전역 참조 파일 목록 고정 · `indexedDB.` 직접 호출 0", () => {
    expect(using(/\bindexedDB\./)).toEqual([]);
    expect(using(/\bindexedDB\b/)).toEqual([
      "components/projects/BrowserStorageSection.tsx",
      "components/projects/DeleteProjectDialogSlot.tsx",
      "components/projects/ExportProjectFileDialogSlot.tsx",
      "components/projects/ImportProjectFileDialogSlot.tsx",
      "data/persistence/entryRead.ts",
      "data/persistence/idbPersistence.ts",
    ]);
  });

  it("RS6-AC-U15 localSync 이미지 키 = imageRecordId 경유만(`${projectId}/` 직접 조립 0)", () => {
    const text = read("data/persistence/localSync.ts");
    expect(text.match(/\$\{projectId\}\//g) ?? []).toEqual([]);
    expect(text).toContain("imageRecordId(projectId");
  });
});

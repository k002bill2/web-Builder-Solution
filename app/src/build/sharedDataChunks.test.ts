// @vitest-environment node
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SHARED_DATA_CHUNKS, sharedDataChunkGroups } from "./sharedDataChunks";

const APP = fileURLToPath(new URL("../../", import.meta.url));

describe("sharedDataChunks (RS6-L4 M2c·M2d — 함께 받는 작은 공유 모듈 합침)", () => {
  it("목록의 경로는 모두 실제 파일이다 (오타·이동이면 조용히 청크가 다시 갈라진다)", () => {
    for (const { modules } of SHARED_DATA_CHUNKS) for (const path of modules) expect(existsSync(`${APP}${path}`), path).toBe(true);
  });

  it("그룹 2개(projectRepository · profileContrast) — 이름·목록 고정", () => {
    expect(SHARED_DATA_CHUNKS.map((c) => [c.name, [...c.modules]])).toEqual([
      ["projectRepository", ["src/data/projectRepository.ts", "src/features/projects/useProjectRepository.ts"]],
      ["profileContrast", ["src/domain/profileContrast.ts", "src/domain/effectiveProfile.ts"]],
    ]);
  });

  it("그룹 test = 목록 모듈만 — 절대 경로 끝이 정확히 같을 때만 · 의존 재귀 0", () => {
    const [repo, profile] = sharedDataChunkGroups();
    expect(repo!.test(`${APP}src/data/projectRepository.ts`)).toBe(true);
    expect(repo!.test(`${APP}src/features/projects/useProjectRepository.ts`)).toBe(true);
    expect(repo!.test(`${APP}src/data/projectRepository.test.ts`)).toBe(false);
    expect(repo!.test(`${APP}src/domain/profileContrast.ts`)).toBe(false);
    expect(profile!.test(`${APP}src/domain/effectiveProfile.ts`)).toBe(true);
    expect(profile!.test(`${APP}src/other/src/domain/effectiveProfile.tsx`)).toBe(false);
    expect(sharedDataChunkGroups().every((g) => g.includeDependenciesRecursively === false)).toBe(true);
  });
});

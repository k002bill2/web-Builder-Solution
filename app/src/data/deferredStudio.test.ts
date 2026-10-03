/**
 * STUDIO-SLIM 앱 배선: main의 deferredStudio는 store + 프로필만 바로 만들고, 보드·생성·프로젝트 구현은 처음 부를 때 받는다.
 * (1) `/studio`·`/projects` 진입이 부르는 것(프로필 조회 · 프로젝트)만으로는 보드·생성 구현 import 0
 * (2) 같은 팩토리로 확정 → 프로필 → 3안 → startDoc이 store 하나로 이어진다 (DS-2A-04 6.3 · DS-2A-05 8.3.1).
 */
import { describe, expect, it, vi } from "vitest";
import { isTerminal } from "../domain/generation";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "./deferredStudio";

/** 호출 기록용 import — 보드는 테스트 보드(ref-a 기준)로 시작한다 */
function recordedImports() {
  const imports = {
    board: vi.fn(async () => {
      const mod = await STUDIO_IMPORTS.board();
      return {
        ...mod,
        createMemoryCompareBoardRepository: (options: Parameters<typeof mod.createMemoryCompareBoardRepository>[0]) =>
          mod.createMemoryCompareBoardRepository({ ...options, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }) }),
      };
    }),
    generations: vi.fn(STUDIO_IMPORTS.generations),
    projects: vi.fn(STUDIO_IMPORTS.projects),
  };
  return imports;
}

describe("createDeferredStudio — 진입은 보드·생성 구현을 받지 않는다", () => {
  it("프로필 조회 + 프로젝트 목록만 부르면 보드·생성 import 0, 카탈로그 로드 0", async () => {
    const imports = recordedImports();
    const loadCatalog = vi.fn(async () => FIXTURE_CATALOG);
    const studio = createDeferredStudio(loadCatalog, imports);
    expect(await studio.profiles.getProfile("profile-1")).toBeUndefined();
    expect(await (await studio.projects()).listProjects()).toEqual([]);
    expect(imports.projects).toHaveBeenCalledTimes(1);
    expect(imports.board).not.toHaveBeenCalled();
    expect(imports.generations).not.toHaveBeenCalled();
    expect(loadCatalog).not.toHaveBeenCalled();
  });

  it("보드·생성·프로젝트는 부를 때마다 같은 인스턴스(import 1회)", async () => {
    const imports = recordedImports();
    const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports);
    const [b1, b2] = await Promise.all([studio.board(), studio.board()]);
    expect(b1).toBe(b2);
    expect(await studio.generations()).toBe(await studio.generations());
    expect(await studio.projects()).toBe(await studio.projects());
    expect([imports.board, imports.generations, imports.projects].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
  });
});

describe("createDeferredStudio — 확정 → 프로필 → 3안 → startDoc이 store 하나", () => {
  it("보드 확정한 버전을 프로필·생성·프로젝트가 읽고, B안으로 편집을 시작한다", async () => {
    const studio = createDeferredStudio(async () => FIXTURE_CATALOG, recordedImports());
    const board = await studio.board();
    expect(await board.confirmProfile(1, 0)).toEqual({ profileId: "profile-1", version: 1 });
    expect((await studio.profiles.getProfile("profile-1"))?.project).toEqual({ projectId: "project-1", name: "모던 카페 브랜드 프로젝트" });
    const gen = await studio.generations();
    let job = await gen.requestGeneration("profile-1", 1);
    for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
    expect(job.state).toBe("succeeded");
    const projects = await studio.projects();
    const started = await projects.startDoc("project-1", 1, "B", "create");
    expect(started.doc).toMatchObject({ projectId: "project-1", revision: 1, candidateId: "B", profileVersion: 1 });
    expect(await projects.listProjects()).toEqual([expect.objectContaining({ projectId: "project-1", profileId: "profile-1", hasDoc: true })]);
  });
});

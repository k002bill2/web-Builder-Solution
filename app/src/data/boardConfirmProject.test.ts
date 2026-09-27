/**
 * 보드 확정 = 프로젝트 만들기/고르기 (DS-2A-05 2.1 · 2.5 · 12.2 — J-AC-04·06·07) + 프로젝트 메모리 저장소(8.3 목록·이름 바꾸기, J-AC-08 데이터).
 * 보드·프로필·프로젝트가 store 하나를 쓰므로 memoryStudio로 만든다.
 */
import { describe, expect, it } from "vitest";
import { defaultProjectName } from "../domain/projectName";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { CompareBoardError } from "./compareBoardRepository";
import type { BoardCall } from "./memoryCompareBoardRepository";
import { createMemoryStudio } from "./memoryStudio";
import { ProjectRepositoryError } from "./projectRepository";

const IDS = ["ref-a", "ref-b", "ref-c"];
const NOW = () => "2026-09-27T00:00:00.000Z";
const studioWith = (fail?: (call: BoardCall) => Error | undefined) =>
  createMemoryStudio({ catalog: FIXTURE_CATALOG, now: NOW, initialBoard: boardOf(IDS, { hero: "ref-a" }), ...(fail && { fail }) });
/** 응답 실패 = 커밋 뒤 응답 전에 거부(`delay` response 지점) */
const studioRejectingResponse = (reject: (call: BoardCall) => boolean) =>
  createMemoryStudio({
    catalog: FIXTURE_CATALOG,
    now: NOW,
    initialBoard: boardOf(IDS, { hero: "ref-a" }),
    delay: (call) => (call.phase === "response" && reject(call) ? Promise.reject(new Error("응답 실패")) : undefined),
  });

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    if (error instanceof CompareBoardError || error instanceof ProjectRepositoryError) return error.code;
    return String(error);
  }
}

describe("defaultProjectName (2.1)", () => {
  it("'<기준 레퍼런스 제목> 프로젝트', 같은 이름이 있으면 ' 2'·' 3'…", () => {
    expect(defaultProjectName("모던 카페 브랜드", [])).toBe("모던 카페 브랜드 프로젝트");
    expect(defaultProjectName("모던 카페 브랜드", ["모던 카페 브랜드 프로젝트"])).toBe("모던 카페 브랜드 프로젝트 2");
    expect(defaultProjectName("모던 카페 브랜드", ["모던 카페 브랜드 프로젝트", "모던 카페 브랜드 프로젝트 2"])).toBe("모던 카페 브랜드 프로젝트 3");
    expect(defaultProjectName("모던 카페 브랜드", ["모던 카페 브랜드 프로젝트 2"])).toBe("모던 카페 브랜드 프로젝트");
  });
});

describe("J-AC-04 첫 확정 → 프로젝트 1개", () => {
  it("이름 = 기준 레퍼런스 제목 + ' 프로젝트', 보드 confirmed가 프로젝트를 가리킨다", async () => {
    const studio = studioWith();
    expect(await studio.board.confirmProfile(1, 0)).toEqual({ profileId: "profile-1", version: 1 });
    const projects = await (await studio.projects()).listProjects();
    expect(projects).toEqual([
      expect.objectContaining({ projectId: "project-1", name: "모던 카페 브랜드 프로젝트", revision: 1, profileId: "profile-1", baseReferenceId: "ref-a", latestProfileVersion: 1, hasDoc: false }),
    ]);
    expect((await studio.board.getBoard()).board.confirmed).toMatchObject({ profileId: "profile-1", projectId: "project-1", projectName: "모던 카페 브랜드 프로젝트" });
    expect((await studio.profiles.getProfile("profile-1"))?.project).toEqual({ projectId: "project-1", name: "모던 카페 브랜드 프로젝트" });
  });

  it("현재 프로젝트 새 버전(current)은 프로젝트를 더 만들지 않는다", async () => {
    const studio = studioWith();
    await studio.board.confirmProfile(1, 0);
    const changed = await studio.board.savePicks({ hero: "ref-c" }, {}, 1);
    expect(await studio.board.createProfileVersion("profile-1", changed.revision, 1, "current")).toEqual({ profileId: "profile-1", version: 2 });
    expect((await (await studio.projects()).listProjects()).map((p) => [p.projectId, p.latestProfileVersion])).toEqual([["project-1", 2]]);
  });
});

describe("J-AC-06 새 프로젝트로 확정 (target new)", () => {
  it("새 계열 v1 + 새 프로젝트, 기존 프로젝트·계열 불변, 보드 confirmed = 새 프로젝트", async () => {
    const studio = studioWith();
    await studio.board.confirmProfile(1, 0);
    const repo = await studio.projects();
    const [before] = await repo.listProjects();
    const oldSeries = await studio.profiles.getProfile("profile-1");
    const oldSnapshot = structuredClone(oldSeries);
    const changed = await studio.board.savePicks({ hero: "ref-a", palette: "ref-b" }, {}, 1);
    expect(await studio.board.createProfileVersion("profile-1", changed.revision, 0, "new")).toEqual({ profileId: "profile-2", version: 1 });
    const projects = await repo.listProjects();
    expect(projects.map((p) => [p.projectId, p.name, p.profileId])).toEqual(
      expect.arrayContaining([
        ["project-1", "모던 카페 브랜드 프로젝트", "profile-1"],
        ["project-2", "모던 카페 브랜드 프로젝트 2", "profile-2"],
      ]),
    );
    expect(projects.find((p) => p.projectId === "project-1")).toEqual(before);
    expect(await studio.profiles.getProfile("profile-1")).toEqual(oldSnapshot);
    expect(Object.isFrozen(await repo.getProject("project-1"))).toBe(true);
    expect((await studio.board.getBoard()).board.confirmed).toMatchObject({ profileId: "profile-2", version: 1, projectId: "project-2", projectName: "모던 카페 브랜드 프로젝트 2" });
  });

  it("new는 expectedLatest = 0만 받는다 — 아니면 SCHEMA_INVALID(쓰기 0)", async () => {
    const studio = studioWith();
    await studio.board.confirmProfile(1, 0);
    const changed = await studio.board.savePicks({ hero: "ref-c" }, {}, 1);
    expect(await codeOf(studio.board.createProfileVersion("profile-1", changed.revision, 1, "new"))).toBe("SCHEMA_INVALID");
    expect(await (await studio.projects()).listProjects()).toHaveLength(1);
  });
});

describe("J-AC-07 확정 트랜잭션 (12.2)", () => {
  it("① commit 실패 → 프로젝트 수·계열 버전 수·보드 confirmed 변화 0", async () => {
    let failCommit = false;
    const studio = studioWith(({ phase }) => (failCommit && phase === "commit" ? new Error("커밋 실패") : undefined));
    await studio.board.confirmProfile(1, 0);
    const changed = await studio.board.savePicks({ hero: "ref-c" }, {}, 1);
    const confirmedBefore = (await studio.board.getBoard()).board.confirmed;
    failCommit = true;
    await expect(studio.board.createProfileVersion("profile-1", changed.revision, 0, "new")).rejects.toThrow("커밋 실패");
    expect(await (await studio.projects()).listProjects()).toHaveLength(1);
    expect(await studio.profiles.listProfiles()).toHaveLength(1);
    expect((await studio.profiles.getProfile("profile-1"))?.latestVersion).toBe(1);
    expect((await studio.board.getBoard()).board.confirmed).toEqual(confirmedBefore);
  });

  it("① 첫 확정 commit 실패 → 프로젝트 0", async () => {
    const studio = studioWith(({ phase }) => (phase === "commit" ? new Error("커밋 실패") : undefined));
    await expect(studio.board.confirmProfile(1, 0)).rejects.toThrow("커밋 실패");
    expect(await (await studio.projects()).listProjects()).toEqual([]);
    expect((await studio.board.getBoard()).board.confirmed).toBeUndefined();
  });

  it("② response 거부 뒤 같은 인자로 재확정 → 같은 프로젝트·같은 버전(중복 0)", async () => {
    let failResponse = true;
    const studio = studioRejectingResponse(({ method }) => failResponse && method === "createProfileVersion");
    await studio.board.confirmProfile(1, 0);
    const changed = await studio.board.savePicks({ hero: "ref-c" }, {}, 1);
    await expect(studio.board.createProfileVersion("profile-1", changed.revision, 0, "new")).rejects.toThrow("응답 실패");
    failResponse = false;
    expect(await studio.board.createProfileVersion("profile-1", changed.revision, 0, "new")).toEqual({ profileId: "profile-2", version: 1 });
    expect(await (await studio.projects()).listProjects()).toHaveLength(2);
    expect(await studio.profiles.listProfiles()).toHaveLength(2);
  });

  it("② 첫 확정 response 거부 뒤 재확정 → 같은 프로젝트", async () => {
    let failResponse = true;
    const studio = studioRejectingResponse(({ method }) => failResponse && method === "confirmProfile");
    await expect(studio.board.confirmProfile(1, 0)).rejects.toThrow("응답 실패");
    failResponse = false;
    expect(await studio.board.confirmProfile(1, 0)).toEqual({ profileId: "profile-1", version: 1 });
    expect(await (await studio.projects()).listProjects()).toHaveLength(1);
  });

  it("③ 대상을 바꿔 재시도하면 멱등 결과를 돌려주지 않는다(키에 대상 포함)", async () => {
    let failResponse = true;
    const studio = studioRejectingResponse(({ method }) => failResponse && method === "createProfileVersion");
    await studio.board.confirmProfile(1, 0);
    const changed = await studio.board.savePicks({ hero: "ref-c" }, {}, 1);
    await expect(studio.board.createProfileVersion("profile-1", changed.revision, 1, "current")).rejects.toThrow("응답 실패");
    failResponse = false;
    const retried = await studio.board.createProfileVersion("profile-1", changed.revision, 0, "new");
    expect(retried).toEqual({ profileId: "profile-2", version: 1 });
    expect((await (await studio.projects()).listProjects()).map((p) => p.projectId).sort()).toEqual(["project-1", "project-2"]);
  });
});

describe("멱등 재생은 호출자의 계열에 묶인다 (리뷰 Major)", () => {
  it("첫 확정과 같은 revision에서 '새 프로젝트'를 부르면 첫 확정 결과를 재생하지 않고 새 계열을 만든다", async () => {
    const studio = studioWith();
    await studio.board.confirmProfile(1, 0);
    expect(await studio.board.createProfileVersion("profile-1", 1, 0, "new")).toEqual({ profileId: "profile-2", version: 1 });
    expect(await (await studio.projects()).listProjects()).toHaveLength(2);
  });

  it("current 재생은 그 계열의 커밋만 — 다른 계열 id면 SCHEMA_INVALID", async () => {
    const studio = studioWith();
    await studio.board.confirmProfile(1, 0);
    const changed = await studio.board.savePicks({ hero: "ref-c" }, {}, 1);
    await studio.board.createProfileVersion("profile-1", changed.revision, 0, "new");
    expect(await codeOf(studio.board.createProfileVersion("profile-9", changed.revision, 0, "new"))).toBe("SCHEMA_INVALID");
  });
});

describe("프로젝트 메모리 저장소 (8.3 — J-S04·J-S07)", () => {
  it("renameProject: 앞뒤 공백 제거 · revision +1 · 1~40자 아니면 SCHEMA_INVALID · 불일치 STALE_PROJECT(최신 동봉) · 없으면 NOT_FOUND", async () => {
    const studio = studioWith();
    await studio.board.confirmProfile(1, 0);
    const repo = await studio.projects();
    expect(await studio.projects()).toBe(repo);
    const renamed = await repo.renameProject("project-1", 1, "  카페 온도 리브랜딩 ");
    expect(renamed).toMatchObject({ projectId: "project-1", name: "카페 온도 리브랜딩", revision: 2 });
    expect(await codeOf(repo.renameProject("project-1", 2, "   "))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.renameProject("project-1", 2, "가".repeat(41)))).toBe("SCHEMA_INVALID");
    const stale = await repo.renameProject("project-1", 1, "옛 이름").catch((e: unknown) => e);
    expect(stale).toBeInstanceOf(ProjectRepositoryError);
    expect(stale).toMatchObject({ code: "STALE_PROJECT", project: { name: "카페 온도 리브랜딩", revision: 2 } });
    expect(await codeOf(repo.renameProject("project-9", 1, "이름"))).toBe("NOT_FOUND");
    expect((await studio.board.getBoard()).board.confirmed).toMatchObject({ projectName: "카페 온도 리브랜딩" });
    expect((await studio.profiles.getProfile("profile-1"))?.project?.name).toBe("카페 온도 리브랜딩");
  });

  it("getProject의 updatedAt도 프로필 새 버전을 반영한다(목록과 같은 값)", async () => {
    let t = 0;
    const studio = createMemoryStudio({ catalog: FIXTURE_CATALOG, now: () => `2026-09-27T00:00:0${t++}.000Z`, initialBoard: boardOf(IDS, { hero: "ref-a" }) });
    await studio.board.confirmProfile(1, 0);
    const changed = await studio.board.savePicks({ hero: "ref-c" }, {}, 1);
    await studio.board.createProfileVersion("profile-1", changed.revision, 1, "current");
    const repo = await studio.projects();
    const [listed] = await repo.listProjects();
    expect((await repo.getProject("project-1"))?.updatedAt).toBe(listed!.updatedAt);
    expect(listed!.updatedAt > listed!.createdAt).toBe(true);
  });

  it("getProject 없으면 undefined · getDoc 문서 없음 undefined", async () => {
    const repo = await studioWith().projects();
    expect(await repo.getProject("project-1")).toBeUndefined();
    expect(await repo.getDoc("project-1")).toBeUndefined();
  });
});

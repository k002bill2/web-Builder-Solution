/**
 * 자동 스냅샷 최근 20개 보존 (P1D-SPEC 1.2 · AC-D02 · AC-D03) — 메모리 저장소(영속 없음)로 4곳(내보내기·복원·충돌·새로 시작) 판정만 본다.
 * 한 트랜잭션·이미지 정리·이행(이미 20개 초과)은 영속 하네스 쪽(`persistence/autoSnapshotPersist.test.ts`).
 * 픽스처 ref-e(대비 통과 팔레트) + 렌더러 있는 7변형 문서 = 게이트 통과 문서(memoryExport.test와 같은 조립).
 */
import { describe, expect, it } from "vitest";
import { isTerminal } from "../domain/generation";
import type { PageDoc, SectionInstance } from "../engine/contracts/pageDoc";
import { hashDoc } from "../engine/ops/hash";
import { withAlt } from "../engine/testing/gateKit";
import { section } from "../engine/testing/sampleDoc";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "./memoryGenerationRepository";
import { createMemoryProjectRepository } from "./memoryProjectRepository";
import type { ExportGenerator, ProjectRepository } from "./projectRepository";
import { createStudioStore } from "./studioStore";

const RENDERED: readonly SectionInstance[] = [
  section("header", "sticky-right-cta", "s-header"),
  section("hero", "fullbleed-left", "s-hero"),
  section("about", "story", "s-about"),
  section("services", "cards-3", "s-services"),
  section("faq", "accordion", "s-faq"),
  section("contact", "form", "s-contact"),
  section("footer", "biz-extended", "s-footer"),
].map((s) => withAlt(s));
const fake: ExportGenerator = async ({ format }) => ({ downloadRef: `blob:${format}`, resultHash: "h-1" });

/** 게이트 통과 문서 → 수동 "기준"(snapshot-1) → 자동(복원 전) `autos`개 · 수동은 자동 4개마다 1개씩 더해 `manuals`개(남는 수동은 끝에) */
async function seeded({ autos = 20, manuals = 5 } = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-e", "ref-a", "ref-b"], { hero: "ref-e" }), store });
  await board.confirmProfile(1, 0);
  const gen = createMemoryGenerationRepository({ store });
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i++) job = await gen.getJob(job.jobId);
  let ticks = 0;
  const now = () => new Date(Date.UTC(2026, 9, 3, 5, 0, ticks++)).toISOString();
  const repo = createMemoryProjectRepository({ store, now, generators: { "static-html": fake } }) as ProjectRepository<PageDoc>;
  await repo.startDoc("project-1", 1, "A", "create");
  const current = (await repo.getDoc("project-1"))!;
  const next = { ...current, meta: { title: "동네 치과", description: "동네 치과를 소개합니다." }, sections: RENDERED };
  await repo.saveDoc("project-1", current.revision, { ...next, hash: hashDoc(next) });
  await repo.createSnapshot("project-1", "기준");
  let made = 1;
  for (let i = 1; i <= autos; i++) {
    await repo.restoreSnapshot("project-1", "snapshot-1", (await repo.getDoc("project-1"))!.revision);
    if (i % 4 === 0 && made < manuals) await repo.createSnapshot("project-1", `수동 ${++made}`);
  }
  while (made < manuals) await repo.createSnapshot("project-1", `수동 ${++made}`);
  const revision = async () => (await repo.getDoc("project-1"))!.revision;
  return { repo, revision };
}

const listOf = (repo: ProjectRepository<PageDoc>) => repo.listSnapshots("project-1");
const autoIds = async (repo: ProjectRepository<PageDoc>) => (await listOf(repo)).filter((s) => s.kind === "auto").map((s) => s.snapshotId);
const manualIds = async (repo: ProjectRepository<PageDoc>) => (await listOf(repo)).filter((s) => s.kind === "manual").map((s) => s.snapshotId);

describe("AC-D02 자동 21번째 → 가장 오래된 자동 1개 정리 (4곳 공용)", () => {
  it.each([
    ["export", async (repo: ProjectRepository<PageDoc>, rev: number): Promise<void> => void (await repo.requestExport("project-1", "static-html", rev))],
    ["restore", async (repo: ProjectRepository<PageDoc>, rev: number): Promise<void> => void (await repo.restoreSnapshot("project-1", "snapshot-1", rev))],
    ["conflict", async (repo: ProjectRepository<PageDoc>): Promise<void> => void (await repo.resolveConflict("project-1", "theirs", (await repo.getDoc("project-1"))!))],
    ["restart", async (repo: ProjectRepository<PageDoc>, rev: number): Promise<void> => void (await repo.startDoc("project-1", 1, "A", "restart", rev))],
  ] as const)("%s: 자동 20 + 수동 5 → 자동 추가 → 자동 20(가장 오래된 자동 빠짐 · 새 자동은 끝) · 수동 5 그대로", async (reason, act) => {
    const { repo, revision } = await seeded();
    const autos = await autoIds(repo);
    const manuals = await manualIds(repo);
    expect([autos.length, manuals.length]).toEqual([20, 5]);
    await act(repo, await revision());
    const after = await listOf(repo);
    const afterAutos = after.filter((s) => s.kind === "auto");
    expect(afterAutos).toHaveLength(20);
    expect(afterAutos.map((s) => s.snapshotId)).toEqual([...autos.slice(1), after.at(-1)!.snapshotId]);
    expect(after.at(-1)).toMatchObject({ kind: "auto", reason });
    expect(await manualIds(repo)).toEqual(manuals);
    // 새 id는 뺀 것과 겹치지 않는다(단조)
    expect(after.at(-1)!.snapshotId).toBe("snapshot-26");
  });

  it("자동 19개 + 자동 1개 = 20개 → 아무것도 빼지 않는다", async () => {
    const { repo, revision } = await seeded({ autos: 19 });
    const before = await autoIds(repo);
    await repo.restoreSnapshot("project-1", "snapshot-1", await revision());
    expect(await autoIds(repo)).toEqual([...before, "snapshot-25"]);
  });

  it("복원 예외: 가장 오래된 자동을 복원 → 그 스냅샷은 남고 다음 오래된 자동이 빠진다", async () => {
    const { repo, revision } = await seeded();
    const [oldest, second, ...rest] = await autoIds(repo);
    await repo.restoreSnapshot("project-1", oldest!, await revision());
    expect(await autoIds(repo)).toEqual([oldest, ...rest, "snapshot-26"]);
    expect(await autoIds(repo)).not.toContain(second);
  });
});

describe("AC-D03 수동은 정리 대상 아님", () => {
  it("수동 30 + 자동 20 → 자동 추가 → 수동 30 전부 남음 · 자동 20", async () => {
    const { repo, revision } = await seeded({ manuals: 30 });
    const manuals = await manualIds(repo);
    expect(manuals).toHaveLength(30);
    await repo.restoreSnapshot("project-1", "snapshot-1", await revision());
    expect(await manualIds(repo)).toEqual(manuals);
    expect(await autoIds(repo)).toHaveLength(20);
  });
});

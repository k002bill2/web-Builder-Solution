/**
 * StoredJob 영속 (ADR-007 개정 1 — Codex 제약 1 결정 B: hidden·attempts 포함 통째로) — 새로고침 중 생성이 끝까지 진행되는지.
 */
import { describe, expect, it } from "vitest";
import { isTerminal, type GenerationJob } from "../../domain/generation";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import type { GenerationRepository } from "../generationRepository";
import { createMemoryCompareBoardRepository } from "../memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "../memoryGenerationRepository";
import { createStudioStore, type StudioStore } from "../studioStore";
import { SCHEMA_VERSION } from "./envelope";
import { jobPut, readJobRecord } from "./jobRecord";
import { createMemoryPersistence } from "./studioPersistence";
import { createWriteQueue } from "./writeQueue";

async function confirmedStore() {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  await board.confirmProfile(1, 0);
  return store;
}

async function finish(gen: GenerationRepository, jobId: string): Promise<GenerationJob> {
  let job = await gen.getJob(jobId);
  for (let i = 0; i < 5 && !isTerminal(job.state); i += 1) job = await gen.getJob(jobId);
  return job;
}

describe("StoredJob 레코드", () => {
  it("요청 → getJob 1회 → 큐로 저장 → 읽어 새 store에 복원 → getJob 반복 = succeeded (영속 없는 대조 실행과 같은 결과)", async () => {
    const store = await confirmedStore();
    const gen = createMemoryGenerationRepository({ store });
    const { jobId } = await gen.requestGeneration("profile-1", 1);
    expect((await gen.getJob(jobId)).state).toBe("running");
    const before = store.job(jobId)!;
    expect(before.hidden.filter(Boolean)).toHaveLength(2);

    const persistence = createMemoryPersistence();
    await createWriteQueue(persistence).submit(`job:${jobId}`, [jobPut(before)]);
    const restored = readJobRecord(await persistence.get("studio", jobId));
    expect(restored).toEqual(before);
    expect(restored.hidden).toHaveLength(3);
    expect(restored.attempts).toEqual(before.attempts);

    const reloaded: StudioStore = createStudioStore();
    reloaded.transact((tx) => tx.putJob(restored));
    const after = await finish(createMemoryGenerationRepository({ store: reloaded }), jobId);
    expect(after.state).toBe("succeeded");

    const control = await finish(gen, jobId);
    expect(after).toEqual(control);
  });

  it("봉투 = studio 저장소 · kind job · id jobId · 현재 schemaVersion", async () => {
    const store = await confirmedStore();
    const { jobId } = await createMemoryGenerationRepository({ store }).requestGeneration("profile-1", 1);
    const op = jobPut(store.job(jobId)!);
    expect(op).toMatchObject({ type: "put", store: "studio", record: { schemaVersion: SCHEMA_VERSION, kind: "job", id: jobId } });
  });

  it("읽기 검증(zod, 조작 뒤 몫): 버전 불일치·kind 다름·hidden 길이 ≠ 안 수·id ≠ jobId → SCHEMA_INVALID", async () => {
    const store = await confirmedStore();
    const { jobId } = await createMemoryGenerationRepository({ store }).requestGeneration("profile-1", 1);
    const { record } = jobPut(store.job(jobId)!) as unknown as { record: { data: { hidden: unknown[] } } & Record<string, unknown> };
    const bad = [
      { ...record, schemaVersion: SCHEMA_VERSION + 1 },
      { ...record, kind: "doc" },
      { ...record, id: "job-다름" },
      { ...record, data: { ...record.data, hidden: record.data.hidden.slice(1) } },
      undefined,
    ];
    for (const value of bad) expect(() => readJobRecord(value)).toThrow(expect.objectContaining({ code: "SCHEMA_INVALID" }));
  });
});

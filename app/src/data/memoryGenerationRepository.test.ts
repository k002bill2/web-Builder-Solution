/**
 * 2a-04c GenerationRepository 메모리 구현 (DS-2A-04 SPEC 6.3 · P-AC-26~29) — 요청 멱등·단계 진행·요청/응답 실패 구분·부분 실패 재시도·
 * 결정적 실패·선택·버전 분리·되돌린 버전 해시 재현·동결, L4c 이음새 모양.
 */
import { describe, expect, it } from "vitest";
import { createDocFromCandidate } from "../engine/doc/createDocFromCandidate";
import { CANDIDATE_IDS, GENERATOR_VERSION, isTerminal, toEngineCandidate, type CandidatePlan, type GenerationJob } from "../domain/generation";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { insertOtherVersion } from "../test/studioFixtures";
import type { GenerationRepository } from "./generationRepository";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";
import { MEMORY_GENERATOR_VERSION, createMemoryGenerationRepository, type MemoryGenerationOptions } from "./memoryGenerationRepository";
import { createMemoryProfileRepository } from "./memoryProfileRepository";
import { createStudioStore } from "./studioStore";

async function setup(options: Omit<MemoryGenerationOptions, "store" | "onCompose"> = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  const profiles = createMemoryProfileRepository({ store });
  let composed = 0;
  const gen = createMemoryGenerationRepository({ ...options, store, onCompose: () => (composed += 1) });
  await board.confirmProfile(1, 0);
  return { store, profiles, gen, composed: () => composed };
}

async function finish(gen: GenerationRepository, jobId: string): Promise<GenerationJob> {
  let job = await gen.getJob(jobId);
  for (let i = 0; i < 5 && !isTerminal(job.state); i += 1) job = await gen.getJob(jobId);
  return job;
}

const plans = (job: GenerationJob): readonly CandidatePlan[] => job.candidates.flatMap((c) => (c.status === "succeeded" ? [c.plan] : []));
const hashes = (job: GenerationJob) => plans(job).map((p) => p.hash);
const lost = () => new Error("응답 유실");

describe("GenerationRepository 메모리 구현 (2a-04c)", () => {
  it("요청 멱등: 같은 버전 재요청 → 같은 잡, 계산 0회 추가 · 처음엔 queued + 3안 모두 보류", async () => {
    const { gen, composed } = await setup();
    const first = await gen.requestGeneration("profile-1", 1);
    expect(first).toMatchObject({ jobId: "job-1", profileId: "profile-1", version: 1, libraryVersion: "1.4", generatorVersion: "preview-1", state: "queued" });
    expect(first.candidates.map((c) => [c.id, c.status])).toEqual([["A", "pending"], ["B", "pending"], ["C", "pending"]]);
    const again = await gen.requestGeneration("profile-1", 1);
    expect(again.jobId).toBe("job-1");
    expect(composed()).toBe(1);
  });

  it("getJob은 조회마다 한 안씩 드러낸다: running 1/3 → 2/3 → succeeded, 종료 뒤 조회는 그대로", async () => {
    const { gen } = await setup();
    const { jobId } = await gen.requestGeneration("profile-1", 1);
    const steps: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const job = await gen.getJob(jobId);
      steps.push(`${job.state}:${job.candidates.map((c) => c.status[0]).join("")}`);
    }
    expect(steps).toEqual(["running:spp", "running:ssp", "succeeded:sss", "succeeded:sss"]);
  });

  it("버전·프로필 분리: v2는 새 잡, findJob은 버전마다 자기 잡 · 없는 버전은 undefined · 없는 버전 요청은 NOT_FOUND", async () => {
    const { gen, store } = await setup();
    const v1 = await gen.requestGeneration("profile-1", 1);
    insertOtherVersion(store);
    const v2 = await gen.requestGeneration("profile-1", 2);
    expect(v2.jobId).not.toBe(v1.jobId);
    expect((await gen.findJob("profile-1", 1))?.jobId).toBe(v1.jobId);
    expect((await gen.findJob("profile-1", 2))?.jobId).toBe(v2.jobId);
    expect(await gen.findJob("profile-1", 3)).toBeUndefined();
    expect(await gen.findJob("profile-2", 1)).toBeUndefined();
    await expect(gen.requestGeneration("profile-1", 9)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("요청 실패(request) → 잡 0 · 응답 실패(response) → 잡은 커밋됨, 다시 요청하면 같은 잡(계산 1회)", async () => {
    let mode: "request" | "response" | "none" = "request";
    const { gen, composed } = await setup({ fail: (call) => (call.method === "requestGeneration" && call.phase === mode ? lost() : undefined) });
    await expect(gen.requestGeneration("profile-1", 1)).rejects.toThrow("응답 유실");
    expect(await gen.findJob("profile-1", 1)).toBeUndefined();
    mode = "response";
    await expect(gen.requestGeneration("profile-1", 1)).rejects.toThrow("응답 유실");
    expect((await gen.findJob("profile-1", 1))?.jobId).toBe("job-1");
    mode = "none";
    expect((await gen.requestGeneration("profile-1", 1)).jobId).toBe("job-1");
    expect(composed()).toBe(1);
  });

  it("부분 실패: C JOB_TIMEOUT → partial · retryFailed는 C만 다시(2회차) → succeeded, A·B 결과 불변", async () => {
    const { gen } = await setup({ outcome: ({ id, attempt }) => (id === "C" && attempt === 1 ? "JOB_TIMEOUT" : undefined) });
    const { jobId } = await gen.requestGeneration("profile-1", 1);
    const partial = await finish(gen, jobId);
    expect(partial.state).toBe("partial");
    expect(partial.candidates[2]).toMatchObject({ id: "C", status: "failed", errorCode: "JOB_TIMEOUT", retryable: true });
    const retried = await gen.retryFailed(jobId);
    expect(retried.state).toBe("running");
    expect(retried.candidates.map((c) => c.status)).toEqual(["succeeded", "succeeded", "pending"]);
    const done = await finish(gen, jobId);
    expect(done.state).toBe("succeeded");
    expect(plans(done).slice(0, 2)).toEqual(plans(partial));
  });

  it("결정적 실패: 라이브러리 없음 → 세 안 모두 UNSUPPORTED_COMBINATION(재시도 불가), state failed · retryFailed 거부", async () => {
    const { gen } = await setup({ libraries: {} });
    const { jobId } = await gen.requestGeneration("profile-1", 1);
    const failed = await finish(gen, jobId);
    expect(failed.state).toBe("failed");
    for (const c of failed.candidates) expect(c).toMatchObject({ status: "failed", errorCode: "UNSUPPORTED_COMBINATION", retryable: false });
    await expect(gen.retryFailed(jobId)).rejects.toMatchObject({ code: "SCHEMA_INVALID" });
  });

  it("선택: 성공한 안만 · findJob이 선택을 돌려줌(다시 들어와도 유지) · 실패 안·없는 잡 거부 · 만드는 중 재시도 거부", async () => {
    const { gen } = await setup({ outcome: ({ id }) => (id === "C" ? "INFRA" : undefined) });
    const { jobId } = await gen.requestGeneration("profile-1", 1);
    await expect(gen.retryFailed(jobId)).rejects.toMatchObject({ code: "SCHEMA_INVALID" });
    await finish(gen, jobId);
    await expect(gen.selectCandidate(jobId, "C")).rejects.toMatchObject({ code: "SCHEMA_INVALID" });
    expect((await gen.selectCandidate(jobId, "B")).selected).toBe("B");
    expect((await gen.findJob("profile-1", 1))?.selected).toBe("B");
    await expect(gen.selectCandidate("job-9", "A")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("P-AC-28 재현: 되돌린 버전은 처음과 같은 해시 · 조정 저장(밀도 촘촘) 버전은 다른 해시", async () => {
    const { gen, profiles } = await setup();
    const v1 = await finish(gen, (await gen.requestGeneration("profile-1", 1)).jobId);
    await profiles.saveAdjustments("profile-1", 1, { density: "compact" });
    const v2 = await finish(gen, (await gen.requestGeneration("profile-1", 2)).jobId);
    const reverted = await profiles.revertTo("profile-1", 1, 2);
    const v3 = await finish(gen, (await gen.requestGeneration("profile-1", reverted.version)).jobId);
    expect(hashes(v1)).toHaveLength(3);
    expect(hashes(v3)).toEqual(hashes(v1));
    for (const [i, h] of hashes(v2).entries()) expect(h).not.toBe(hashes(v1)[i]);
  });

  it("생성기 버전·안 id·종료 상태 = generation.ts (번들 때문에 저장소에 둔 값 3개의 동일성 가드)", async () => {
    expect(MEMORY_GENERATOR_VERSION).toBe(GENERATOR_VERSION);
    const { gen } = await setup();
    const job = await gen.requestGeneration("profile-1", 1);
    expect(job.candidates.map((c) => c.id)).toEqual([...CANDIDATE_IDS]);
    expect(job.generatorVersion).toBe(GENERATOR_VERSION);
    const done = await finish(gen, job.jobId);
    expect(isTerminal(done.state)).toBe(true);
    expect(await gen.getJob(job.jobId)).toBe(done);
  });

  it("레코드 동결 · L4c 이음새: toEngineCandidate = createDocFromCandidate 첫 인자 모양(섹션 순서·버전)", async () => {
    const { gen } = await setup();
    const job = await finish(gen, (await gen.requestGeneration("profile-1", 1)).jobId);
    expect(Object.isFrozen(job)).toBe(true);
    expect(Object.isFrozen(job.candidates[0])).toBe(true);
    const plan = plans(job)[1]!;
    const input: Parameters<typeof createDocFromCandidate>[0] = toEngineCandidate(job, plan);
    expect(input).toEqual({ candidateId: "B", sections: plan.sections.map(({ type, variant }) => ({ type, variant })), libraryVersion: "1.4", generatorVersion: "preview-1" });
  });
});

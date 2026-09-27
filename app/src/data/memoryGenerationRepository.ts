/**
 * 3안 생성 저장소 메모리 구현 (DS-2A-04 SPEC 6.3) — 보드·프로필 메모리 구현과 같은 store에 잡을 둔다.
 * 계산은 요청·재시도 때만 한다: 계산 본문(memoryGenerate = composeCandidates·lintPlan)은 "3안 만들기"·"다시 시도" 조작 뒤 청크이고,
 * 세 안을 한 번에 계산해 잡 안에 숨겨 둔 뒤 `getJob`이 조회마다 한 안씩 드러낸다(테스트에서 단계 재현). `findJob`·`getJob`·`selectCandidate`는
 * store 조회·갱신만이라 진입 때 자동 조회·폴링이 계산 청크를 받지 않는다(GenerationLoad.test "번들 분류 근거").
 * 멱등: 키 = (profileId, version, libraryVersion, generatorVersion) — 있으면 그 잡을 그대로(계산 0). 요청 응답이 사라져도 다시 요청하면 같은 잡.
 * `delay`·`fail` 주입은 보드·프로필 구현과 같은 모양(요청 도착 전 · 응답 반환 전). `outcome`은 안별 실패 주입(부분 실패·재시도, P-S20·S21).
 */
import type { CandidateId, CandidateResult, GenerationErrorCode, JobState } from "../domain/generation";
import type { ProfileVersion } from "../domain/profile";
import type { SectionLibrary } from "../domain/sectionLibrary";
import { GenerationError, type GenerationRepository } from "./generationRepository";
import type { StoredJob, StudioReader, StudioStore } from "./studioStore";
import { loadGenerate } from "./writeBodyLoader";

export type GenerationMethod = keyof GenerationRepository;
export interface GenerationCall {
  readonly method: GenerationMethod;
  /** 메서드별 1부터 */
  readonly seq: number;
  readonly phase: "request" | "response";
}
/** 안 하나의 계산 — attempt는 1부터(재시도마다 +1) */
export interface CandidateCall {
  readonly jobId: string;
  readonly id: CandidateId;
  readonly attempt: number;
}

export interface MemoryGenerationOptions {
  readonly store: StudioStore;
  readonly delay?: (call: GenerationCall) => Promise<void> | void | undefined;
  readonly fail?: (call: GenerationCall) => Error | undefined;
  /** 안별 실패 주입 — 코드를 돌려주면 그 안은 실패(JOB_TIMEOUT·INFRA = 재시도 가능) */
  readonly outcome?: (call: CandidateCall) => GenerationErrorCode | undefined;
  /** 라이브러리 버전 → 라이브러리. 없으면 현재 SECTION_LIBRARY 한 벌(계산 청크 안에서 정한다) */
  readonly libraries?: Readonly<Record<string, SectionLibrary>>;
  /** 계산 횟수 관찰(멱등 테스트 — 같은 버전 재요청은 계산 0) */
  readonly onCompose?: () => void;
}

/**
 * 번들(2a-04c): 이 모듈은 memoryStudio(보드·프로필 진입 때 자동) 청크에 든다. generation.ts 런타임을 import하면 공유 청크가 생겨
 * 공통 엔트리의 preload 목록이 늘어난다(`/compare` 첫 화면 여유 0.300KB) — 멱등 키·종료 판정 값만 여기 둔다. 같은 값인지는 테스트가 확인한다
 * (memoryGenerationRepository.test "생성기 버전·안 id·종료 상태 = generation.ts").
 * 새 잡 조립·안별 실패 주입·재시도 판정은 계산 본문(memoryGenerate `newJob`·`retryJob`)에 둔다 — `/profile` 진입 직후 합계에서 뺀다(PROFILE-HEADROOM).
 */
export const MEMORY_GENERATOR_VERSION = "preview-1";
const isTerminal = (state: JobState) => state !== "queued" && state !== "running";

const keyOf = (record: ProfileVersion) => [record.profileId, record.version, record.base.library_version, MEMORY_GENERATOR_VERSION].join("|");
const recordOf = (reader: StudioReader, profileId: string, version: number) => reader.versions(profileId).find((v) => v.version === version);

/** 모든 안이 끝났으면 종료 상태, 아니면 running */
function stateOf(candidates: readonly CandidateResult[]): JobState {
  if (candidates.some((c) => c.status === "pending")) return "running";
  const ok = candidates.filter((c) => c.status === "succeeded").length;
  return ok === candidates.length ? "succeeded" : ok > 0 ? "partial" : "failed";
}

export function createMemoryGenerationRepository(options: MemoryGenerationOptions): GenerationRepository {
  const { store } = options;
  const counts = new Map<GenerationMethod, number>();

  async function call<T>(method: GenerationMethod, work: () => T): Promise<T> {
    const seq = (counts.get(method) ?? 0) + 1;
    counts.set(method, seq);
    await options.delay?.({ method, seq, phase: "request" });
    const failure = options.fail?.({ method, seq, phase: "request" });
    if (failure) throw failure;
    const result = work();
    await options.delay?.({ method, seq, phase: "response" });
    const lost = options.fail?.({ method, seq, phase: "response" });
    if (lost) throw lost;
    return result;
  }

  const storedOf = (reader: StudioReader, jobId: string): StoredJob => {
    const stored = reader.job(jobId);
    if (!stored) throw new GenerationError("NOT_FOUND", `잡 ${jobId} 없음`);
    return stored;
  };

  return {
    requestGeneration: async (profileId, version) => {
      const record = recordOf(store, profileId, version);
      // 이미 있는 잡·없는 버전이면 계산 본문을 받지 않는다
      const generate = record && !store.jobByKey(keyOf(record)) ? await loadGenerate() : undefined;
      return call("requestGeneration", () =>
        store.transact((tx) => {
          const current = recordOf(tx, profileId, version);
          if (!current) throw new GenerationError("NOT_FOUND", `${profileId} v${version} 없음`);
          const prior = tx.jobByKey(keyOf(current));
          if (prior) return prior.job;
          if (!generate) throw new GenerationError("INFRA", "계산 본문을 받지 못했습니다");
          options.onCompose?.();
          const stored = generate.newJob(current, `job-${tx.jobCount() + 1}`, keyOf(current), MEMORY_GENERATOR_VERSION, options);
          tx.putJob(stored);
          return stored.job;
        }),
      );
    },
    getJob: (jobId) =>
      call("getJob", () =>
        store.transact((tx) => {
          const stored = storedOf(tx, jobId);
          const next = stored.job.candidates.findIndex((c, i) => c.status === "pending" && stored.hidden[i]);
          if (isTerminal(stored.job.state) || next < 0) return stored.job;
          const candidates = stored.job.candidates.map((c, i) => (i === next ? stored.hidden[i]! : c));
          const job = { ...stored.job, candidates, state: stateOf(candidates) };
          tx.putJob({ ...stored, job, hidden: stored.hidden.map((h, i) => (i === next ? undefined : h)) });
          return job;
        }),
      ),
    findJob: (profileId, version) =>
      call("findJob", () => {
        const record = recordOf(store, profileId, version);
        return record && store.jobByKey(keyOf(record))?.job;
      }),
    retryFailed: async (jobId) => {
      const generate = await loadGenerate();
      return call("retryFailed", () =>
        store.transact((tx) => {
          const stored = generate.retryJob(storedOf(tx, jobId), (profileId, version) => recordOf(tx, profileId, version), options);
          tx.putJob(stored);
          return stored.job;
        }),
      );
    },
    selectCandidate: (jobId, id) =>
      call("selectCandidate", () =>
        store.transact((tx) => {
          const stored = storedOf(tx, jobId);
          if (stored.job.candidates.find((c) => c.id === id)?.status !== "succeeded") throw new GenerationError("SCHEMA_INVALID", "성공한 안만 고를 수 있습니다");
          if (stored.job.selected === id) return stored.job;
          const job = { ...stored.job, selected: id };
          tx.putJob({ ...stored, job });
          return job;
        }),
      ),
  };
}

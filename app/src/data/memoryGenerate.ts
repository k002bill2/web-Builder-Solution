/**
 * 3안 계산 본문 (DS-2A-04 SPEC 4.1) — "3안 만들기"·"다시 시도" 조작 뒤에만 받는 청크(writeBodyLoader loadGenerate).
 * 저장된 버전의 적용된 값(base + 조정) + 목적·대비 조정으로 composeCandidates를 부른다. 라이브러리는 프로필에 고정된 `library_version`의 것 —
 * 없으면 세 안 모두 결정적 실패(UNSUPPORTED_COMBINATION, 재시도 없음).
 * 결과 모양(A·B·C 3개, 순서) 검증도 여기서 — 어긋나면 SCHEMA_INVALID로 거부해 잡을 만들지 않는다(조회마다 한 안씩 공개하는 잡이
 * "만드는 중"에 고착되지 않게). 조작 뒤 청크에 두어 진입 자동 경로 바이트 0.
 * 새 잡 조립(`newJob`)·안별 실패 주입·재시도 판정(`retryJob`)도 여기 — 저장소는 트랜잭션 안에서 부르고 결과만 쓴다(PROFILE-HEADROOM).
 */
import { composeCandidates } from "../domain/composeCandidates";
import { effectiveProfile } from "../domain/effectiveProfile";
import { CANDIDATE_IDS, GENERATOR_VERSION, isTerminal, type CandidateId, type ComposedResult, type GenerationErrorCode, type GenerationJob } from "../domain/generation";
import type { ProfileVersion } from "../domain/profile";
import { SECTION_LIBRARY, type SectionLibrary } from "../domain/sectionLibrary";
import { GenerationError } from "./generationRepository";
import type { CandidateCall, MemoryGenerationOptions } from "./memoryGenerationRepository";
import type { StoredJob } from "./studioStore";

const DEFAULT_LIBRARIES: Readonly<Record<string, SectionLibrary>> = Object.freeze({ [SECTION_LIBRARY.version]: SECTION_LIBRARY });

export function composeFor(record: ProfileVersion, libraries: Readonly<Record<string, SectionLibrary>> = DEFAULT_LIBRARIES): readonly ComposedResult[] {
  const profile = effectiveProfile(record.base, record.adjustments);
  const results = composeCandidates({
    profile,
    purpose: record.adjustments.purpose ?? "none",
    contrast: record.adjustments.contrast ?? "aa",
    library: libraries[profile.library_version],
    generatorVersion: GENERATOR_VERSION,
  });
  if (results.length !== CANDIDATE_IDS.length || results.some((r, i) => r.id !== CANDIDATE_IDS[i])) {
    throw new GenerationError("SCHEMA_INVALID", "생성기 결과 모양이 맞지 않습니다(A·B·C 3개)");
  }
  return results;
}

const RETRYABLE: ReadonlySet<GenerationErrorCode> = new Set(["JOB_TIMEOUT", "INFRA"]);
const FAILURE_TEXT: Readonly<Record<GenerationErrorCode, string>> = {
  JOB_TIMEOUT: "제한 시간 안에 만들지 못했습니다",
  INFRA: "생성 서버에 연결하지 못했습니다",
  UNSUPPORTED_COMBINATION: "이 조합으로는 만들 수 없습니다",
  SCHEMA_INVALID: "입력 모양이 맞지 않습니다",
  NOT_FOUND: "프로필 버전을 찾을 수 없습니다",
};

type JobOptions = Pick<MemoryGenerationOptions, "outcome" | "libraries">;

/** 계산 결과에 안별 실패 주입을 입힌다 */
function injected(result: ComposedResult, call: CandidateCall, outcome: JobOptions["outcome"]): ComposedResult {
  const code = outcome?.(call);
  return code ? { id: result.id, status: "failed", errorCode: code, retryable: RETRYABLE.has(code), message: FAILURE_TEXT[code] } : result;
}

/** 새 잡 — 세 안을 한 번에 계산해 숨겨 둔다(저장소 트랜잭션 안에서 부른다) */
export function newJob(record: ProfileVersion, jobId: string, key: string, { outcome, libraries }: JobOptions): StoredJob {
  const results = composeFor(record, libraries);
  const job: GenerationJob = {
    jobId,
    profileId: record.profileId,
    version: record.version,
    libraryVersion: record.base.library_version,
    generatorVersion: GENERATOR_VERSION,
    seed: record.base.seed,
    state: "queued",
    candidates: CANDIDATE_IDS.map((id) => ({ id, status: "pending" as const })),
  };
  return { key, job, hidden: results.map((r) => injected(r, { jobId, id: r.id, attempt: 1 }, outcome)), attempts: { A: 1, B: 1, C: 1 } };
}

/** 실패·재시도 가능 안만 다시 계산해 숨긴다 — 판정 순서: 만드는 중 → 재시도할 안 없음 → 버전 없음 */
export function retryJob(
  stored: StoredJob,
  recordOf: (profileId: string, version: number) => ProfileVersion | undefined,
  { outcome, libraries, onCompose }: JobOptions & Pick<MemoryGenerationOptions, "onCompose">,
): StoredJob {
  const { jobId } = stored.job;
  if (!isTerminal(stored.job.state)) throw new GenerationError("SCHEMA_INVALID", "아직 만드는 중입니다");
  const retry = new Set(stored.job.candidates.filter((c) => c.status === "failed" && c.retryable).map((c) => c.id));
  if (retry.size === 0) throw new GenerationError("SCHEMA_INVALID", "다시 시도할 수 있는 안이 없습니다");
  const record = recordOf(stored.job.profileId, stored.job.version);
  if (!record) throw new GenerationError("NOT_FOUND", `${stored.job.profileId} v${stored.job.version} 없음`);
  onCompose?.();
  const results = composeFor(record, libraries);
  const attempts: Record<CandidateId, number> = { ...stored.attempts };
  for (const id of retry) attempts[id] += 1;
  const candidates = stored.job.candidates.map((c) => (retry.has(c.id) ? { id: c.id, status: "pending" as const } : c));
  const hidden = results.map((r, i) => (retry.has(r.id) ? injected(r, { jobId, id: r.id, attempt: attempts[r.id] }, outcome) : stored.hidden[i]));
  return { ...stored, job: { ...stored.job, candidates, state: "running" }, hidden, attempts };
}

/**
 * 생성 잡 영속 레코드 (ADR-007 개정 1 — Codex 제약 1 결정 B) — StoredJob을 통째로(`hidden`·`attempts` 포함) 봉투에 담는다.
 * 새로고침 뒤 복원한 잡은 `getJob`이 남은 hidden을 이어서 드러내 끝난다(재계산 0). 저장은 structured clone이라 변환 없음.
 * 읽기 검증은 zod — 조작 뒤 몫(진입 검증은 envelope 수제 확인만). 버전 불일치 때 미완료 잡 강등("다시 시도")은 P1a-2 배선·문구 Designer.
 */
import { z } from "zod";
import { CANDIDATE_IDS, type JobState } from "../../domain/generation";
import { ProjectRepositoryError } from "../projectRepository";
import type { StoredJob } from "../studioStore";
import { SCHEMA_VERSION, type Envelope } from "./envelope";
import type { WriteOp } from "./studioPersistence";

export const JOB_KIND = "job";

const candidateId = z.enum(CANDIDATE_IDS);
const plan = z.looseObject({
  id: candidateId,
  axes: z.looseObject({}),
  sections: z.array(z.looseObject({})),
  summary: z.tuple([z.string(), z.string(), z.string()]),
  log: z.array(z.string()),
  lint: z.array(z.looseObject({})),
  hash: z.string(),
});
const succeeded = z.looseObject({ id: candidateId, status: z.literal("succeeded"), plan });
const failed = z.looseObject({ id: candidateId, status: z.literal("failed"), errorCode: z.string(), retryable: z.boolean(), message: z.string() });
const composed = z.discriminatedUnion("status", [succeeded, failed]);
const candidate = z.discriminatedUnion("status", [succeeded, failed, z.looseObject({ id: candidateId, status: z.literal("pending") })]);

const jobEnvelope = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    kind: z.literal(JOB_KIND),
    id: z.string(),
    data: z.object({
      key: z.string(),
      job: z.looseObject({
        jobId: z.string(),
        profileId: z.string(),
        version: z.number(),
        libraryVersion: z.string(),
        generatorVersion: z.string(),
        seed: z.string(),
        state: z.enum(["queued", "running", "succeeded", "partial", "failed"]),
        candidates: z.array(candidate).length(CANDIDATE_IDS.length),
        selected: candidateId.optional(),
      }),
      hidden: z.array(composed.optional()),
      // retryJob이 `attempts[id] += 1` — 안마다 횟수가 있어야 한다
      attempts: z.record(candidateId, z.number().int().nonnegative()),
    }),
  })
  .refine(({ id, data }) => id === data.job.jobId && data.hidden.length === data.job.candidates.length)
  // 후보 순서 = A·B·C · 숨은 결과는 같은 안 · 진행 중 후보마다 드러낼 결과가 있어야 getJob이 끝낸다
  .refine(({ data: { job, hidden } }) =>
    job.candidates.every((c, i) => c.id === CANDIDATE_IDS[i] && (hidden[i] ? hidden[i].id === c.id : c.status !== "pending")),
  )
  // state = 후보 진행 상태(memoryGenerationRepository `stateOf`) · queued = 요청 직후(후보 전부 pending)
  .refine(({ data: { job } }) => job.state === stateOf(job.candidates) || (job.state === "queued" && job.candidates.every((c) => c.status === "pending")));

/** memoryGenerationRepository `stateOf`와 같은 규칙 — pending 있음 = running · 전부 성공 = succeeded · 일부 = partial · 0 = failed */
function stateOf(candidates: readonly { status: string }[]): JobState {
  if (candidates.some((c) => c.status === "pending")) return "running";
  const ok = candidates.filter((c) => c.status === "succeeded").length;
  return ok === candidates.length ? "succeeded" : ok > 0 ? "partial" : "failed";
}

export function jobPut(stored: StoredJob): WriteOp {
  const record: Envelope<StoredJob> = { schemaVersion: SCHEMA_VERSION, kind: JOB_KIND, id: stored.job.jobId, data: stored };
  return { type: "put", store: "studio", record };
}

export function readJobRecord(record: unknown): StoredJob {
  const parsed = jobEnvelope.safeParse(record);
  if (!parsed.success) throw new ProjectRepositoryError("SCHEMA_INVALID", "저장된 생성 잡을 읽지 못했습니다");
  return parsed.data.data as unknown as StoredJob;
}

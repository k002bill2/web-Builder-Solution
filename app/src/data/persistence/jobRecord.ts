/**
 * 생성 잡 영속 레코드 (ADR-007 개정 1 — Codex 제약 1 결정 B) — StoredJob을 통째로(`hidden`·`attempts` 포함) 봉투에 담는다.
 * 새로고침 뒤 복원한 잡은 `getJob`이 남은 hidden을 이어서 드러내 끝난다(재계산 0). 저장은 structured clone이라 변환 없음.
 * 읽기 검증은 zod — 조작 뒤 몫(진입 검증은 envelope 수제 확인만). 버전 불일치 때 미완료 잡 강등("다시 시도")은 P1a-2 배선·문구 Designer.
 */
import { z } from "zod";
import { ProjectRepositoryError } from "../projectRepository";
import type { StoredJob } from "../studioStore";
import { SCHEMA_VERSION, type Envelope } from "./envelope";
import type { WriteOp } from "./studioPersistence";

export const JOB_KIND = "job";

const jobEnvelope = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    kind: z.literal(JOB_KIND),
    id: z.string(),
    data: z.object({
      key: z.string(),
      job: z.looseObject({ jobId: z.string(), candidates: z.array(z.looseObject({ id: z.string(), status: z.string() })) }),
      hidden: z.array(z.unknown()),
      attempts: z.record(z.string(), z.number()),
    }),
  })
  .refine(({ id, data }) => id === data.job.jobId && data.hidden.length === data.job.candidates.length);

export function jobPut(stored: StoredJob): WriteOp {
  const record: Envelope<StoredJob> = { schemaVersion: SCHEMA_VERSION, kind: JOB_KIND, id: stored.job.jobId, data: stored };
  return { type: "put", store: "studio", record };
}

export function readJobRecord(record: unknown): StoredJob {
  const parsed = jobEnvelope.safeParse(record);
  if (!parsed.success) throw new ProjectRepositoryError("SCHEMA_INVALID", "저장된 생성 잡을 읽지 못했습니다");
  return parsed.data.data as unknown as StoredJob;
}

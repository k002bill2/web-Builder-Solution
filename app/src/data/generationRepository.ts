/**
 * 3안 생성 저장소 경계 (DS-2A-04 SPEC 6.3 GenerationRepository). 인터페이스 파일은 타입·오류 클래스만 — 구현은 memoryGenerationRepository.
 * 생성은 프로필 버전 기준(Q6 `POST /profiles/{id}/versions/{v}/generate`)이고 요청은 멱등이다
 * (키 = profileId, version, libraryVersion, generatorVersion — 이미 있으면 그 잡, 새 계산 0).
 */
import type { CandidateId, GenerationErrorCode, GenerationJob } from "../domain/generation";

export interface GenerationRepository {
  /** POST /profiles/{id}/versions/{v}/generate — 멱등 */
  requestGeneration(profileId: string, version: number): Promise<GenerationJob>;
  /** GET /jobs/{job_id} — 화면은 종료 상태까지 1초 간격으로 조회 */
  getJob(jobId: string): Promise<GenerationJob>;
  /** GET /profiles/{id}/versions/{v}/jobs/latest — 진입 때 기존 결과(P-S17 vs P-S19). 없으면 undefined */
  findJob(profileId: string, version: number): Promise<GenerationJob | undefined>;
  /** POST /jobs/{id}/retry — 재시도 가능한 실패 안만 다시. 결정적 실패만 남았으면 거부 */
  retryFailed(jobId: string): Promise<GenerationJob>;
  /** PUT /jobs/{id}/selection — 성공한 안만 */
  selectCandidate(jobId: string, id: CandidateId): Promise<GenerationJob>;
}

export class GenerationError extends Error {
  readonly code: GenerationErrorCode;

  constructor(code: GenerationErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "GenerationError";
    this.code = code;
  }
}

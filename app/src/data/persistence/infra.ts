/**
 * 영속 오류 분류 — 연결 실패·blocked·quota·트랜잭션 중단은 모두 `INFRA`(SaveStatus 재시도 경로, ADR-007 3절 쓰기 방식). 사유는 메시지로만 남긴다.
 */
import { ProjectRepositoryError } from "../projectRepository";

const nameOf = (error: unknown) => (error && typeof error === "object" && "name" in error ? String(error.name) : undefined);

function reasonOf(error: unknown): string {
  switch (nameOf(error)) {
    case "QuotaExceededError":
      return "브라우저 저장 공간이 부족합니다";
    case "BlockedError":
      return "다른 탭이 브라우저 저장소를 쓰고 있습니다";
    default:
      return "브라우저 저장소에 접근하지 못했습니다";
  }
}

/** `reason` = 원인을 아는 호출자가 직접(예: 복제 실패) — 없으면 오류 이름으로 고른다 */
export function toInfra(error: unknown, action: string, reason = reasonOf(error)): ProjectRepositoryError {
  if (error instanceof ProjectRepositoryError) return error;
  return new ProjectRepositoryError("INFRA", `${action} — ${reason}`);
}

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

/** 다중 탭 INFRA 사유(P1C-SPEC 1.5) — 잠금을 다른 탭이 가짐 · 최신성 확인 실패 · 지워짐 */
export const READ_ONLY_TAB = "다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다";
export const STALE_TAB = "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요";
/** 지우기 뒤(이 탭이 지웠거나 다른 탭의 cleared 수신 — P1C-SPEC 1.5) */
export const CLEARED_TAB = "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요";

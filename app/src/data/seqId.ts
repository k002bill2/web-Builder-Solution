/**
 * 단조 순번 id (P1D-SPEC 3절 · ADR-007 개정 3) — 조작 뒤 공용(memoryBoardConfirm·memoryGenerate·memoryDocBook만 import).
 * 다음 id = max(현존 최대 번호, 지운 것 중 최대 번호) + 1. 현존 최대 = 같은 접두 id의 `-(\d+)$` 정수 최대(접두가 다른 id·숫자 아닌 꼬리는 무시).
 * `deletedMax` 없음 = 0(이행 — 삭제가 없던 데이터는 지금 `length + 1`과 같은 값). 묘비는 삭제 때만 올린다(발급 쓰기 0).
 */
export const seqOf = (prefix: string, id: string): number => {
  const tail = id.startsWith(`${prefix}-`) ? id.slice(prefix.length + 1) : "";
  return /^\d+$/.test(tail) ? Number(tail) : 0;
};

export const nextSeqId = (prefix: string, ids: Iterable<string>, deletedMax = 0): string =>
  `${prefix}-${Math.max(Number.isSafeInteger(deletedMax) ? deletedMax : 0, ...[...ids].map((id) => seqOf(prefix, id))) + 1}`;

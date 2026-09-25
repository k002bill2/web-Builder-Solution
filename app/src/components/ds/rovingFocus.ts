const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp"]);
const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);

/**
 * roving tabindex 그룹(radiogroup·tablist)의 키 이동 (WAI-ARIA APG).
 * ←/↑ 이전, →/↓ 다음(양 끝에서 순환), Home 처음, End 끝. 이동 키가 아니면 null.
 */
export function rovingTargetIndex(key: string, current: number, length: number): number | null {
  if (length === 0) return null;
  if (PREV_KEYS.has(key)) return (current - 1 + length) % length;
  if (NEXT_KEYS.has(key)) return (current + 1) % length;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return null;
}

/**
 * 가로 전용 변형 — 비교 표의 행 안 열 이동 (SPEC A-5). ←/→·Home/End만 쓰고 ↑/↓는 무시한다
 * (↑/↓는 스크린리더의 표 탐색 키와 겹친다).
 */
export function rovingRowTargetIndex(key: string, current: number, length: number): number | null {
  if (key === "ArrowUp" || key === "ArrowDown") return null;
  return rovingTargetIndex(key, current, length);
}

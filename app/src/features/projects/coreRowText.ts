/**
 * `/projects` 행의 저장 코어 상태 문구(RS6-L5 CP1b · INTEGRATE-6 r1 8.1·8.3 · 12절) — UX-5 2.3 원문(★ 재사용)만 쓴다.
 * 편집기 문구 정본(`features/studio/saveStatusText.ts`)은 L4 소유라 import하지 않고 같은 원문을 여기에 둔다.
 */
export const CORE_ROW_TEXT = Object.freeze({
  // UX-5 2.3 `saving` `/projects` 행
  saving: "저장 중…",
  // UX-5 2.3 `failed` 상태 글자 — 편집기를 떠난 뒤 해제 save가 실패해 초안이 코어에만 있다(I6 12절)
  failed: "저장하지 못했습니다",
  saveAgain: "다시 저장",
  // UX-5 2.3 영구 확인 — 회복 status
  saved: "다시 저장했습니다",
});

/** 코어 결과 reason → 문구(I6 8.3 · UX-5 2.3 원문). 없는 reason = failed 기본 문구 */
export const CORE_REASON_TEXT: Readonly<Record<string, string>> = Object.freeze({
  readonly: "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다",
  stale: "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요",
  cleared: "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요",
  unsupported: "이 브라우저는 저장소를 쓸 수 없어 이 탭에만 저장합니다",
  // UX-5 2.3 image-missing `/projects` 행 — 개수는 코어 결과에 없어 뺀 형태(새 문장 — REPORT 기록)
  "image-missing": "이미지가 빠져 있어 저장을 확인하지 못했습니다",
});

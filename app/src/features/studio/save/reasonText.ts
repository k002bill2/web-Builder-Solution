/**
 * 환경·결과 reason → 상태 글자(UX-5 2.3 · INTEGRATE-6 8.1·8.3) — 조작 뒤 청크(coreIo가 import). 실패 결과에만 쓰이므로 진입에 두지 않는다
 * (RS6-L4 감량: 진입 `saveStatusText.ts`에 두면 /studio 정규화 +0.17~0.46). 그 밖 reason = 문구 없음 → ★"저장하지 못했습니다"(진입 `saveStatusText.ts`).
 */
const REASON_TEXT: Readonly<Record<string, string>> = {
  stale: "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요",
  cleared: "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요",
  readonly: "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다",
  "image-missing": "이미지를 저장하지 못했습니다",
  unsupported: "이 브라우저는 저장소를 쓸 수 없어 이 탭에만 저장합니다",
};
export const reasonText = (reason: string): string | undefined => REASON_TEXT[reason];

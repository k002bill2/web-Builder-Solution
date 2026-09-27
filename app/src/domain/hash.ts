/**
 * FNV-1a 32비트 → 8자리 hex. 보드 초안 seed(profileDraft)와 3안 결과 해시(composeCandidates, DS-2A-04 6.2)가 같은 함수를 쓴다.
 * 독립 모듈인 이유(2a-04c 번들): 3안 계산 청크가 profileDraft를 import하면 rolldown이 profileDraft를 공유 청크로 묶으며
 * compareBoard를 공통 청크에서 떼어 내 `/compare` 첫 화면이 +0.3KB 늘었다(실측 100.00KB).
 */
export function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, "0");
}

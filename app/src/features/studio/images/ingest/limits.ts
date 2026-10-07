/**
 * 변 길이·픽셀 한도 (SPEC 2.3·2.4-1) — 헤더 파서(header.ts)와 저장 레코드 읽기 검증(persistence/imageRecord)이 같은 값을 쓴다.
 * 파서와 분리한 이유: 자동 복원 청크(ADR-004 개정 11 "저장 데이터 복원 진입")가 파서 없이 한도만 받게(값·판정 그대로 — header.ts가 다시 내보낸다).
 */
export const MAX_PIXELS = 40_000_000;
export const MAX_SIDE = 16_384;

export const exceedsPixelLimit = (width: number, height: number): boolean =>
  width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS;

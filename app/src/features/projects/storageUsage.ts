/**
 * `/projects` 저장소 영역 사용량 줄 (P1C-SPEC 1.3 · MQ-C5 A) — `navigator.storage.estimate()`는 출처 전체 근사값이라 "약"을 붙인다.
 * 단위는 imageStore와 같은 1MB = 1024² 바이트 · toFixed(1). 1024MB 이상도 GB로 바꾸지 않는다(이미지 한도 60MB/프로젝트 — 실사용 범위).
 */
const MB = 1024 ** 2;
const HIGH_RATIO = 0.8;

export const QUOTA_HIGH_TEXT = " · 브라우저가 허용한 공간의 80% 이상";

/** usage/quota ≥ 0.8 — quota가 0·없으면 판정하지 않는다(나누면 Infinity) */
export function isQuotaHigh(estimate: StorageEstimate | undefined): boolean {
  const { usage, quota } = estimate ?? {};
  return usage !== undefined && quota !== undefined && quota > 0 && usage / quota >= HIGH_RATIO;
}

/** usage를 모르면 undefined = 줄 숨김(오류 문구 0) */
export function usageText(estimate: StorageEstimate | undefined): string | undefined {
  const usage = estimate?.usage;
  if (usage === undefined) return undefined;
  const base = usage < 0.1 * MB ? "사용량 0.1MB 미만" : `사용량 약 ${(usage / MB).toFixed(1)}MB`;
  return isQuotaHigh(estimate) ? base + QUOTA_HIGH_TEXT : base;
}

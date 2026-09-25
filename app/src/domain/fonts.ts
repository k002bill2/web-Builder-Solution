/**
 * 사용자 폰트 허용 목록 (SPEC 3.5 · ADR-005 Q4).
 * 자유 입력 금지(TR-POL-05 라이선스). FONT-01(ADR-005 D1-갱신)에서 3종 모두 SIL OFL 1.1로 확인되어 모두 활성이다.
 * 비활성 플래그는 목록에 새 폰트를 넣을 때 라이선스 확인 전 상태를 표시하려고 남긴다.
 */
export type AllowedFontId = "pretendard" | "noto-sans-kr" | "noto-serif-kr";

export interface FontOption {
  readonly id: AllowedFontId;
  readonly family: string;
  readonly enabled: boolean;
  /** 비활성 사유 (enabled=false일 때) */
  readonly disabledReason?: string;
}

/** 허용 목록 밖·확인 전 폰트 표시 (ADR-005 D1) */
export const PENDING_LICENSE = "라이선스 확인 중";

export const FONT_OPTIONS: readonly FontOption[] = Object.freeze([
  { id: "pretendard", family: "Pretendard", enabled: true },
  { id: "noto-sans-kr", family: "Noto Sans KR", enabled: true },
  { id: "noto-serif-kr", family: "Noto Serif KR", enabled: true },
]);

/** 레퍼런스 폰트 행에서 고를 수 있는 폰트인지 — 사용자 입력 허용 목록과 같은 기준 (ADR-005 D1) */
export function isAllowedFontFamily(family: string): boolean {
  return FONT_OPTIONS.some((f) => f.enabled && f.family === family);
}

export function fontFamilyOf(id: AllowedFontId): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.family ?? id;
}

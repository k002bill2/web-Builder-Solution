/**
 * 사용자 폰트 허용 목록 (SPEC 3.5 · ADR-005 Q4).
 * 자유 입력 금지(TR-POL-05 라이선스). 라이선스·웹 배포 조건 확인 전에는 Pretendard만 활성이고
 * 나머지는 목록에 보이되 비활성이다.
 */
export type AllowedFontId = "pretendard" | "noto-sans-kr" | "noto-serif-kr";

export interface FontOption {
  readonly id: AllowedFontId;
  readonly family: string;
  readonly enabled: boolean;
  /** 비활성 사유 (enabled=false일 때) */
  readonly disabledReason?: string;
}

const PENDING_LICENSE = "라이선스 확인 중";

export const FONT_OPTIONS: readonly FontOption[] = Object.freeze([
  { id: "pretendard", family: "Pretendard", enabled: true },
  { id: "noto-sans-kr", family: "Noto Sans KR", enabled: false, disabledReason: PENDING_LICENSE },
  { id: "noto-serif-kr", family: "Noto Serif KR", enabled: false, disabledReason: PENDING_LICENSE },
]);

export function fontFamilyOf(id: AllowedFontId): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.family ?? id;
}

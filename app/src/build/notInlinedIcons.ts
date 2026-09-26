/**
 * data URI로 인라인하지 않고 파일(assets/*.svg)로 내보낼 아이콘. vite.config.ts와 가드 테스트만 import한다(앱 코드 import 금지).
 * Icon의 eager glob이 인라인 아이콘을 공통 청크에 넣어 모든 라우트의 첫 화면 JS를 키우므로(ADR-004),
 * `/compare` 첫 화면과 공통 셸(헤더 등)에 그려지지 않는 아이콘만 파일로 둔다. 파일로 두면 공통 청크엔 URL만 남는다.
 */
export const NOT_INLINED_ICON_NAMES = [
  // 비교 보드(03b) 전용
  "check",
  "circle-check",
  "warning",
  "circle-info",
  "chevron-down",
  // BUNDLE-01 R1(e15): 카탈로그·상세에서만 그린다. V2-4에서 이 아이콘을 `/compare` 첫 화면에 쓰면 요청이 생긴다
  "bookmark",
  "bookmark-fill",
  "search",
  "arrow-right",
  "chevron-left",
] as const;

/** Vite `build.assetsInlineLimit` 판정: 목록의 아이콘이면 false(파일), 아니면 undefined(기본 규칙). */
export function notInlinedIconLimit(filePath: string): false | undefined {
  return NOT_INLINED_ICON_NAMES.some((name) => filePath.endsWith(`/assets/icons/${name}.svg`)) ? false : undefined;
}

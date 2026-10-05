/**
 * 사이트 글꼴 (M2B-4a · SPEC-MOTION-FONT 2.1·2.2) — 프로필 계열(fonts.ts 허용 3종) → 사이트 별칭 · 굵기 400·700 대응. 순수 · 렌더 문서와 내보내기 생성기가 같이 쓴다.
 * 별칭: Pretendard = 업스트림 공식 서브셋 무수정(이름 유지) · Noto 2종 = 서브셋 수정본이라 새 이름(RFN). 파일은 `kit/fonts.css`(렌더 문서) · 내보내기는 `data:` 인라인.
 */
const ALIAS: Readonly<Record<string, string>> = { Pretendard: "Pretendard", "Noto Sans KR": "Kit Sans KR", "Noto Serif KR": "Kit Serif KR" };
const SANS = 'system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const SERIF = '"AppleMyungjo", "Batang", serif';

export type SiteWeight = 400 | 700;
export interface SiteFace {
  readonly family: string;
  readonly weight: SiteWeight;
}

/** 커밋한 굵기는 400·700뿐 — 그 밖 값은 가까운 쪽(파일 없는 굵기를 브라우저가 가짜로 만들지 않게) */
export const siteWeight = (weight: number): SiteWeight => (weight > 550 ? 700 : 400);

const aliasOf = (family: string) => ALIAS[family] ?? family;

/** 별칭을 맨 앞에 — 사용자 컴퓨터의 원본 설치 글꼴이 잡히지 않게. 시스템 글꼴 이름은 대체 이름일 뿐 파일을 싣지 않는다 */
export const fontStack = (family: string) => `"${aliasOf(family)}", ${/serif/i.test(family) && !/sans/i.test(family) ? SERIF : SANS}`;

/** 사이트가 실제로 쓰는 면 = 계열 1개 × 대응 굵기(제목·본문, 같으면 1개). 허용 밖 계열 = 0 */
export function siteFaces(type: { readonly family: string; readonly headingWeight: number; readonly bodyWeight: number }): readonly SiteFace[] {
  const family = ALIAS[type.family];
  if (!family) return [];
  return [...new Set([siteWeight(type.headingWeight), siteWeight(type.bodyWeight)])].map((weight) => ({ family, weight }));
}

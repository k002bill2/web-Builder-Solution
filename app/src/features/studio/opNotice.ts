import type { SectionType } from "../../engine/contracts/pageDoc";

/**
 * 편집 알림 문장(6.3 — 연산 1회 = 1문장). SPEC 예문의 조사("Services를")를 이름 발음 받침으로 고른다 —
 * 영어 이름 중 받침으로 끝나는 About(어바웃)·Pricing(프라이싱)만 "을"(유추, REPORT).
 */
const OBJECT_EUL: ReadonlySet<SectionType> = new Set(["about", "pricing"]);
const objectOf = (type: SectionType, name: string) => `${name}${OBJECT_EUL.has(type) ? "을" : "를"}`;

/** 숫자 읽기 받침: 0 영·3 삼·6 육 = 받침 · 1 일·7 칠·8 팔 = ㄹ 받침 */
const DIGIT_JONG: Readonly<Record<string, "none" | "rieul" | "other">> = {
  0: "other", 1: "rieul", 2: "none", 3: "other", 4: "none", 5: "none", 6: "other", 7: "rieul", 8: "rieul", 9: "none",
};
const RIEUL = 8;

function finalConsonant(word: string): "none" | "rieul" | "other" {
  const last = word.trim().at(-1) ?? "";
  const code = last.charCodeAt(0) - 0xac00;
  if (code >= 0 && code < 11172) {
    const jong = code % 28;
    return jong === 0 ? "none" : jong === RIEUL ? "rieul" : "other";
  }
  return DIGIT_JONG[last] ?? "none";
}

/** "으로"/"로" — 받침이 있으면 "으로"(ㄹ 받침은 "로") */
export const toParticle = (word: string): string => (finalConsonant(word) === "other" ? "으로" : "로");

/** "Services를 4번째로 옮겼습니다"(5.2) — N = 섹션 줄 번호(Header 포함, 1부터) */
export const movedNotice = (type: SectionType, name: string, index: number): string => `${objectOf(type, name)} ${index + 1}번째로 옮겼습니다`;

/** "Services를 삭제했습니다"(5.4 · E-S13) */
export const removedNotice = (type: SectionType, name: string): string => `${objectOf(type, name)} 삭제했습니다`;
/** "Services를 되돌렸습니다"(5.4) */
export const restoredNotice = (type: SectionType, name: string): string => `${objectOf(type, name)} 되돌렸습니다`;
/** "FAQ를 6번째에 추가했습니다"(5.3) */
export const addedNotice = (type: SectionType, name: string, index: number): string => `${objectOf(type, name)} ${index + 1}번째에 추가했습니다`;

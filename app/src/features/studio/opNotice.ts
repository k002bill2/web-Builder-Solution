import type { SectionType } from "../../engine/contracts/pageDoc";
import { finalConsonant } from "./particles";

/**
 * 편집 알림 문장(6.3 — 연산 1회 = 1문장). SPEC 예문의 조사("Services를")를 이름 발음 받침으로 고른다 —
 * 영어 이름 중 받침으로 끝나는 About(어바웃)·Pricing(프라이싱)만 "을"(유추, REPORT).
 * 조작 뒤 청크(S-B5) — 연산 청크 docEngine이 다시 내보낸다. 진입 직후 코드는 이 모듈을 import하지 않는다(받침 판정은 particles).
 */
const OBJECT_EUL: ReadonlySet<SectionType> = new Set(["about", "pricing"]);
const objectOf = (type: SectionType, name: string) => `${name}${OBJECT_EUL.has(type) ? "을" : "를"}`;

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
/** "스플릿으로 바꿨습니다 · 잃은 슬롯 1개(부제)"(5.5 · E-S16) — 잃음 0이면 앞 문장만(유추) */
export const swappedNotice = (label: string, lostLabels: readonly string[]): string =>
  `${label}${toParticle(label)} 바꿨습니다${lostLabels.length > 0 ? ` · 잃은 슬롯 ${lostLabels.length}개(${lostLabels.join(", ")})` : ""}`;
/** 변형 교체 되돌리기 — "카드 3개로 되돌렸습니다"(유추: 5.4 "…를 되돌렸습니다" 문형) */
export const swapRevertedNotice = (label: string): string => `${label}${toParticle(label)} 되돌렸습니다`;

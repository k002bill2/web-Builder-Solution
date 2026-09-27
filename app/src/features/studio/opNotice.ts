import type { SectionType } from "../../engine/contracts/pageDoc";

/** "으로"/"로" — 받침이 있으면 "으로"(ㄹ 받침은 "로") */
export function toParticle(word: string): string {
  throw new Error(`RED ${word}`);
}

/** "Services를 4번째로 옮겼습니다"(5.2) — N = 섹션 줄 번호(Header 포함, 1부터) */
export function movedNotice(type: SectionType, name: string, index: number): string {
  throw new Error(`RED ${type} ${name} ${index}`);
}

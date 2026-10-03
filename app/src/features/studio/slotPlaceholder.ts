import { objectParticle } from "./particles";

/** 캔버스 빈 글자 슬롯 자리표시(E-S21 "제목을 입력하세요") — 이름표 + 을/를(유추: SPEC 예문은 "제목" 하나) */
export const slotPlaceholder = (label: string): string => `${label}${objectParticle(label)} 입력하세요`;

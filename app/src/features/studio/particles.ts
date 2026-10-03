/**
 * 한국어 조사 받침 판정 — 진입 직후 청크(빈 슬롯 안내 slotPlaceholder)와 조작 뒤 청크(편집 알림 opNotice)가 함께 쓴다.
 * 알림 문장은 연산을 누를 때만 받으므로(docEngine, S-B5) 여기에는 받침 판정과 "을/를"만 둔다.
 */

/** 숫자 읽기 받침: 0 영·3 삼·6 육 = 받침 · 1 일·7 칠·8 팔 = ㄹ 받침 */
const DIGIT_JONG: Readonly<Record<string, "none" | "rieul" | "other">> = {
  0: "other", 1: "rieul", 2: "none", 3: "other", 4: "none", 5: "none", 6: "other", 7: "rieul", 8: "rieul", 9: "none",
};
const RIEUL = 8;

export function finalConsonant(word: string): "none" | "rieul" | "other" {
  const last = word.trim().at(-1) ?? "";
  const code = last.charCodeAt(0) - 0xac00;
  if (code >= 0 && code < 11172) {
    const jong = code % 28;
    return jong === 0 ? "none" : jong === RIEUL ? "rieul" : "other";
  }
  return DIGIT_JONG[last] ?? "none";
}

/** "을"/"를" — 받침이 있으면 "을" */
export const objectParticle = (word: string): string => (finalConsonant(word) === "none" ? "를" : "을");

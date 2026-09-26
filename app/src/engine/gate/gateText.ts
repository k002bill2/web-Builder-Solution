/**
 * 게이트 원인·대체안 문장 (SPEC 5.12 · 2a-04 4.4 문형 "규칙 ID · 원인 · 대체안").
 * SPEC 따옴표 안 문장은 글자 그대로 옮기고(`gateText.test.ts`가 원문 대조), 숫자가 들어가는 틀은 SPEC 예시 숫자로 대조한다.
 * 구조 규칙(R-01·R-02·R-03·R-04) 원인은 5.2·5.4 이유 문장(ops/reasons)을 그대로 쓴다. INFERRED_GATE_TEXT = SPEC에 없어 같은 문형으로 유추한 것.
 */

/** 받침 있으면 "이", 없으면 "가". 숫자로 끝나면 한자어 읽기(일·이·삼…)로 판정한다 */
const DIGIT_HAS_FINAL = [true, true, false, true, false, false, true, true, true, false];
export function josaIGa(word: string): "이" | "가" {
  const last = word.trim().at(-1) ?? "";
  if (/[0-9]/.test(last)) return DIGIT_HAS_FINAL[Number(last)] ? "이" : "가";
  const code = last.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? "이" : "가";
}

export const GATE_TEXT = Object.freeze({
  /** 5.12 성능 예산 줄 캡션 */
  performanceNote: "생성기 연결 후 측정합니다",
  /** 5.12 대비 줄 대체안 */
  contrastAlternative: "프로필에서 보정",
  /** 5.6 필수 슬롯 빈 값 */
  requiredEmpty: "필수 입력입니다",
  /** E-S14 (L4a Q-3 — 게이트 R-12 자리) */
  footerBusinessInfo: "사업자정보가 있는 Footer가 필요합니다 (R-12)",
  /** E-S23·5.13 "차단 1건(SEO 메타: 설명 없음)" 속 원인 */
  seoDescriptionEmpty: "설명 없음",
  // ── 이하 유추 ──
  seoTitleEmpty: "제목 없음",
  seoAlternative: "“페이지 정보”에서 제목과 설명을 입력하세요",
  contrastUnreadable: "색 값을 읽을 수 없습니다",
  altMissing: "대체텍스트가 없습니다",
  altAlternative: "대체텍스트를 적거나 장식 이미지로 표시하세요",
  headingNoH1: "h1이 없습니다 — Hero가 페이지의 h1입니다",
  headingAlternative: "Hero를 첫 본문에 두고 다른 섹션은 그 뒤에 두세요",
  headingExtraH1: "h1이 둘 이상입니다 — h1은 하나만 둡니다",
  inquiryNotLate: "문의 섹션이 페이지 뒤쪽 1/3에 없습니다 (R-03)",
  inquiryAlternative: "Contact나 CTA Band를 페이지 뒤쪽으로 옮기세요",
  addSectionAlternative: "“섹션 추가”로 넣으세요",
  removeExtraAlternative: "남는 섹션을 지우세요",
  footerAlternative: "사업자정보가 있는 Footer 변형으로 바꾸세요",
  fixedPositionAlternative: "Header는 맨 위, Footer는 맨 아래에 두세요",
  moveHeroAlternative: "Hero 위에 있는 본문 섹션을 Hero 아래로 옮기세요",
  bodyAddAlternative: "“섹션 추가”로 본문을 5개 이상 만드세요",
  bodyRemoveAlternative: "본문 섹션을 9개 이하로 지우세요",
  unknownVariant: "라이브러리에 없는 섹션 변형입니다",
  unknownVariantAlternative: "이 섹션을 지우고 라이브러리의 변형으로 다시 추가하세요",
  motionL3: "모션 L3은 쓸 수 없습니다 (R-07)",
  motionAlternative: "모션이 L1 이하인 변형으로 바꾸세요",
  requiredAlternative: "내용을 입력하세요",
  bodyTooFew: (n: number) => `본문 섹션이 ${n}개입니다 — 5개 이상이어야 합니다 (R-01)`,
  bodyTooMany: (n: number) => `본문 섹션이 ${n}개입니다 — 9개까지입니다 (R-01)`,
  headingSkip: (from: number, to: number) => (from === 0 ? `첫 헤딩이 h${to}입니다 — h1이 먼저 와야 합니다` : `헤딩 수준을 건너뜁니다 (h${from}→h${to})`),
  motionL2Over: (n: number) => `L2 모션 섹션이 ${n}번째입니다 — 3개까지입니다 (R-07)`,
  contrastFail: (check: string, pair: string, ratio: string, target: string) => `${check} ${pair} 대비 ${ratio} — 목표 ${target} 미달`,
  shortenTo: (max: number) => `${max}자 이하로 줄이세요`,
});

type TextKey = keyof typeof GATE_TEXT;

/** SPEC에 문장이 없어 같은 문형으로 유추한 것(REPORT 유추 문장 목록) */
export const INFERRED_GATE_TEXT: readonly TextKey[] = (Object.keys(GATE_TEXT) as TextKey[]).filter(
  (key) => typeof GATE_TEXT[key] === "string" && !["performanceNote", "contrastAlternative", "requiredEmpty", "footerBusinessInfo", "seoDescriptionEmpty"].includes(key),
);

/** 5.6 "상한 40자를 6자 넘었습니다 — 내보내기를 막습니다 (R-13)" */
export const overMax = (max: number, length: number) => `상한 ${max}자를 ${length - max}자 넘었습니다 — 내보내기를 막습니다 (R-13)`;

/** 5.7 "3번 카드 제목이 권장 28자를 넘었습니다 (34/28자)" */
export const overRecommended = (subject: string, length: number, recommended: number) =>
  `${subject}${josaIGa(subject)} 권장 ${recommended}자를 넘었습니다 (${length}/${recommended}자)`;

/** 5.6 "권장 28자 — 넘으면 2줄이 될 수 있습니다" */
export const recommendedNote = (recommended: number) => `권장 ${recommended}자 — 넘으면 2줄이 될 수 있습니다`;

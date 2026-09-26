/**
 * 요소 라이브러리 이름표 (DS-2A-04 10.0.1 Q2 · M-06) — 섹션 변형이 아닌 선택 값(CTA 위치·이미지 비율·모바일 구조·카드 스타일)의 보이는 이름.
 * 라이브러리 1.4 기준(섹션 변형 이름표는 sectionLibrary). 프로필 화면 엔진 청크에서만 쓴다 — 보드 청크(/compare 첫 화면 예산)에 넣지 않는다.
 * 모르는 값은 저장된 키를 그대로 보인다.
 */
export type ElementField = "cta_placement" | "media_ratio" | "mobile_pattern" | "card_style";
export type ElementLabels = Readonly<Record<ElementField, Readonly<Record<string, string>>>>;

export const ELEMENT_LABELS: ElementLabels = Object.freeze({
  cta_placement: Object.freeze({
    "hero-inline": "히어로 좌측 하단",
    "hero-center": "히어로 중앙",
    "header-fixed": "헤더 우측 고정",
    "sticky-bottom": "하단 고정 버튼",
  }),
  media_ratio: Object.freeze({ "16:9": "가로형 16:9", "4:5": "세로형 4:5", "1:1": "정사각 1:1" }),
  mobile_pattern: Object.freeze({
    "single-column-bottom-cta": "단일 컬럼 · 하단 CTA",
    "single-column-sticky-cta": "단일 컬럼 · 스티키 CTA",
    "two-column-cards": "2컬럼 카드",
    "single-column-bottom-tabs": "단일 컬럼 · 하단 탭 메뉴",
    "single-column-accordion": "단일 컬럼 · 아코디언 목록",
    "two-column-cards-bottom-cta": "2컬럼 카드 · 하단 주문 CTA",
  }),
  card_style: Object.freeze({
    "bordered-lg": "보더 카드 · 모서리 큼",
    "bordered-md": "보더 카드 · 모서리 보통",
    elevated: "엘리베이티드 카드(그림자)",
    flat: "플랫 · 구분선",
  }),
});

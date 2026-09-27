/**
 * 예시 문구 표 (SPEC r4.7 A3-Q8) — 새 문서를 만들 때(`startDocWrite`, 조작 뒤 청크) 텍스트 슬롯에 넣는 중립 한국어 문장.
 * 키 = `섹션 유형/슬롯 키`. 픽스처 브랜드와 무관 · 각 슬롯 권장(없으면 상한) 글자 수 이하 · 화면에 "예시" 표시 없음(일반 입력값).
 * 섹션 추가·변형 교체로 생기는 새 슬롯은 엔진 기본값(defaultText) 그대로다(E-AC-24). contact 제목·제출 버튼은 변형(문의/예약)마다 달라 엔진 기본값.
 */
import type { SectionType } from "../domain/compareBoard";

const cards = (n: number, title: string, body: string) => ({ [`services/card${n}Title`]: title, [`services/card${n}Body`]: body });

export const SAMPLE_COPY: Readonly<Record<string, string>> = Object.freeze({
  "header/brand": "우리 브랜드",
  "header/nav": "소개 · 서비스 · 사례 · 문의",
  "header/cta": "상담 신청",
  "header/utility": "회원 로그인 · 도움말",
  "hero/title": "일상에 꼭 맞는 서비스를 만듭니다",
  "hero/subtitle": "처음 만나는 분도 쉽게 이해하도록, 무엇을 어떻게 돕는지 분명하게 보여 드립니다.",
  "hero/cta": "자세히 보기",
  "about/heading": "우리를 소개합니다",
  "about/body": "작은 팀으로 시작해 한 분 한 분의 이야기를 듣는 일을 가장 먼저 해 왔습니다. 필요한 것만 정확하게, 약속한 날짜에 전하는 것이 우리가 지키는 기준입니다.",
  "services/heading": "제공하는 서비스",
  "services/intro": "필요에 맞춰 고를 수 있도록 서비스를 세 가지로 나눴습니다.",
  ...cards(1, "맞춤 상담", "현재 상황을 듣고 알맞은 방법을 함께 정합니다."),
  ...cards(2, "진행 관리", "일정과 진행 상황을 한눈에 볼 수 있게 정리해 드립니다."),
  ...cards(3, "사후 지원", "마무리 뒤에도 궁금한 점을 이어서 도와드립니다."),
  "services/items": "맞춤 상담 · 진행 관리 · 사후 지원",
  "portfolio/heading": "최근 작업",
  "portfolio/intro": "최근에 함께한 작업 가운데 몇 가지를 골라 소개합니다.",
  "statistics/heading": "숫자로 보는 우리",
  "statistics/stat1Value": "10년",
  "statistics/stat1Label": "함께한 시간",
  "statistics/stat2Value": "1,200+",
  "statistics/stat2Label": "진행한 프로젝트",
  "statistics/stat3Value": "98%",
  "statistics/stat3Label": "다시 찾는 비율",
  "testimonials/heading": "이용하신 분들의 이야기",
  "testimonials/quote1": "처음부터 끝까지 설명이 친절해서 믿고 맡길 수 있었습니다.",
  "testimonials/author1": "김○○ 님",
  "testimonials/quote2": "일정을 꼼꼼히 챙겨 주셔서 걱정 없이 기다렸습니다.",
  "testimonials/author2": "이○○ 님",
  "pricing/heading": "요금제 한눈에 보기",
  "pricing/intro": "필요한 만큼 고를 수 있도록 두 가지 요금제를 준비했습니다.",
  "pricing/plan1Name": "기본",
  "pricing/plan1Price": "월 5만 원부터",
  "pricing/plan1Body": "처음 시작하는 분께 맞는 구성입니다.",
  "pricing/plan2Name": "확장",
  "pricing/plan2Price": "별도 상담",
  "pricing/plan2Body": "규모에 맞춰 범위와 일정을 함께 정합니다.",
  "faq/heading": "궁금한 점을 모았습니다",
  "faq/q1": "상담은 어떻게 신청하나요?",
  "faq/a1": "아래 문의 양식에 연락처를 남겨 주시면 영업일 기준 하루 안에 연락드립니다.",
  "faq/q2": "진행 기간은 얼마나 걸리나요?",
  "faq/a2": "범위에 따라 다르며, 상담 때 예상 일정을 먼저 안내해 드립니다.",
  "faq/q3": "중간에 내용을 바꿀 수 있나요?",
  "faq/a3": "진행 단계마다 확인 절차가 있어 필요한 부분을 조정할 수 있습니다.",
  "contact/intro": "궁금한 점을 남겨 주시면 확인 후 빠르게 답변드립니다.",
  "contact/consent": "문의 답변을 위해 이름과 연락처를 수집·이용하는 데 동의합니다.",
  "cta-band/heading": "지금 바로 상담해 보세요",
  "cta-band/body": "짧은 상담으로 필요한 것을 함께 정리해 드립니다.",
  "cta-band/cta": "상담 신청",
  "footer/businessInfo": "상호 우리 브랜드 · 대표 홍길동 · 사업자등록번호 000-00-00000",
  "footer/links": "이용약관 · 개인정보처리방침 · 고객센터",
  "footer/copyright": "© 우리 브랜드. All rights reserved.",
});

export const sampleCopyOf = (type: SectionType, key: string): string | undefined => SAMPLE_COPY[`${type}/${key}`];

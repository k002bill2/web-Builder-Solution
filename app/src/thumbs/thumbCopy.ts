/**
 * 썸네일 문구 표 (B-M3P-01 · M3P-4 QA QB-01) — 썸네일 렌더 입력(`referenceDoc`)에서만 텍스트 슬롯을 덮는다. 빌드 도구 전용(앱 번들 밖 — thumbsImportGuard).
 * 저장소 안 추상 문구 — 실존 상호·외부 문구 0. 편집기 새 문서의 예시 문구(`sampleCopy`)와 편집기 문서 생성 경로는 그대로다.
 * hero 제목 = 업종 × 레이아웃(생성기가 업종 안 레이아웃을 겹치지 않게 고르므로 장마다 다름) · 부제 = 톤(첫 시각 태그) + 업종 · 섹션 제목 = 업종.
 * 표 밖 업종·레이아웃·톤은 throw — 조용한 폴백 0. 글자 수는 슬롯 권장값 이하(thumbCopy.test).
 */
import type { DesignReference, LayoutTypeId } from "../domain/reference";

type Industry = DesignReference["industry"];
type Layouts = Readonly<Record<LayoutTypeId, string>>;

const HERO_TITLES: Partial<Readonly<Record<Industry, Layouts>>> = {
  "cafe-fnb": { fullbleed: "아침을 여는 한 잔의 커피", split: "매일 굽는 빵과 따뜻한 차", center: "천천히 머무는 동네 찻집", grid: "오늘의 메뉴를 골라 보세요", text: "좋은 재료로 정직하게 만듭니다", image: "갓 구운 빵 냄새가 나는 가게" },
  beauty: { fullbleed: "나다운 스타일을 찾는 시간", split: "섬세한 손길로 완성하는 헤어", center: "피부 결을 살피는 맞춤 관리", grid: "오늘 기분에 맞는 네일 컬러", text: "하루를 정돈하는 차분한 케어", image: "거울 앞이 즐거워지는 변화" },
  medical: { fullbleed: "가까운 곳에서 지키는 건강", split: "꼼꼼한 진료, 편안한 회복", center: "아픈 곳을 먼저 듣는 진료실", grid: "진료 시간과 예약을 한눈에", text: "정확한 설명으로 신뢰를 드립니다", image: "건강한 미소를 함께 지킵니다" },
  fitness: { fullbleed: "몸이 가벼워지는 첫 수업", split: "자세부터 바로잡는 1:1 코칭", center: "꾸준함을 만드는 작은 습관", grid: "이번 주 수업 시간표", text: "내 몸에 맞는 운동을 설계합니다", image: "호흡과 함께 움직이는 시간" },
  professional: { fullbleed: "복잡한 문제를 차근차근 풉니다", split: "기업의 결정을 돕는 자문", center: "분명한 기준으로 답을 찾습니다", grid: "분야별 전문가를 만나 보세요", text: "기록과 근거로 말하는 상담", image: "오래 함께할 파트너가 되겠습니다" },
  education: { fullbleed: "배우는 즐거움을 깨우는 교실", split: "수준에 맞춘 소규모 수업", center: "질문이 많아지는 수업을 합니다", grid: "이번 학기 강좌를 살펴보세요", text: "기초부터 탄탄하게 쌓아 갑니다", image: "아이의 속도에 맞춰 함께 걷습니다" },
};

const TONE_LEADS: Readonly<Record<string, string>> = {
  minimal: "군더더기 없이", warm: "따뜻한 분위기 속에서", sophisticated: "세심하게 다듬은 경험으로", bold: "과감하고 분명하게",
  trust: "믿을 수 있는 과정으로", clean: "깔끔하게 정리된 안내로", lively: "활기찬 에너지로", bright: "밝고 산뜻하게",
  formal: "격식 있는 절차로", restrained: "차분하고 절제된 방식으로", friendly: "친근한 말투로", handmade: "손으로 하나하나 정성껏",
};

interface IndustryCopy {
  readonly promise: string;
  /** 섹션 유형 → 제목(heading 슬롯) */
  readonly headings: Readonly<Record<string, string>>;
}

const headings = (about: string, services: string, portfolio: string, testimonials: string, pricing: string, faq: string, ctaBand: string) =>
  ({ about, services, portfolio, testimonials, pricing, faq, "cta-band": ctaBand });

const INDUSTRY_COPY: Partial<Readonly<Record<Industry, IndustryCopy>>> = {
  "cafe-fnb": { promise: "매일의 메뉴와 머물기 좋은 공간을 소개합니다.", headings: headings("가게 이야기", "오늘의 메뉴", "공간과 메뉴 사진", "단골손님의 한마디", "메뉴 가격", "방문 전에 확인하세요", "자리 예약하기") },
  beauty: { promise: "나에게 맞는 관리와 예약 방법을 안내합니다.", headings: headings("살롱을 소개합니다", "시술 메뉴", "스타일 사례", "고객 후기", "시술 가격", "예약 전 궁금한 점", "지금 예약하세요") },
  medical: { promise: "진료 과목과 예약 방법을 안내합니다.", headings: headings("병원 소개", "진료 과목", "진료 사례", "환자분들의 후기", "비급여 진료비", "진료 안내 FAQ", "진료 예약하기") },
  fitness: { promise: "수업 구성과 시간표를 안내합니다.", headings: headings("스튜디오 소개", "수업 프로그램", "수업 현장", "회원 후기", "수강권 안내", "수강 전 궁금한 점", "체험 수업 신청") },
  professional: { promise: "상담 분야와 진행 절차를 안내합니다.", headings: headings("사무소 소개", "업무 분야", "주요 사례", "의뢰인 후기", "상담 비용", "상담 전 확인 사항", "상담 예약하기") },
  education: { promise: "과정 구성과 수강 방법을 안내합니다.", headings: headings("학원 소개", "개설 과정", "수업 결과", "수강생 후기", "수강료 안내", "수강 문의 FAQ", "수강 상담 신청") },
};

/** 레퍼런스 → 덮을 문구(키 = `섹션 유형/슬롯 키`, sampleCopy와 같은 키 모양) */
export function thumbCopyOf(reference: Pick<DesignReference, "id" | "industry" | "layoutType" | "visualTags">): Readonly<Record<string, string>> {
  const { id, industry, layoutType } = reference;
  const title = HERO_TITLES[industry]?.[layoutType];
  const copy = INDUSTRY_COPY[industry];
  const tone = reference.visualTags[0];
  const lead = tone === undefined ? undefined : TONE_LEADS[tone];
  if (!title || !copy) throw new Error(`썸네일 문구 ${id}: 업종·레이아웃 "${industry}/${layoutType}"는 문구 표 밖입니다`);
  if (!lead) throw new Error(`썸네일 문구 ${id}: 톤 "${tone ?? ""}"는 문구 표 밖입니다`);
  return Object.freeze({
    "hero/title": title,
    "hero/subtitle": `${lead} ${copy.promise}`,
    ...Object.fromEntries(Object.entries(copy.headings).map(([type, text]) => [`${type}/heading`, text])),
  });
}

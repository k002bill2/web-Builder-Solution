/**
 * 본문 9 type 정의 — 변형 1~2개씩 최소 정의(L4a). 헤딩은 모두 h2(R-10), 기본 글자는 자체 문장(외부 사이트 문구 0).
 */
import type { SectionType } from "../contracts/pageDoc";
import type { SectionDefinition, SlotSchema } from "../contracts/sectionDefinition";
import type { SectionMotion } from "../contracts/pageDoc";
import { heading, image, link, long, short } from "./slots";

type BodyType = Exclude<SectionType, "header" | "hero" | "footer">;

interface BodySpec {
  readonly type: BodyType;
  readonly variant: string;
  readonly label: string;
  readonly slots: SlotSchema;
  readonly maxMotion: SectionMotion;
  readonly reservation?: boolean;
}

const intro = long("intro", "소개 문장", 160, { recommended: 100, text: "이 섹션에서 전하려는 내용을 한두 문장으로 적습니다." });
const card = (n: number) => [
  short(`card${n}Title`, `카드 ${n} 제목`, 30, { required: true, recommended: 20, text: `항목 ${n}` }),
  long(`card${n}Body`, `카드 ${n} 설명`, 120, { recommended: 80, text: "항목을 짧게 설명합니다." }),
];
const stat = (n: number) => [
  short(`stat${n}Value`, `수치 ${n}`, 12, { required: true, text: "100+" }),
  short(`stat${n}Label`, `수치 ${n} 설명`, 30, { required: true, recommended: 20, text: "설명" }),
];
const quote = (n: number) => [
  long(`quote${n}`, `후기 ${n}`, 200, { required: true, recommended: 140, text: "이용 후기를 적습니다." }),
  short(`author${n}`, `후기 ${n} 작성자`, 30, { required: true, text: "고객" }),
];
const plan = (n: number) => [
  short(`plan${n}Name`, `요금제 ${n} 이름`, 20, { required: true, text: `요금제 ${n}` }),
  short(`plan${n}Price`, `요금제 ${n} 가격`, 20, { required: true, text: "문의" }),
  long(`plan${n}Body`, `요금제 ${n} 설명`, 120, { recommended: 80, text: "포함 내용을 적습니다." }),
];
const qa = (n: number) => [
  short(`q${n}`, `질문 ${n}`, 80, { required: true, recommended: 50, text: "자주 묻는 질문" }),
  long(`a${n}`, `답변 ${n}`, 300, { required: true, recommended: 200, text: "답변을 적습니다." }),
];
const contactSlots = (submit: string): SlotSchema => [
  heading(submit === "예약하기" ? "예약" : "문의"),
  intro,
  link("submit", "제출 버튼 문구", 16, { required: true, recommended: 10, text: submit }),
  short("consent", "개인정보 수집 동의 문구", 100, { required: true, text: "개인정보 수집·이용에 동의합니다." }),
];

const SPECS: readonly BodySpec[] = [
  { type: "about", variant: "story", label: "이야기 + 이미지", maxMotion: "L2", slots: [heading("소개"), long("body", "본문", 400, { required: true, recommended: 280, text: "브랜드가 하는 일을 소개합니다." }), image("image", "소개 이미지")] },
  { type: "about", variant: "text", label: "글 중심 소개", maxMotion: "L1", slots: [heading("소개"), long("body", "본문", 400, { required: true, recommended: 280, text: "브랜드가 하는 일을 소개합니다." })] },
  { type: "services", variant: "cards-3", label: "카드 3개", maxMotion: "L2", slots: [heading("서비스"), intro, ...card(1), ...card(2), ...card(3)] },
  { type: "services", variant: "list", label: "목록형", maxMotion: "L1", slots: [heading("서비스"), intro, long("items", "서비스 목록", 400, { required: true, text: "서비스 1 · 서비스 2 · 서비스 3" })] },
  { type: "portfolio", variant: "grid-3", label: "이미지 그리드 3칸", maxMotion: "L2", slots: [heading("작업 사례"), intro, image("image1", "사례 이미지 1"), image("image2", "사례 이미지 2"), image("image3", "사례 이미지 3")] },
  { type: "statistics", variant: "stats-3", label: "수치 3개 한 줄", maxMotion: "L2", slots: [heading("숫자로 보기"), ...stat(1), ...stat(2), ...stat(3)] },
  { type: "testimonials", variant: "quotes-2", label: "후기 2개", maxMotion: "L1", slots: [heading("고객 후기"), ...quote(1), ...quote(2)] },
  { type: "pricing", variant: "tiers-2", label: "요금제 2단", maxMotion: "L1", slots: [heading("요금 안내"), intro, ...plan(1), ...plan(2)] },
  { type: "faq", variant: "accordion", label: "펼침 목록", maxMotion: "L1", slots: [heading("자주 묻는 질문"), ...qa(1), ...qa(2), ...qa(3)] },
  { type: "contact", variant: "form", label: "문의 폼", maxMotion: "L1", slots: contactSlots("문의하기") },
  { type: "contact", variant: "booking", label: "예약 폼", maxMotion: "L1", reservation: true, slots: contactSlots("예약하기") },
  { type: "cta-band", variant: "banner", label: "가로 띠 배너", maxMotion: "L2", slots: [heading("지금 시작하세요"), long("body", "본문", 120, { recommended: 80, text: "다음 행동을 한 문장으로 권합니다." }), link("cta", "버튼 문구", 16, { required: true, recommended: 10, text: "문의하기" })] },
];

export const BODY_DEFINITIONS: readonly SectionDefinition[] = SPECS.map((s) => ({
  type: s.type,
  variant: s.variant,
  label: s.label,
  schemaVersion: 1,
  slots: s.slots,
  constraints: { maxMotion: s.maxMotion, fullBleed: false },
  a11y: { headingLevel: 2, altRequired: s.slots.some((slot) => slot.kind === "image") },
  ...(s.reservation ? { reservation: true } : {}),
}));

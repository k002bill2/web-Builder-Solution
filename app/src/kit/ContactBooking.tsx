import { ContactKit, type FormSpec } from "./ContactForm";
import type { KitSectionProps } from "./types";

/** 예약 폼 고정 문구·칸 (SPEC-BODY B1-11 1 — 킷 고정 문구, 슬롯 아님). 날짜·시간 = type text(선택기 0, MQ-B6) · 한 묶음 */
const BOOKING: FormSpec = {
  notice: "온라인 예약은 준비 중입니다. 지금은 이 양식으로 예약할 수 없습니다.",
  legend: "예약 양식",
  fields: [
    { key: "name", label: "이름", type: "text", autoComplete: "name" },
    { key: "tel", label: "연락처", type: "tel", autoComplete: "tel" },
    [
      { key: "date", label: "희망 날짜", type: "text" },
      { key: "time", label: "희망 시간", type: "text" },
    ],
    { key: "request", label: "요청 사항 (선택)", rows: 3, optional: true },
  ],
};

/** contact/booking (B1-11 · K2 A안 상속) — contact/form과 같은 2단·비활성 폼(fieldset disabled · action·method·placeholder 0), 칸 구성과 고정 문구만 다르다. 실제 예약 기능 아님 */
export const ContactBooking = (props: KitSectionProps) => <ContactKit {...props} spec={BOOKING} />;

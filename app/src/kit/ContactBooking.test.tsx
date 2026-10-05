import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc } from "../render/testing/drawKit";

/** contact/booking (M2B-2c · SPEC-BODY B1-11 · K2 A안 상속) — 비활성 예약 폼. 2단/1단·날짜·시간 행·불투명도·정적 HTML 요청 0 실측(KD-AC-20 [B])은 P-B */
const bookingDoc = (slots: Readonly<Record<string, string>> = {}) =>
  withSections(
    sampleDoc(),
    sampleDoc().sections.map((s) => {
      if (s.type !== "contact") return s;
      const base = section("contact", "booking", "s-booking");
      return { ...base, slots: { ...base.slots, ...slots } };
    }),
  );
const booking = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="contact/booking"]')!;
const NOTICE = "온라인 예약은 준비 중입니다. 지금은 이 양식으로 예약할 수 없습니다.";
const css = () => readFileSync("src/kit/kit.css", "utf8");
const cssSection = (marker: string) => {
  const at = css().indexOf(marker);
  expect(at, marker).toBeGreaterThan(-1);
  return css().slice(at, css().indexOf("\n}\n", at));
};

describe("contact/booking (B1-11)", () => {
  it("KD-AC-19 · KD-AC-08 [U]: 킷 · h2 1 · h3 0 · form action·method 0 · 안내 = fieldset aria-describedby 대상(고정 문구) · legend '예약 양식' · 모든 칸·버튼 fieldset[disabled] 안 · placeholder 0", () => {
    const s = booking(drawDoc(bookingDoc()));
    expect(s).toHaveAttribute("data-kit");
    expect(s.getAttribute("aria-labelledby")).toBe("h-s-booking");
    expect(s.querySelector("h2")).toHaveTextContent("예약");
    expect(s.querySelectorAll("h2")).toHaveLength(1);
    expect(s.querySelectorAll("h3")).toHaveLength(0);
    const form = s.querySelector("form")!;
    expect(form).toHaveAttribute("aria-labelledby", "h-s-booking");
    expect(form).not.toHaveAttribute("action");
    expect(form).not.toHaveAttribute("method");
    const fieldset = s.querySelector("fieldset")!;
    expect(fieldset).toBeDisabled();
    const notice = s.querySelector(`#${fieldset.getAttribute("aria-describedby")}`)!;
    expect(notice.id).toBe("n-s-booking");
    expect(notice.textContent).toBe(NOTICE);
    expect(notice.compareDocumentPosition(fieldset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const legend = fieldset.querySelector("legend")!;
    expect(legend.textContent).toBe("예약 양식");
    expect(legend).toHaveClass("kit-visually-hidden");
    const controls = [...s.querySelectorAll("input, textarea, button, select")];
    expect(controls).toHaveLength(7);
    for (const el of controls) expect(el.closest("fieldset[disabled]")).toBe(fieldset);
    expect(s.querySelectorAll("[placeholder], [style], a")).toHaveLength(0);
  });

  it("KD-AC-19 [U]: 보이는 label for/id = '이름'·'연락처'·'희망 날짜'·'희망 시간'·'요청 사항 (선택)' · type text·tel·text·text + textarea · date·time 0 · required(요청 사항만 선택) · autocomplete name·tel · 날짜·시간은 한 묶음", () => {
    const s = booking(drawDoc(bookingDoc()));
    const labels = [...s.querySelectorAll<HTMLLabelElement>("label.kit-label")];
    expect(labels.map((l) => l.textContent)).toEqual(["이름", "연락처", "희망 날짜", "희망 시간", "요청 사항 (선택)"]);
    const fields = labels.map((l) => s.querySelector<HTMLInputElement>(`#${l.htmlFor}`)!);
    expect(labels.map((l) => l.htmlFor)).toEqual(["name", "tel", "date", "time", "request"].map((k) => `f-s-booking-${k}`));
    expect(fields.map((f) => `${f.tagName}:${f.getAttribute("type")}:${f.name}:${f.required}:${f.getAttribute("autocomplete")}`)).toEqual([
      "INPUT:text:name:true:name",
      "INPUT:tel:tel:true:tel",
      "INPUT:text:date:true:null",
      "INPUT:text:time:true:null",
      "TEXTAREA:null:request:false:null",
    ]);
    expect(s.querySelector("textarea")).toHaveAttribute("rows", "3");
    expect(s.querySelectorAll('input[type="date"], input[type="time"], input[type="datetime-local"]')).toHaveLength(0);
    const row = s.querySelector(".kit-control-row")!;
    expect([...row.querySelectorAll("input")].map((i) => i.name)).toEqual(["date", "time"]);
    expect(s.querySelector('input[type="checkbox"]')).toHaveAttribute("name", "consent");
    expect(s.querySelector('button[type="submit"]')).toHaveTextContent("예약하기");
  });

  it("KD-AC-04 · K1-6 4 [U]: intro 빈 값 → 소개 0 · consent 빈 값 → 체크박스도 0 · submit 빈 값 → 버튼 0 · 안내·legend·칸은 남음 · 빈 p 0", () => {
    const s = booking(drawDoc(bookingDoc({ intro: "", consent: " ", submit: "" })));
    expect(s.querySelector('[data-slot="intro"]')).toBeNull();
    expect(s.querySelectorAll('input[type="checkbox"], button')).toHaveLength(0);
    expect(s.querySelectorAll("label.kit-label")).toHaveLength(5);
    expect(s.querySelector(".kit-notice")!.textContent).toBe(NOTICE);
    expect([...s.querySelectorAll("p, h2, label")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });

  it("KD-AC-20 · 07 [G]: 날짜·시간 묶음 = md 미만 세로(그리드 1열) · md 이상 한 줄 2칸 같은 폭(칸 사이 s4) · 재배치·opacity 0", () => {
    const block = cssSection("/* contact/form (K1-6");
    expect(block).toMatch(/\.kit-control-row \{\s*display: grid;\s*gap: var\(--site-s4\);\s*\}/);
    expect(block).toMatch(/@media \(width >= 48rem\) \{[^@]*\.kit-control-row \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(block).not.toMatch(/\border\s*:|-reverse|grid-area|grid-row|opacity|placeholder/);
  });
});

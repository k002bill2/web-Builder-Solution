import { readFileSync } from "node:fs";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { drawDoc, patch } from "../render/testing/drawKit";

/** contact/form (M2A-2b B5 · m2a K1-6 · K2 A안) — [U] 마크업. 2단 ↔ 1단(K-AC-30 배치)·대비는 B10 브라우저 · 정적 HTML 부분(K-AC-08·30)은 M2A-3 */
const contact = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="contact/form"]')!;
const VISITOR_NOTICE = "온라인 문의는 준비 중입니다. 지금은 이 양식으로 보낼 수 없습니다.";

describe("contact/form (K1-6 · K2 A안)", () => {
  it("구조: section·form aria-labelledby = h2 · 글(제목·소개) → 폼 · form에 action·method 0", () => {
    const c = contact(drawDoc());
    expect(c).toHaveAttribute("data-kit");
    expect(c.getAttribute("aria-labelledby")).toBe("h-s-contact");
    expect(c.querySelector("h2")).toHaveAttribute("id", "h-s-contact");
    expect(c.querySelector('[data-slot="intro"]')!.tagName).toBe("P");
    const form = c.querySelector("form")!;
    expect(form).toHaveAttribute("aria-labelledby", "h-s-contact");
    expect(form).not.toHaveAttribute("action");
    expect(form).not.toHaveAttribute("method");
    expect(c.querySelector("h2")!.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("K-AC-08 (마크업): 모든 input·textarea·button이 fieldset[disabled] 안 · 방문자 안내 = fieldset aria-describedby 대상 · placeholder 0 · 숨긴 legend '문의 양식'", () => {
    const c = contact(drawDoc());
    const fieldset = c.querySelector("fieldset")!;
    expect(fieldset).toBeDisabled();
    const controls = [...c.querySelectorAll("input, textarea, button")];
    expect(controls).toHaveLength(5);
    for (const el of controls) expect(el.closest("fieldset[disabled]")).toBe(fieldset);
    const notice = c.querySelector(`#${fieldset.getAttribute("aria-describedby")}`)!;
    expect(notice).toHaveTextContent(VISITOR_NOTICE);
    expect(notice.id).toBe("n-s-contact");
    expect(c.querySelectorAll("[placeholder]")).toHaveLength(0);
    const legend = fieldset.querySelector("legend")!;
    expect(legend).toHaveTextContent("문의 양식");
    expect(legend).toHaveClass("kit-visually-hidden");
  });

  it("K-AC-29: 입력칸 3개 = 보이는 label for/id('이름'·'이메일'·'문의 내용') · 타입·name·autocomplete·required · 동의 체크박스 이름 = consent 글자 · 보내기 = submit 글자 · 인라인 opacity 0", () => {
    const c = contact(drawDoc());
    const field = (label: string) => {
      const l = [...c.querySelectorAll("label")].find((el) => el.textContent === label)!;
      return c.querySelector(`#${l.getAttribute("for")}`)!;
    };
    expect(field("이름")).toMatchObject({ id: "f-s-contact-name", type: "text", name: "name" });
    expect(field("이름")).toHaveAttribute("autocomplete", "name");
    expect(field("이메일")).toMatchObject({ id: "f-s-contact-email", type: "email", name: "email" });
    expect(field("이메일")).toHaveAttribute("autocomplete", "email");
    expect(field("문의 내용").tagName).toBe("TEXTAREA");
    expect(field("문의 내용")).toHaveAttribute("rows", "5");
    for (const label of ["이름", "이메일", "문의 내용"]) expect(field(label)).toBeRequired();
    const consent = c.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(consent).toHaveAttribute("name", "consent");
    expect(consent).toBeRequired();
    expect(consent.closest("label")!.querySelector('[data-slot="consent"]')).toHaveTextContent("개인정보 수집·이용에 동의합니다.");
    const submit = c.querySelector("button")!;
    expect(submit).toHaveAttribute("type", "submit");
    expect(submit).toHaveAttribute("data-slot", "submit");
    expect(submit).toHaveTextContent("문의하기");
    expect([...c.querySelectorAll<HTMLElement>("*")].filter((el) => el.style.opacity !== "")).toHaveLength(0);
  });

  // m2a SPEC r3 K1-6 3 (B-M2B-07): r2 "연결됐을 때와 같은 모양" → 기본 규칙 = 연결 모양 유지 + fieldset:disabled 블록에만 점선 단서 · 안내 경계 상자 (K-AC-37 [G])
  it("K-AC-37 [G] 비활성 모양 단서: 기본 규칙 = 연결 모양(실선·primary 버튼, UA 회색·반투명 0, 커서 not-allowed) · .kit-fieldset:disabled 블록에만 입력칸 점선·버튼 점선 외곽(면 투명·글자 ink) · 안내 경계 상자 · 불투명도 0", () => {
    const css = readFileSync("src/kit/kit.css", "utf8");
    const field = css.match(/\.kit-field \{[^}]*\}/)![0];
    for (const decl of ["color: var(--site-ink)", "background: var(--site-bg)", "border: var(--site-stroke-1) solid var(--site-ink)", "cursor: not-allowed"]) expect(field).toContain(decl);
    const submit = css.match(/\.kit-submit \{[^}]*\}/)![0];
    for (const decl of ["color: var(--site-on-primary)", "background: var(--site-primary)", "cursor: not-allowed"]) expect(submit).toContain(decl);
    const disabledField = css.match(/\.kit-fieldset:disabled \.kit-field \{[^}]*\}/)![0];
    expect(disabledField).toContain("border-style: dashed");
    const disabledSubmit = css.match(/\.kit-fieldset:disabled \.kit-submit \{[^}]*\}/)![0];
    for (const decl of ["border: var(--site-stroke-1) dashed var(--site-ink)", "background: transparent", "color: var(--site-ink)"]) expect(disabledSubmit).toContain(decl);
    const notice = css.match(/\.kit-notice \{[^}]*\}/)![0];
    for (const decl of ["border: var(--site-stroke-1) solid var(--site-ink)", "border-radius: var(--site-radius-control)", "padding: var(--site-s3) var(--site-s4)", "color: var(--site-ink)"]) expect(notice).toContain(decl);
    for (const block of [disabledField, disabledSubmit, notice]) expect(block).not.toMatch(/opacity|filter|#[0-9a-f]{3,8}\b/i);
  });

  it("K-AC-04: 소개 빈 값 → 소개 0 · 동의 빈 값 → 체크박스도 0 · 보내기 빈 값 → 버튼 0 · 빈 p 0", () => {
    const c = contact(drawDoc(patch(sampleDoc(), "s-contact", { intro: "", consent: " ", submit: "" })));
    expect(c.querySelector('[data-slot="intro"]')).toBeNull();
    expect(c.querySelectorAll('input[type="checkbox"], button')).toHaveLength(0);
    expect([...c.querySelectorAll("p, label")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });

  it("K-AC-03: 상한 글자(제목 40 · 소개 160 · 보내기 16 · 동의 100) 그대로", () => {
    const texts = { heading: "가".repeat(40), intro: "나".repeat(160), submit: "다".repeat(16), consent: "라".repeat(100) };
    const c = contact(drawDoc(patch(sampleDoc(), "s-contact", texts)));
    for (const [key, text] of Object.entries(texts)) expect(c.querySelector(`[data-slot="${key}"]`)!.textContent).toBe(text);
  });
});

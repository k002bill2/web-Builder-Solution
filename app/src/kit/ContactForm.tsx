import { bodySurface, headingId } from "./body";
import { slotText } from "./text";
import type { KitSectionProps } from "./types";

/** 방문자 안내 (K2 A안 문구 1 — 킷 고정 문구, 제작 용어 0) */
export const VISITOR_NOTICE = "온라인 문의는 준비 중입니다. 지금은 이 양식으로 보낼 수 없습니다.";
/** 입력칸 이름표 (킷 고정 문구 — 이름표 슬롯 없음, 0.1) */
const FIELDS = [
  { key: "name", label: "이름", type: "text", autoComplete: "name" },
  { key: "email", label: "이메일", type: "email", autoComplete: "email" },
] as const;

/**
 * contact/form (M2A-2b B5 · m2a K1-6 · K2 A안) — 비활성 폼 + 방문자 안내. `fieldset disabled`가 모든 칸·버튼을 막는다(정적 HTML의 유일한 차단, K-AC-08).
 * form에 action·method 0 · placeholder 0 · 보이는 label for/id(instanceId 접두) · 숨긴 legend "문의 양식". lg 이상 2단(글 5 : 폼 7) · lg 미만 1단.
 * 빈 동의 글자 = 체크박스도 생략(이름 없는 체크박스 0) · 빈 보내기 글자 = 버튼 생략(0.8).
 */
export function ContactForm({ section, root }: KitSectionProps) {
  const heading = slotText(section, "heading");
  const intro = slotText(section, "intro");
  const submit = slotText(section, "submit");
  const consent = slotText(section, "consent");
  const id = headingId(section);
  const notice = `n-${section.instanceId}`;
  const field = (key: string) => `f-${section.instanceId}-${key}`;
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={id} className="kit-body kit-contact">
      <div className="kit-wrap kit-contact-grid">
        <div className="kit-contact-text">
          {heading && (
            <h2 id={id} data-slot="heading" className="kit-title">
              {heading}
            </h2>
          )}
          {intro && (
            <p data-slot="intro" className="kit-contact-intro">
              {intro}
            </p>
          )}
        </div>
        <form aria-labelledby={id} className="kit-form">
          <p id={notice} className="kit-notice">
            {VISITOR_NOTICE}
          </p>
          <fieldset disabled aria-describedby={notice} className="kit-fieldset">
            <legend className="kit-visually-hidden">문의 양식</legend>
            {FIELDS.map((f) => (
              <div key={f.key} className="kit-control">
                <label htmlFor={field(f.key)} className="kit-label">
                  {f.label}
                </label>
                <input id={field(f.key)} type={f.type} name={f.key} autoComplete={f.autoComplete} required className="kit-field" />
              </div>
            ))}
            <div className="kit-control">
              <label htmlFor={field("message")} className="kit-label">
                문의 내용
              </label>
              <textarea id={field("message")} name="message" rows={5} required className="kit-field" />
            </div>
            {consent && (
              <label className="kit-consent">
                <input type="checkbox" name="consent" required className="kit-check" />
                <span data-slot="consent">{consent}</span>
              </label>
            )}
            {submit && (
              <button type="submit" data-slot="submit" className="kit-submit">
                {submit}
              </button>
            )}
          </fieldset>
        </form>
      </div>
    </section>
  );
}

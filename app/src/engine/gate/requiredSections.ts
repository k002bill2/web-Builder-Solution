/**
 * 필수 섹션 줄 (SPEC 5.12 — R-01·R-02·R-03·R-04·R-12). 구조 판정(`structureIssues`, R-01·R-02)은
 * createDocFromCandidate 거부에도 같은 함수를 쓴다. 원인 문장은 5.2·5.4 이유 문장(ops/reasons) 그대로.
 */
import type { SectionType } from "../contracts/pageDoc";
import type { GateTheme } from "../contracts/pending";
import type { GateIssue, GateRuleId } from "../contracts/records";
import { BODY_MAX, BODY_MIN } from "../ops/rules";
import { REASONS } from "../ops/reasons";
import { getSectionDefinition } from "../sections/registry";
import { GATE_TEXT } from "./gateText";
import { issue, type IssueAt } from "./issue";

/** 판정 재료 — 문서 섹션이든 구조안 항목이든 */
export interface Placement {
  readonly type: SectionType;
  readonly variant: string;
  readonly instanceId?: string;
}

const at = (s: Placement): IssueAt => (s.instanceId === undefined ? {} : { instanceId: s.instanceId });
const block = (ruleId: GateRuleId, cause: string, alternative: string, where: IssueAt = {}) => issue(ruleId, "block", cause, alternative, where);
const isBody = (s: Placement) => s.type !== "header" && s.type !== "footer";
const isInquiry = (s: Placement) => s.type === "contact" || s.type === "cta-band";
const isReservation = (s: Placement) => getSectionDefinition(s.type, s.variant)?.reservation === true;

/** R-03 "후반 1/3" — 본문(Hero 포함) n개 중 index ≥ n − ⌈n/3⌉ (n=6 → 뒤 2개, n=7 → 뒤 3개). 설계 질문 Q-20 */
export const lateThirdStart = (bodyLength: number): number => bodyLength - Math.ceil(bodyLength / 3);

/** 정확히 하나: 없음 → missing, 둘째부터 → extra */
function exactlyOne(sections: readonly Placement[], type: SectionType, ruleId: GateRuleId, missing: string, extra: string): GateIssue[] {
  const found = sections.filter((s) => s.type === type);
  if (found.length === 0) return [block(ruleId, missing, GATE_TEXT.addSectionAlternative)];
  return found.slice(1).map((s) => block(ruleId, extra, GATE_TEXT.removeExtraAlternative, at(s)));
}

/** R-01(header 1 맨 위 · footer 1 맨 아래 · 본문 5~9) · R-02(Hero 1개 · 첫 본문). 순서 = 아래 나열 순서 */
export function structureIssues(sections: readonly Placement[]): readonly GateIssue[] {
  const header = sections.findIndex((s) => s.type === "header");
  const footer = sections.findIndex((s) => s.type === "footer");
  const bodies = sections.filter(isBody);
  const hero = bodies.find((s) => s.type === "hero");
  return [
    ...exactlyOne(sections, "header", "R-01", REASONS.removeHeader, REASONS.addHeaderOnce),
    ...(header > 0 ? [block("R-01", REASONS.moveHeader, GATE_TEXT.fixedPositionAlternative, at(sections[header]!))] : []),
    ...exactlyOne(sections, "footer", "R-01", REASONS.removeFooter, REASONS.addFooterOnce),
    ...(footer >= 0 && footer !== sections.length - 1 ? [block("R-01", REASONS.moveFooter, GATE_TEXT.fixedPositionAlternative, at(sections[footer]!))] : []),
    ...(bodies.length < BODY_MIN ? [block("R-01", GATE_TEXT.bodyTooFew(bodies.length), GATE_TEXT.bodyAddAlternative)] : []),
    ...(bodies.length > BODY_MAX ? [block("R-01", GATE_TEXT.bodyTooMany(bodies.length), GATE_TEXT.bodyRemoveAlternative)] : []),
    ...exactlyOne(bodies, "hero", "R-02", REASONS.removeHero, REASONS.addHeroOnce),
    ...(hero && bodies[0] !== hero ? [block("R-02", REASONS.moveHero, GATE_TEXT.moveHeroAlternative, at(hero))] : []),
  ];
}

/** R-03 문의(후반 1/3) · R-04 예약 — 목적은 부르는 쪽이 넘긴다(편집기는 목적을 바꾸지 않는다) */
function purposeIssues(sections: readonly Placement[], purpose: GateTheme["purpose"]): readonly GateIssue[] {
  if (purpose === "booking" && !sections.some(isReservation)) {
    return [block("R-04", REASONS.removeBooking, GATE_TEXT.addSectionAlternative)];
  }
  if (purpose !== "inquiry") return [];
  const bodies = sections.filter(isBody);
  const inquiries = bodies.flatMap((s, index) => (isInquiry(s) ? [{ s, index }] : []));
  const last = inquiries.at(-1);
  if (!last) return [block("R-03", REASONS.removeInquiry, GATE_TEXT.addSectionAlternative)];
  return last.index >= lateThirdStart(bodies.length) ? [] : [block("R-03", GATE_TEXT.inquiryNotLate, GATE_TEXT.inquiryAlternative, at(last.s))];
}

/** R-12 — Footer 변형에 사업자정보가 있어야 한다(없는 Footer는 R-01 몫) */
function footerIssues(sections: readonly Placement[]): readonly GateIssue[] {
  return sections
    .filter((s) => s.type === "footer" && getSectionDefinition(s.type, s.variant)?.hasBusinessInfo === false)
    .map((s) => block("R-12", GATE_TEXT.footerBusinessInfo, GATE_TEXT.footerAlternative, at(s)));
}

/** 라이브러리에 없는 type/variant — 다른 줄은 이 섹션을 건너뛰므로 여기서 차단한다(Q-22) */
function unknownIssues(sections: readonly Placement[]): readonly GateIssue[] {
  return sections
    .filter((s) => getSectionDefinition(s.type, s.variant) === undefined)
    .map((s) => block("R-01", GATE_TEXT.unknownVariant, GATE_TEXT.unknownVariantAlternative, at(s)));
}

export function requiredSectionIssues(sections: readonly Placement[], purpose: GateTheme["purpose"]): readonly GateIssue[] {
  return [...structureIssues(sections), ...purposeIssues(sections, purpose), ...footerIssues(sections), ...unknownIssues(sections)];
}

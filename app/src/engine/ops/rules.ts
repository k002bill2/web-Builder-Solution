/**
 * 가능 여부 + 이유 문장 (SPEC 8.2 `canAdd`·`canRemove`·`canMove`·`canSwapVariant`). 연산(sectionOps)도 같은 함수로 막는다 — 규칙은 여기 한 곳.
 */
import type { PurposeId } from "../../domain/reference";
import type { PageDoc, SectionType } from "../contracts/pageDoc";
import { getSectionDefinition } from "../sections/registry";
import { indexOfSection, sectionAt } from "./errors";
import { REASONS } from "./reasons";

export type Permission = { readonly ok: true } | { readonly ok: false; readonly reason: string };
export type MoveDirection = "up" | "down";
export type Purpose = PurposeId | "none";

/** R-01 본문(hero 포함) 상한·하한 */
export const BODY_MAX = 9;
export const BODY_MIN = 5;

const ALLOWED: Permission = Object.freeze({ ok: true });
const deny = (reason: string): Permission => ({ ok: false, reason });

const isBody = (type: SectionType) => type !== "header" && type !== "footer";
export const bodyCount = (doc: PageDoc): number => doc.sections.filter((s) => isBody(s.type)).length;
/** 섹션 자리의 유형·변형 — 판정은 이것만 본다 */
interface Placement {
  readonly type: SectionType;
  readonly variant: string;
}
type Match = (type: SectionType, variant: string) => boolean;
const countIn = (sections: readonly Placement[], match: Match) => sections.filter((s) => match(s.type, s.variant)).length;
const countOf = (doc: PageDoc, match: Match) => countIn(doc.sections, match);

const ONCE = { header: REASONS.addHeaderOnce, hero: REASONS.addHeroOnce, footer: REASONS.addFooterOnce } as const;

/** 유형을 주면 header·hero·footer 중복도 본다(5.3 유형 목록). 주지 않으면 본문 상한만(E-S12 "섹션 추가" 버튼) */
export function canAdd(doc: PageDoc, type?: SectionType): Permission {
  if ((type === "header" || type === "hero" || type === "footer") && countOf(doc, (t) => t === type) > 0) return deny(ONCE[type]);
  if ((type === undefined || isBody(type)) && bodyCount(doc) >= BODY_MAX) return deny(REASONS.addBodyLimit);
  return ALLOWED;
}

const isReservation = (type: SectionType, variant: string) => getSectionDefinition(type, variant)?.reservation === true;
const isInquiry: Match = (type) => type === "contact" || type === "cta-band";

/**
 * 목적 필수 조건(R-04 예약 · R-03 문의) — instanceId 섹션을 `next`(null = 삭제)로 바꾼 뒤 조건을 채우는 섹션이
 * 전 ≥ 1 · 후 0이 되면 거부한다(원래 없던 조건은 막지 않는다 — 게이트 몫). canRemove·canSwapVariant가 같이 쓴다.
 * 목적(프로필 조정 값)은 편집기가 바꾸지 않는다 — 부르는 쪽이 넘긴다.
 */
function purposeCheck(doc: PageDoc, instanceId: string, purpose: Purpose, next: Placement | null): Permission {
  const after = doc.sections.flatMap((s) => (s.instanceId !== instanceId ? [s] : next ? [next] : []));
  const breaks = (match: Match) => countOf(doc, match) > 0 && countIn(after, match) === 0;
  if (purpose === "booking" && breaks(isReservation)) return deny(REASONS.removeBooking);
  if (purpose === "inquiry" && breaks(isInquiry)) return deny(REASONS.removeInquiry);
  return ALLOWED;
}

export function canRemove(doc: PageDoc, instanceId: string, purpose: Purpose): Permission {
  const { type } = sectionAt(doc, instanceId);
  const sole = countOf(doc, (t) => t === type) === 1;
  if (type === "header" && sole) return deny(REASONS.removeHeader);
  if (type === "footer" && sole) return deny(REASONS.removeFooter);
  if (type === "hero" && sole) return deny(REASONS.removeHero);
  return purposeCheck(doc, instanceId, purpose, null);
}

/**
 * 변형 교체(8.2 r3 Q-14) — 구조 규칙은 없다(유형이 그대로). 목적 조건만: 예약 목적의 유일한 예약 변형을 다른 변형으로 바꾸면 R-04 거부.
 * 이유 문장은 5.4 R-04 문장 그대로(목적이 요구하는 것을 말하는 문장이라 삭제·교체 공통). R-03(유형 기준)은 교체로 깨지지 않는다.
 */
export function canSwapVariant(doc: PageDoc, instanceId: string, variant: string, purpose: Purpose): Permission {
  const { type } = sectionAt(doc, instanceId);
  return purposeCheck(doc, instanceId, purpose, { type, variant });
}

export function canMove(doc: PageDoc, instanceId: string, direction: MoveDirection): Permission {
  const index = indexOfSection(doc, instanceId);
  const { type } = doc.sections[index]!;
  if (type === "header") return deny(REASONS.moveHeader);
  if (type === "footer") return deny(REASONS.moveFooter);
  if (type === "hero") return deny(REASONS.moveHero);
  const neighbor = doc.sections[direction === "up" ? index - 1 : index + 1]?.type;
  if (direction === "up" && neighbor === "hero") return deny(REASONS.moveAboveHero);
  if (direction === "up" && (neighbor === undefined || neighbor === "header")) return deny(REASONS.moveAboveHeader);
  if (direction === "down" && (neighbor === undefined || neighbor === "footer")) return deny(REASONS.moveBelowFooter);
  return ALLOWED;
}

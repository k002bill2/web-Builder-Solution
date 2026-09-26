/**
 * 가능 여부 + 이유 문장 (SPEC 8.2 `canAdd`·`canRemove`·`canMove`). 연산(sectionOps)도 같은 함수로 막는다 — 규칙은 여기 한 곳.
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
const countOf = (doc: PageDoc, match: (type: SectionType, variant: string) => boolean) =>
  doc.sections.filter((s) => match(s.type, s.variant)).length;

const ONCE = { header: REASONS.addHeaderOnce, hero: REASONS.addHeroOnce, footer: REASONS.addFooterOnce } as const;

/** 유형을 주면 header·hero·footer 중복도 본다(5.3 유형 목록). 주지 않으면 본문 상한만(E-S12 "섹션 추가" 버튼) */
export function canAdd(doc: PageDoc, type?: SectionType): Permission {
  if ((type === "header" || type === "hero" || type === "footer") && countOf(doc, (t) => t === type) > 0) return deny(ONCE[type]);
  if ((type === undefined || isBody(type)) && bodyCount(doc) >= BODY_MAX) return deny(REASONS.addBodyLimit);
  return ALLOWED;
}

const isReservation = (type: SectionType, variant: string) => getSectionDefinition(type, variant)?.reservation === true;
const isInquiry = (type: SectionType) => type === "contact" || type === "cta-band";

/** 목적(프로필 조정 값)은 편집기가 바꾸지 않는다 — 부르는 쪽이 넘긴다 */
export function canRemove(doc: PageDoc, instanceId: string, purpose: Purpose): Permission {
  const { type, variant } = sectionAt(doc, instanceId);
  const sole = countOf(doc, (t) => t === type) === 1;
  if (type === "header" && sole) return deny(REASONS.removeHeader);
  if (type === "footer" && sole) return deny(REASONS.removeFooter);
  if (type === "hero" && sole) return deny(REASONS.removeHero);
  if (purpose === "booking" && isReservation(type, variant) && countOf(doc, isReservation) === 1) return deny(REASONS.removeBooking);
  if (purpose === "inquiry" && isInquiry(type) && countOf(doc, isInquiry) === 1) return deny(REASONS.removeInquiry);
  return ALLOWED;
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

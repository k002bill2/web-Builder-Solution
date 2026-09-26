/**
 * 연산 오류 — 화면은 can*로 먼저 막으므로 이 오류는 호출 쪽 결함이다(사용자 문구가 아니다).
 */
import type { PageDoc, SectionInstance } from "../contracts/pageDoc";

export type EngineOpErrorCode = "NOT_FOUND" | "NOT_ALLOWED" | "UNKNOWN_VARIANT" | "BAD_ID" | "UNKNOWN_SLOT" | "SLOT_KIND" | "BAD_VALUE";

export class EngineOpError extends Error {
  readonly code: EngineOpErrorCode;

  constructor(code: EngineOpErrorCode, message: string) {
    super(message);
    this.name = "EngineOpError";
    this.code = code;
  }
}

/** 새 instanceId 형식 — 검증 함수의 instanceId 규칙과 같다 */
export const INSTANCE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function indexOfSection(doc: PageDoc, instanceId: string): number {
  const index = doc.sections.findIndex((s) => s.instanceId === instanceId);
  if (index < 0) throw new EngineOpError("NOT_FOUND", `섹션 없음: ${instanceId}`);
  return index;
}

export function sectionAt(doc: PageDoc, instanceId: string): SectionInstance {
  return doc.sections[indexOfSection(doc, instanceId)]!;
}

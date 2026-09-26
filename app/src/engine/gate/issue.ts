/**
 * 게이트 이슈·줄 조립 — 줄 상태는 이슈 심각도에서만 나온다(block > warn > pass).
 */
import type { GateIssue, GateRow, GateRowId, GateRuleId, GateSeverity } from "../contracts/records";

export interface IssueAt {
  readonly instanceId?: string;
  readonly slotKey?: string;
}

export function issue(ruleId: GateRuleId, severity: GateSeverity, cause: string, alternative: string, at: IssueAt = {}): GateIssue {
  return {
    ruleId,
    severity,
    ...(at.instanceId === undefined ? {} : { instanceId: at.instanceId }),
    ...(at.slotKey === undefined ? {} : { slotKey: at.slotKey }),
    cause,
    alternative,
  };
}

export function toRow(id: GateRowId, issues: readonly GateIssue[]): GateRow {
  const state = issues.some((i) => i.severity === "block") ? "block" : issues.some((i) => i.severity === "warn") ? "warn" : "pass";
  return { id, state, issues };
}

/** 글자 수 = 코드 포인트(레지스트리 테스트와 같은 기준) */
export const charCount = (text: string): number => [...text].length;
/** 빈 값 = 앞뒤 공백을 뺀 길이 0 */
export const isBlank = (text: string): boolean => text.trim() === "";

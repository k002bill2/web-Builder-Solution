import type { SectionInstance } from "../../engine/contracts/pageDoc";
import type { SlotSchemaEntry } from "../../engine/contracts/sectionDefinition";
import { GATE_TEXT, overMax, overRecommended } from "../../engine/gate/gateText";
import { isBlank } from "../../engine/gate/issue";
import { countField } from "./fieldCounter";

export interface SlotIssue {
  /** 캔버스 문제 문장 id — 필드 `aria-describedby` 맨 앞(5.7 · E-AC-06) */
  readonly id: string;
  readonly level: "warn" | "block";
  /** 5.7 "3번 카드 제목이 권장 28자를 넘었습니다 (34/28자)" · 차단은 "제목 — 상한 40자를 6자 넘었습니다 …(R-13)" */
  readonly text: string;
  /** 빈 필수 칸 — 렌더 문서가 그 슬롯을 그리지 않으므로(MQ-4) 섹션 사각형에 표시한다(r4.13 (3)) */
  readonly onSection?: true;
}

export const slotIssueId = (instanceId: string, key: string): string => `canvas-issue-${instanceId}-${key}`;

/**
 * 글자 슬롯의 문제(편집 중 표시, 5.7) — 빈 필수 값(r4.13 (3), 판정은 게이트 R-13과 같다: 없는 키·공백만 = 빈 값) 또는 글자 수(필드 카운터와 같은 `countField`).
 * 캔버스는 알림만 — 내보내기 차단 판정은 게이트 몫.
 */
export function slotIssue(section: SectionInstance, entry: SlotSchemaEntry): SlotIssue | undefined {
  if (entry.kind === "image") return undefined;
  const value = section.slots[entry.key];
  const text = typeof value === "string" ? value : "";
  const id = slotIssueId(section.instanceId, entry.key);
  if (entry.required && isBlank(text)) return { id, level: "block", text: `${entry.label} — ${GATE_TEXT.requiredEmpty}`, onSection: true };
  const count = countField(text, entry);
  if (count.level === "ok") return undefined;
  if (count.level === "block" && entry.maxLength !== undefined) return { id, level: "block", text: `${entry.label} — ${overMax(entry.maxLength, count.length)}` };
  return { id, level: "warn", text: overRecommended(entry.label, count.length, entry.recommendedLength ?? 0) };
}

import type { SectionInstance } from "../../engine/contracts/pageDoc";
import type { SlotSchemaEntry } from "../../engine/contracts/sectionDefinition";
import { overMax, overRecommended } from "../../engine/gate/gateText";
import { countField } from "./fieldCounter";

export interface SlotIssue {
  /** 캔버스 문제 문장 id — 필드 `aria-describedby` 맨 앞(5.7 · E-AC-06) */
  readonly id: string;
  readonly level: "warn" | "block";
  /** 5.7 "3번 카드 제목이 권장 28자를 넘었습니다 (34/28자)" · 차단은 "제목 — 상한 40자를 6자 넘었습니다 …(R-13)" */
  readonly text: string;
}

export const slotIssueId = (instanceId: string, key: string): string => `canvas-issue-${instanceId}-${key}`;

/** 글자 슬롯의 글자 수 문제(편집 중 표시, 5.7) — 판정은 필드 카운터와 같은 `countField`. 빈 필수 값은 게이트(a4) 몫 */
export function slotIssue(section: SectionInstance, entry: SlotSchemaEntry): SlotIssue | undefined {
  const value = section.slots[entry.key];
  if (entry.kind === "image" || typeof value !== "string") return undefined;
  const count = countField(value, entry);
  if (count.level === "ok") return undefined;
  const id = slotIssueId(section.instanceId, entry.key);
  if (count.level === "block" && entry.maxLength !== undefined) return { id, level: "block", text: `${entry.label} — ${overMax(entry.maxLength, count.length)}` };
  return { id, level: "warn", text: overRecommended(entry.label, count.length, entry.recommendedLength ?? 0) };
}

/**
 * 품질 게이트 `runGate(doc, theme)` (SPEC 5.12 · 8.2) — 순수·결정적: 같은 입력 → 같은 결과, 시각·난수를 읽지 않는다.
 * 8줄은 GATE_ROWS 순서로만 만든다. 성능 예산 줄은 판정하지 않는다(Q13 — 늘 "측정 전"). 결과는 동결, 저장하지 않는다.
 */
import type { PageDoc } from "../contracts/pageDoc";
import type { GateTheme } from "../contracts/pending";
import { GATE_ROWS, type GateIssue, type GateReport, type GateRow, type GateRowId } from "../contracts/records";
import { deepFreeze } from "../freeze";
import { hashDoc } from "../ops/hash";
import { contrastIssues } from "./contrastRow";
import { headingIssues, motionIssues, seoIssues } from "./docRows";
import { toRow } from "./issue";
import { requiredSectionIssues } from "./requiredSections";
import { slotRowIssues } from "./slotRows";

export function runGate(doc: PageDoc, theme: GateTheme): GateReport {
  const slots = slotRowIssues(doc);
  const judged: Readonly<Record<Exclude<GateRowId, "performance">, () => readonly GateIssue[]>> = {
    contrast: () => contrastIssues(theme),
    "alt-text": () => slots.altText,
    "heading-order": () => headingIssues(doc),
    "required-sections": () => requiredSectionIssues(doc.sections, theme.purpose),
    "motion-budget": () => motionIssues(doc),
    "seo-meta": () => seoIssues(doc),
    "text-length": () => slots.textLength,
  };
  const rows = GATE_ROWS.map((id): GateRow => (id === "performance" ? { id, state: "unmeasured", issues: [] } : toRow(id, judged[id]())));
  return deepFreeze({ docHash: hashDoc(doc), docRevision: doc.revision, rows });
}

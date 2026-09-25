/**
 * 비교 보드 엔진 — 선택 규칙·초안·대비 경고·zod 검증·자동 저장·화면 모델 (03a 도메인 연결).
 * 화면이 데이터(보드 저장소 청크)와 함께 동적으로 불러온다: 이 모듈들은 저장소 메모리 구현도 쓰는 것이라
 * 어차피 데이터와 같이 내려온다. 첫 화면 정적 JS(ADR-004)에는 표·패널 UI만 남긴다.
 */
import { parseCustomStyle } from "../../domain/boardInput";
import { pickAllFrom, pickAnnouncement, togglePick } from "../../domain/boardPicks";
import { evaluateBoardWarnings } from "../../domain/boardWarnings";
import { confirmAvailability } from "../../domain/confirmGate";
import { FONT_OPTIONS } from "../../domain/fonts";
import type { CompareBoard } from "../../domain/compareBoard";
import { buildProfileDraft } from "../../domain/profileDraft";
import type { PrimaryColorCheck } from "../../components/compare/CustomStyleFields";
import type { Comparison, Evaluation } from "./boardScreen";
import { STALE_SAVE_NOTICE, confirmErrorPlan, customAnnouncement, releasedNotices, sameIntent, withWarningDelta } from "./boardMessages";
import { buildBoardView } from "./boardView";
import { draftItemsView } from "./draftView";
import { createPicksSaver } from "./picksSaver";

function evaluate(board: CompareBoard, comparison: Comparison): Evaluation {
  const draft = buildProfileDraft(board, comparison.results, comparison.libraryVersion);
  const warnings = draft.status === "ready" ? evaluateBoardWarnings(board, comparison.results, draft) : [];
  return { draft, warnings };
}

const checkPrimaryColor: PrimaryColorCheck = (input) => {
  const parsed = parseCustomStyle({ primaryColor: input });
  if (!parsed.ok) return { ok: false, error: parsed.errors.primaryColor ?? Object.values(parsed.errors)[0] ?? "" };
  return { ok: true, value: parsed.value.primaryColor ?? input };
};

export const boardEngine = Object.freeze({
  createPicksSaver,
  confirmAvailability,
  fonts: FONT_OPTIONS,
  confirmErrorPlan,
  sameIntent,
  withWarningDelta,
  customAnnouncement,
  releasedNotices,
  STALE_SAVE_NOTICE,
  togglePick,
  pickAllFrom,
  pickAnnouncement,
  evaluate,
  buildBoardView,
  draftItemsView,
  checkPrimaryColor,
});

export type BoardEngine = typeof boardEngine;

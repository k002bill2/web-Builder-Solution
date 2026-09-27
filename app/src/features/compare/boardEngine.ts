/**
 * 비교 보드 엔진 — 선택 규칙·초안·대비 경고·자동 저장·화면 모델 (03a 도메인 연결).
 * 대표색 zod 검사(boardInput)는 싣지 않는다 — 필드 포커스·blur·Enter 때 받는 조작 뒤 청크(BUNDLE-HEADROOM, boardInputLoader).
 * 화면이 데이터(보드 저장소 청크)와 함께 동적으로 불러온다: 이 모듈들은 저장소 메모리 구현도 쓰는 것이라
 * 어차피 데이터와 같이 내려온다. 첫 화면 정적 JS(ADR-004)에는 표·패널 UI만 남긴다.
 * 사용자 스타일 입력(CustomStyleFields·Select·TextField)도 여기서 싣는다 — 보드가 준비(엔진 로드)된 뒤에만 그려지므로
 * 첫 화면에 필요 없다(V2-1 · SPEC B-5). P-S25 개수 캡션 틀(CarryOverCaption)도 같은 이유로 여기 둔다(DS-2A-04 r6).
 * 초안 패널(DraftPanel·DraftItem)·요약 바(DraftSummaryBar)도 보드 준비 뒤에만 그려지므로 여기 싣는다(BUNDLE-01 C8).
 */
import { pickAllFrom, pickAnnouncement, togglePick } from "../../domain/boardPicks";
import { evaluateBoardWarnings } from "../../domain/boardWarnings";
import { confirmAvailability } from "../../domain/confirmGate";
import { FONT_OPTIONS } from "../../domain/fonts";
import type { CompareBoard } from "../../domain/compareBoard";
import { buildProfileDraft } from "../../domain/profileDraft";
import { CustomStyleFields, type PrimaryColorCheck } from "../../components/compare/CustomStyleFields";
import type { Comparison, Evaluation } from "./boardScreen";
import { PRIMARY_COLOR_CHECK_FAILED, STALE_SAVE_NOTICE, confirmErrorPlan, customAnnouncement, releasedNotices, sameIntent, unchangedSinceConfirm, withWarningDelta } from "./boardMessages";
import { CompareBoardError } from "../../data/compareBoardRepository";
import { emitProfileEvent } from "../profile/profileEvents";
import { buildBoardView } from "./boardView";
import { draftItemsView } from "./draftView";
import { createPicksSaver } from "./picksSaver";
import { CarryOverCaption } from "./CarryOverCaption";
import { loadBoardInput } from "./boardInputLoader";
import { DraftPanel } from "../../components/compare/DraftPanel";
import { DraftSummaryBar } from "../../components/compare/DraftSummaryBar";

function evaluate(board: CompareBoard, comparison: Comparison): Evaluation {
  const draft = buildProfileDraft(board, comparison.results, comparison.libraryVersion);
  const warnings = draft.status === "ready" ? evaluateBoardWarnings(board, comparison.results, draft) : [];
  return { draft, warnings };
}

/** 대표색 zod 검사 — 청크 로드 실패면 저장 0 + 확인 실패 문구(다음 blur·Enter에서 다시 받는다) */
const checkPrimaryColor: PrimaryColorCheck = Object.assign(
  async (input: string) => {
    let parseCustomStyle;
    try {
      ({ parseCustomStyle } = await loadBoardInput());
    } catch (error) {
      console.error("[compare] 대표색 검사 청크 로드 실패", error);
      return { ok: false, error: PRIMARY_COLOR_CHECK_FAILED } as const;
    }
    const parsed = parseCustomStyle({ primaryColor: input });
    if (!parsed.ok) return { ok: false, error: parsed.errors.primaryColor ?? Object.values(parsed.errors)[0] ?? "" } as const;
    return { ok: true, value: parsed.value.primaryColor ?? input } as const;
  },
  {
    /** 필드 포커스 때 미리 받는다(조작 뒤) — blur·Enter 검사가 로드를 기다리지 않게. 실패는 검사 때 다시 받는다 */
    prepare: () => void loadBoardInput().catch(() => undefined),
  },
);

/** P-AC-37 — 보드 확정 성공마다 profile_saved 1회(첫 확정 board · 재확정 board-reconfirm), 실패는 profile_save_failed(오류 코드) */
const reportConfirmed = (version: number, reconfirm: boolean) => emitProfileEvent({ name: "profile_saved", version, origin: reconfirm ? "board-reconfirm" : "board" });
const reportConfirmFailed = (error: unknown) => emitProfileEvent({ name: "profile_save_failed", reason: error instanceof CompareBoardError ? error.code : "UNKNOWN" });

export const boardEngine = Object.freeze({
  reportConfirmed,
  reportConfirmFailed,
  createPicksSaver,
  confirmAvailability,
  fonts: FONT_OPTIONS,
  confirmErrorPlan,
  sameIntent,
  unchangedSinceConfirm,
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
  CustomStyleFields,
  CarryOverCaption,
  DraftPanel,
  DraftSummaryBar,
});

export type BoardEngine = typeof boardEngine;

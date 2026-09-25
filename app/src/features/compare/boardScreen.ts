/** 비교 보드 화면 상태 타입·기본값. 알림 문장·판정 보조 함수는 boardMessages(엔진 청크). */
import type { Announcement } from "../../components/compare/DraftPanel";
import type { BoardWarning } from "../../domain/boardWarnings";
import type { CompareBoard, ComparisonResult, CustomStyle, Picks } from "../../domain/compareBoard";
import type { ProfileDraft } from "../../domain/profileDraft";

export interface Intent {
  readonly picks: Picks;
  readonly custom: CustomStyle;
}

export interface Comparison {
  readonly libraryVersion: string;
  readonly results: readonly ComparisonResult[];
}

export interface Evaluation {
  readonly draft: ProfileDraft;
  readonly warnings: readonly BoardWarning[];
}

export const EMPTY_ANNOUNCEMENT: Announcement = { text: "", key: 0 };

export const intentOf = (board: CompareBoard): Intent => ({ picks: board.picks, custom: board.custom });

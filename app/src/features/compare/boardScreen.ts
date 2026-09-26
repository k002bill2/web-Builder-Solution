/** 비교 보드 화면 상태 타입·기본값. 알림 문장·판정 보조 함수는 boardMessages(엔진 청크). */
import type { Announcement } from "../../components/compare/DraftPanel";
import type { BoardWarning } from "../../domain/boardWarnings";
import type { CompareBoard, ComparisonResult, CustomStyle, Picks } from "../../domain/compareBoard";
import type { ProfileAdjustments } from "../../domain/profile";
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

/**
 * P-S25 캡션 "이 프로필에 조정 N개가 있습니다"의 N (DS-2A-04 r6). 개수 단위는 6.1-3과 같다 — 조정 키 하나 = 1, 보정은 항목 하나 = 1.
 * 진입 직후 자동이라 판정 모듈(profileAdjustments·대비 계산)을 받지 않고 여기서 센다. 펼친 뒤 이어짐 + 지워짐과 같은 수다.
 */
export function carryOverCount(adjustments: ProfileAdjustments | undefined): number {
  if (!adjustments) return 0;
  const { corrections, ...keys } = adjustments;
  return Object.values(keys).filter((value) => value !== undefined).length + (corrections?.length ?? 0);
}

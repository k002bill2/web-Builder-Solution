/** 비교 보드 화면의 순수 보조 함수 — 알림 문장·안내 상자 (SPEC 2.4·3.3·4). 도메인 계산은 boardEngine. */
import type { Announcement, PanelNotice } from "../../components/compare/DraftPanel";
import type { BoardWarning } from "../../domain/boardWarnings";
import type { CompareBoard, ComparisonResult, CustomStyle, Picks } from "../../domain/compareBoard";
import { fontFamilyOf } from "../../domain/fonts";
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

export const STALE_CONFIRM_MESSAGE = "다른 곳에서 바뀐 선택을 불러왔습니다. 확인 후 다시 확정하세요";
export const EMPTY_ANNOUNCEMENT: Announcement = { text: "", key: 0 };

export const intentOf = (board: CompareBoard): Intent => ({ picks: board.picks, custom: board.custom });

const normalized = (record: object) => JSON.stringify(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
export const sameIntent = (a: Intent, b: Intent) => normalized(a.picks) === normalized(b.picks) && normalized(a.custom) === normalized(b.custom);

/** A-9: 새로 생긴 경고는 알림 문장에 "경고 N개 추가"로 함께 알린다 (정보 안내는 세지 않음) */
export function withWarningDelta(text: string, before: Evaluation, after: Evaluation): string {
  const count = (e: Evaluation) => e.warnings.filter((w) => w.tone === "warning").length;
  const added = count(after) - count(before);
  return added > 0 ? `${text} · 경고 ${added}개 추가` : text;
}

export function customAnnouncement(before: CustomStyle, after: CustomStyle): string {
  if (after.primaryColor === undefined && after.fontFamily === undefined) return "사용자 스타일을 지웠습니다";
  if (after.primaryColor !== before.primaryColor) return after.primaryColor ? `대표색 ${after.primaryColor} 적용` : "대표색을 지웠습니다";
  return after.fontFamily ? `폰트 ${fontFamilyOf(after.fontFamily)} 적용` : "폰트를 지웠습니다";
}

/** 회수·삭제·다른 곳에서 뺀 열의 선택 해제 안내 (S-08·S-09·1.3) */
export function releasedNotices(messages: readonly string[]): readonly PanelNotice[] {
  return messages.map((message, i) => ({ id: `released-${i}-${message}`, tone: "warning", title: "선택 해제", message }));
}

export function confirmFailure(message: string, retry?: () => void): PanelNotice {
  return {
    id: "confirm",
    tone: "negative",
    title: "확정하지 못했습니다",
    message,
    alert: true,
    ...(retry && { action: { label: "다시 시도", onClick: retry } }),
  };
}

/**
 * 비교 보드 알림 문장·안내 상자·확정 오류 처리 방침 (SPEC 2.4·3.3·4 · A-4·A-9·S-14).
 * 엔진 청크(boardEngine)로만 쓴다 — 첫 화면 정적 JS(ADR-004)에 문구를 싣지 않는다.
 */
import type { PanelNotice } from "../../components/compare/DraftPanel";
import { CompareBoardError } from "../../data/compareBoardRepository";
import type { CompareBoard, CustomStyle } from "../../domain/compareBoard";
import { fontFamilyOf } from "../../domain/fonts";
import type { Evaluation, Intent } from "./boardScreen";

const STALE_CONFIRM_MESSAGE = "다른 곳에서 바뀐 선택을 불러왔습니다. 확인 후 다시 확정하세요";
/** "v3이" · "v4가" — 숫자 끝 발음(2·4·5·9는 받침 없음) */
const versionSubject = (version: number) => `v${version}${[2, 4, 5, 9].includes(version % 10) ? "가" : "이"}`;

const normalized = (record: object) => JSON.stringify(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
export const sameIntent = (a: Intent, b: Intent) => normalized(a.picks) === normalized(b.picks) && normalized(a.custom) === normalized(b.custom);

/** S-15 — 확정 시점 선택과 지금 선택(picks·custom)이 같은지. 확정 전이면 false, 스냅샷이 없으면 revision으로 */
export function unchangedSinceConfirm(board: CompareBoard): boolean {
  const { confirmed } = board;
  if (!confirmed) return false;
  if (!confirmed.picks || !confirmed.custom) return confirmed.revision === board.revision;
  return sameIntent(board, { picks: confirmed.picks, custom: confirmed.custom });
}

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

export const STALE_SAVE_NOTICE: PanelNotice = { id: "stale", tone: "info", title: "선택을 다시 불러왔습니다", message: "다른 곳에서 바뀐 선택을 불러왔습니다" };

function confirmFailure(message: string, retry?: () => void): PanelNotice {
  return { id: "confirm", tone: "negative", title: "확정하지 못했습니다", message, alert: true, ...(retry && { action: { label: "다시 시도", onClick: retry } }) };
}

/** S-14 확정 오류 처리 — 최신 보드로 맞추기(STALE) · 다시 받기(회수) · 안내만 */
export type ConfirmErrorPlan =
  | { readonly kind: "resync"; readonly board: CompareBoard; readonly notice: PanelNotice }
  | { readonly kind: "refresh"; readonly notice: PanelNotice }
  | { readonly kind: "notice"; readonly notice: PanelNotice; readonly unexpected: boolean };

export function confirmErrorPlan(error: unknown, retry: () => void, current?: CompareBoard): ConfirmErrorPlan {
  const code = error instanceof CompareBoardError ? error.code : undefined;
  // P-S12 — 다른 곳에서 새 버전이 생겼다: 계열 최신만 반영하고(버튼 "(vN+1)") 선택은 그대로, 이동 없음 (DS-2A-04 6.1-4)
  const head = error instanceof CompareBoardError ? error.profileHead : undefined;
  if (code === "STALE_PROFILE" && head && current?.confirmed) {
    const board = { ...current, confirmed: { ...current.confirmed, latestVersion: head.version, latest: head } };
    return { kind: "resync", board, notice: confirmFailure(`다른 곳에서 ${versionSubject(head.version)} 만들어졌습니다. 선택은 그대로입니다 — 확인 후 다시 확정하세요`) };
  }
  if (code === "STALE_BOARD" && error instanceof CompareBoardError && error.board) {
    return { kind: "resync", board: error.board, notice: confirmFailure(STALE_CONFIRM_MESSAGE) };
  }
  if (code === "STALE_BOARD") return { kind: "refresh", notice: confirmFailure(STALE_CONFIRM_MESSAGE) };
  if (code === "LICENSE_BLOCKED") {
    return { kind: "refresh", notice: confirmFailure("사용할 수 없게 된 레퍼런스가 있습니다. '사용 불가' 열을 확인한 뒤 다시 확정하세요") };
  }
  if (code === "UNSUPPORTED_COMBINATION") {
    const message = "지금 선택 조합은 현재 라이브러리로 확정할 수 없습니다. 사용할 수 없는 항목을 다른 레퍼런스 값으로 바꾼 뒤 다시 확정하세요";
    return { kind: "notice", notice: confirmFailure(message), unexpected: false };
  }
  return { kind: "notice", notice: confirmFailure("확정하지 못했습니다. 선택은 저장돼 있습니다", retry), unexpected: true };
}

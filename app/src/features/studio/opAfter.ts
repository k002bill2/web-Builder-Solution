import type { RefObject } from "react";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { OpResult } from "./docOps";
import { historyKey } from "./historyKeys";
import { addedNotice, movedNotice, removedNotice, restoredNotice, swappedNotice, swapRevertedNotice } from "./opNotice";
import type { UndoStack } from "./undoStack";
import type { FocusTarget } from "./useFocusRequest";
import type { OpOutcome } from "./useSectionOps";
import type { VariantChoice } from "./variantChoices";
import type { SectionInstance } from "../../engine/contracts/pageDoc";

/**
 * 연산이 끝난 뒤 꼬리(ER-OFF A1·A2) — 조작 뒤 청크(docEngine)에만 싣는다. 연산 청크를 받은 뒤에만 부르므로
 * 화면 동작·문구·포커스는 옮기기 전과 같다(/studio 진입 예산, ADR-004 개정 6).
 * 섹션 이름(selection.ts)은 부르는 쪽이 넘긴다 — 이 청크가 selection을 import하면 공유 청크가 하나 더 생겨 진입이 오히려 는다(실측 +0.13).
 */
type Done = Extract<OpOutcome, { readonly ok: true }>;
type Notify = (text: string) => void;
type Focus = (target: FocusTarget) => void;
/** 알림 줄 "되돌리기"가 되살릴 섹션과 알림 문장 — instanceId 없음 = 문서 전체 연산(테마) */
export type UndoTarget = { readonly instanceId?: string; readonly text: string; readonly before: PageDoc };
type Name = (s: SectionInstance) => string;
/** 단축키 뒤 알림 · 포커스 — 부르는 쪽(StudioLayout)이 넘긴다(이 청크가 진입 모듈을 import하지 않는다 · ER-OFF2) */
export type StepTell = { readonly setNotice: Notify; readonly goTo: (elementId: string, target: { readonly tab: "sections" }) => void };
type LastOp = { readonly before: PageDoc; readonly after: PageDoc } | undefined;
/** 미리보기 편집 경계 거절 — SnapshotPreview 이유 문장과 같다 */
const LOCKED = "스냅샷을 보는 중에는 편집할 수 없습니다";

/** useSectionOps.run — applyDocOp 뒤: 편집 반영 → 문서 참조 · 기록 스택 · 되돌리기 대상(A2). 편집 경계가 거절(false)하면 실패 — 아무것도 바꾸지 않는다(B-ER-05) */
export function commitOp(
  docRef: RefObject<PageDoc>,
  stack: UndoStack,
  setLast: (last: LastOp) => void,
  edit: (next: PageDoc) => boolean | void,
  label: string,
  before: PageDoc,
  result: OpResult,
  undoable: boolean,
): OpOutcome {
  if (edit(result.doc) === false) return { ok: false, reason: LOCKED };
  docRef.current = result.doc;
  stack.push({ label, before, after: result.doc });
  setLast(undoable ? { before, after: result.doc } : undefined);
  return { ok: true, result, before };
}

/** 열린 필드 묶음(FIELD-UNDO 4.1) — 진입(useSectionOps.field)이 키·시작 문서·마지막 문서를 같은 틱에 적고, 타이머·닫기는 이 청크가 한다 */
export type FieldOpen = {
  readonly key: string;
  readonly label: string;
  readonly base: PageDoc;
  after?: PageDoc;
  /** 청크가 마지막으로 처리한 입력의 문서 — 다음 입력의 시작 문서와 다르면 그사이 기록 밖 교체(충돌 "최신")가 있었다 */
  seen?: PageDoc;
  timer?: ReturnType<typeof setTimeout>;
  /** 타이머 · 문서 리스너(focusout · compositionend) 해제 — 닫기 · 언마운트가 부른다(Codex r1 P2-4) */
  off?: () => void;
};
export type FieldRec = {
  readonly open: RefObject<FieldOpen | undefined>;
  readonly docRef: RefObject<PageDoc>;
  readonly stack: UndoStack;
  readonly edit: (next: PageDoc) => boolean | void;
  /** 참조 집합의 "열린 묶음 시작 문서" — 닫으면 비운다(FU 4.4) */
  readonly hold: (base: PageDoc | undefined) => void;
};
/** 입력 1회의 종류 — true = IME 조합 중 · "click" = 이미지 패널 클릭(켜기·고르기·지우기·끄기·장식 — 묶음 없이 즉시 1건, FU 4.5) */
export type FieldMode = boolean | "click";
/** 묶음 닫힘 멈춤(ER 3.5 · FU 4.1) */
const FIELD_PAUSE_MS = 600;

/**
 * 묶음 닫기 = 기록 1건 { 시작 문서 → 마지막 입력 문서 }. 내용이 시작과 같으면(쳤다 지움) 기록 0 — 대신 문서를 시작 문서 참조로 돌려
 * 앞 기록과의 사슬(문서 동일성 비교)을 잇는다. 그사이 기록 밖 경로로 문서가 바뀌었으면(충돌 "최신") 그 문서를 덮지 않는다.
 * 돌려주는 값 = 다음 기록이 이어 붙을 문서(기록했으면 마지막 문서 · 기록 0이면 시작 문서 참조)
 */
export function closeField({ open, docRef, stack, edit, hold }: FieldRec): PageDoc | undefined {
  const o = open.current;
  if (!o) return undefined;
  o.off?.();
  open.current = undefined;
  hold(undefined);
  const after = o.after ?? o.base;
  if (JSON.stringify(after) !== JSON.stringify(o.base)) {
    stack.push({ label: o.label, before: o.base, after });
    return after;
  }
  if (docRef.current === after && after !== o.base && edit(o.base) !== false) docRef.current = o.base;
  return o.base;
}

/**
 * 입력 1회 뒤(진입이 입력마다 순서대로 부른다) — 멈춤 타이머를 다시 건다. 조합 중(IME)이면 걸지 않고 compositionend가 건다(FU 4.6 · Codex r1 P2-2).
 * 클릭("click")이면 앞 묶음을 닫은 뒤 이 입력만으로 바로 기록 1건(FU 4.5) — 청크 응답 전 이 클릭 뒤에 온 입력은 다음 호출이 이어 받게 남긴다.
 * 이 입력이 다른 칸이거나 시작 문서가 앞 입력의 문서가 아니면(기록 밖 교체 — 충돌 "최신") 앞 묶음을 앞 입력 문서까지로 닫고 이 입력부터 새 묶음
 * (청크 응답 전 칸 이동 · 교체 전 base 재사용으로 다른 탭 변경을 덮는 것 방지 — Codex r1 P2-1 · P2-3).
 * 묶음의 첫 입력이면 포커스가 떠날 때(focusout = 칸 blur · "더보기"·미리보기·충돌 버튼 누름) 닫는 문서 리스너를 단다(FU 4.1)
 */
export function fieldTyped(rec: FieldRec, composing: FieldMode | undefined, key: string, label: string, base: PageDoc, next: PageDoc): void {
  let o = rec.open.current;
  if (!o) return;
  const seen = o.seen ?? o.base;
  if (o.key !== key || base !== seen) {
    const latest = o.after;
    o.after = seen;
    // 기록 밖 교체가 아니면 앞 묶음이 이어 준 문서에서 시작한다 — 쳤다 지운 묶음(기록 0)이면 같은 내용의 복제 대신 시작 문서 참조(Codex r2 P2)
    const kept = closeField(rec);
    const start = base === seen && kept ? kept : base;
    o = rec.open.current = { key, label, base: start, after: latest };
    rec.hold(start);
  }
  o.seen = next;
  if (composing === "click") {
    const latest = o.after;
    o.after = next;
    closeField(rec);
    if (latest !== next) {
      rec.open.current = { key: "", label, base: next, after: latest, seen: next };
      rec.hold(next);
    }
    return;
  }
  const mine = o;
  const close = () => rec.open.current === mine && closeField(rec);
  const arm = () => {
    clearTimeout(mine.timer);
    mine.timer = setTimeout(close, FIELD_PAUSE_MS);
  };
  if (!o.off) {
    const end = () => rec.open.current === mine && arm();
    document.addEventListener("focusout", close);
    document.addEventListener("compositionend", end);
    o.off = () => {
      clearTimeout(mine.timer);
      document.removeEventListener("focusout", close);
      document.removeEventListener("compositionend", end);
    };
  }
  if (composing) clearTimeout(o.timer);
  else arm();
}

/**
 * 단축키 · "더보기" 실행 취소/다시 실행(ER-4 U1) — 지금 문서가 그 기록과 이어질 때만(기록 밖 문서 교체 — 충돌 "최신" 등 — 를 덮지 않는다).
 * 편집 경계가 거절하면(미리보기 중) 스택 그대로(B-ER-05와 같은 규칙). 알림 줄 "되돌리기" 대상은 비운다
 */
export function stepHistory(redo: boolean, docRef: RefObject<PageDoc>, stack: UndoStack, setLast: (last: LastOp) => void, edit: (next: PageDoc) => boolean | void, tell: StepTell) {
  const entry = redo ? stack.peekRedo() : stack.peek();
  if (!entry || (redo ? entry.before : entry.after) !== docRef.current) return undefined;
  const active = document.activeElement;
  const next = redo ? entry.after : entry.before;
  if (edit(next) === false) return undefined;
  if (redo) stack.redo();
  else stack.undo();
  docRef.current = next;
  setLast(undefined);
  // 알림 1문장(C1) · 포커스는 그대로 — 가 있던 줄이 사라지면 h2 "섹션"(유실 0)
  tell.setNotice(`${redo ? "다시 실행" : "실행 취소"}: ${entry.label}`);
  setTimeout(() => active && !active.isConnected && tell.goTo("studio-sections-heading", { tab: "sections" }), 0);
  return entry;
}

/** 단축키 맥락 — StudioLayout이 커밋마다 갱신한다(미리보기 중 여부 · 알림 · 포커스 · 최신 기록 이동). 언마운트되면 비운다 */
export type HistoryKeys = { readonly locked: boolean; readonly tell: StepTell; readonly step: (redo: boolean, tell: StepTell) => unknown };

/**
 * 편집 틀 단축키 리스너(SPEC 3.5 · ER-AC-U1·U2) — 첫 연산 뒤 이 청크가 붙인다(그 전에는 되돌릴 기록이 없다 · /studio 진입 예산 ER-4b).
 * 입력칸·대화상자·IME·미리보기 중이면 무시(preventDefault도 하지 않음). 떼는 함수를 돌려준다
 */
export function listenHistory(keys: RefObject<HistoryKeys | undefined>): () => void {
  const onKey = (e: KeyboardEvent) => {
    const ctx = keys.current;
    const kind = ctx && historyKey(e, ctx.locked);
    if (!kind) return;
    e.preventDefault();
    // 붙일 때의 step이 아니라 맥락의 최신 step — 미리보기를 오가면 edit가 바뀐다(Codex r1 P2)
    void ctx.step(kind === "redo", ctx.tell);
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}

/** 이동 뒤 — 알림 + 누른 버튼 포커스 그대로 */
export function afterMove(outcome: Done, setNotice: Notify, requestFocus: Focus, button: HTMLElement, sectionName: Name): void {
  const moved = outcome.result.doc.sections[outcome.result.index]!;
  setNotice(movedNotice(moved.type, sectionName(moved), outcome.result.index));
  requestFocus({ element: button });
}

/** 삭제 뒤 — 포커스·선택 = 다음 섹션 줄(없으면 이전). resolveSelection(첫 본문)에 맡기지 않는다 */
export function afterRemove(
  outcome: Done,
  setSelected: (id: string) => void,
  setUndoTarget: (target: UndoTarget) => void,
  setNotice: Notify,
  focusRow: (rowId: string) => void,
  sectionName: Name,
): void {
  const { before, result } = outcome;
  const removed = before.sections[result.index]!;
  const next = result.doc.sections[result.index] ?? result.doc.sections[result.index - 1];
  if (next) setSelected(next.instanceId);
  setUndoTarget({ instanceId: removed.instanceId, text: restoredNotice(removed.type, sectionName(removed)), before });
  setNotice(removedNotice(removed.type, sectionName(removed)));
  if (next) focusRow(next.instanceId);
}

/** 변형 교체 뒤 — 알림 줄 "되돌리기" 대상 + 포커스는 누른 라디오 그대로 */
export function afterSwap(
  outcome: Done,
  instanceId: string,
  choice: VariantChoice,
  radio: HTMLElement,
  setUndoTarget: (target: UndoTarget) => void,
  setNotice: Notify,
  requestFocus: Focus,
  variantName: Name,
): void {
  const original = outcome.before.sections.find((s) => s.instanceId === instanceId)!;
  setUndoTarget({ instanceId, text: swapRevertedNotice(variantName(original)), before: outcome.before });
  setNotice(swappedNotice(choice.label, choice.lostLabels));
  requestFocus({ element: radio });
}

/** 추가 뒤 — 새 섹션 선택 · 알림 · 포커스 = 새 줄 */
export function afterAdd(outcome: Done, setSelected: (id: string) => void, setNotice: Notify, focusRow: (rowId: string) => void, sectionName: Name): void {
  const added = outcome.result.doc.sections[outcome.result.index]!;
  setSelected(added.instanceId);
  setNotice(addedNotice(added.type, sectionName(added), outcome.result.index));
  focusRow(added.instanceId);
}

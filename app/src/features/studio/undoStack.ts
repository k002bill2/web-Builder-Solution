import { useEffect, useState } from "react";
import type { PageDoc } from "../../engine/contracts/pageDoc";

/** 실행 취소 기록 상한(5.14) */
export const UNDO_LIMIT = 50;

/** 문서 연산 1회 — 이전 문서를 통째로 둔다(되돌리면 instanceId·값·위치·톤이 모두 그대로) */
export interface UndoEntry {
  /** "Services 삭제" — a4 "실행 취소: …" 알림 */
  readonly label: string;
  readonly before: PageDoc;
  readonly after: PageDoc;
}

export interface UndoStack {
  readonly size: () => number;
  readonly push: (entry: UndoEntry) => void;
  /** 가장 최근 기록을 꺼낸다(없으면 undefined) */
  readonly pop: () => UndoEntry | undefined;
  readonly clear: () => void;
  /** 다음 실행 취소 · 다시 실행 대상(꺼내지 않음) — "더보기" 항목 이름 */
  readonly peek: () => UndoEntry | undefined;
  readonly peekRedo: () => UndoEntry | undefined;
  /** 가장 최근 기록을 다시 실행 목록으로 옮긴다(ER-4 U1) */
  readonly undo: () => UndoEntry | undefined;
  readonly redo: () => UndoEntry | undefined;
  /** 지금 문서에서 실행 취소 · 다시 실행으로 닿는 문서 — 이미지 참조 집합(SPEC 3.5 "참조 집합이 기록을 본다").
   *  스택 밖 변경(필드 글자 등)으로 끊긴 기록은 닿지 않으므로 넣지 않는다(Codex r1 "되돌리기 무효화" 그대로) */
  readonly reachable: (doc: PageDoc) => readonly PageDoc[];
}

export function createUndoStack(limit = UNDO_LIMIT): UndoStack {
  let entries: readonly UndoEntry[] = [];
  let redos: readonly UndoEntry[] = [];
  return {
    size: () => entries.length,
    push: (entry) => {
      entries = [...entries, entry].slice(-limit);
      redos = [];
    },
    pop: () => {
      const last = entries.at(-1);
      entries = entries.slice(0, -1);
      return last;
    },
    clear: () => {
      entries = [];
      redos = [];
    },
    peek: () => entries.at(-1),
    peekRedo: () => redos.at(-1),
    undo: () => {
      const last = entries.at(-1);
      if (!last) return undefined;
      entries = entries.slice(0, -1);
      redos = [...redos, last];
      return last;
    },
    redo: () => {
      const next = redos.at(-1);
      if (!next) return undefined;
      redos = redos.slice(0, -1);
      entries = [...entries, next];
      return next;
    },
    reachable: (doc) => {
      const out: PageDoc[] = [];
      for (let i = entries.length - 1, cur = doc; i >= 0 && entries[i]!.after === cur; i--) out.push((cur = entries[i]!.before));
      for (let i = redos.length - 1, cur = doc; i >= 0 && redos[i]!.before === cur; i--) out.push((cur = redos[i]!.after));
      return out;
    },
  };
}

/** 편집기가 열려 있는 동안만 유지 — 언마운트(앱 안 이동 포함) 때 비운다(5.14 r1) */
export function useUndoStack(): UndoStack {
  const [stack] = useState(() => createUndoStack());
  useEffect(() => () => stack.clear(), [stack]);
  return stack;
}

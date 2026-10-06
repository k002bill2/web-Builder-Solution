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
  // 기록 한 줄 + 커서 — 커서 앞 = 실행 취소 대상, 커서부터 = 다시 실행 대상(가장 최근에 취소한 기록이 커서 자리)
  let list: readonly UndoEntry[] = [];
  let at = 0;
  return {
    size: () => at,
    push: (entry) => {
      list = [...list.slice(0, at), entry].slice(-limit);
      at = list.length;
    },
    pop: () => {
      const last = list[at - 1];
      if (last) list = [...list.slice(0, --at), ...list.slice(at + 1)];
      return last;
    },
    clear: () => {
      list = [];
      at = 0;
    },
    peek: () => list[at - 1],
    peekRedo: () => list[at],
    undo: () => list[at - 1] && list[--at],
    redo: () => list[at] && list[at++],
    reachable: (doc) => {
      const out: PageDoc[] = [];
      for (let i = at - 1, cur = doc; list[i]?.after === cur; i--) out.push((cur = list[i]!.before));
      for (let i = at, cur = doc; list[i]?.before === cur; i++) out.push((cur = list[i]!.after));
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

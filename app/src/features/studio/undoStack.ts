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
}

export function createUndoStack(limit = UNDO_LIMIT): UndoStack {
  throw new Error(`K2 RED ${limit}`);
}

/** 편집기가 열려 있는 동안만 유지 — 언마운트(앱 안 이동 포함) 때 비운다(5.14 r1) */
export function useUndoStack(): UndoStack {
  const [stack] = useState(() => createUndoStack());
  useEffect(() => () => stack.clear(), [stack]);
  return stack;
}

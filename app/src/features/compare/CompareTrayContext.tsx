import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CompareBoardRepository } from "../../data/compareBoardRepository";
import { addColumn, removeColumn } from "../../domain/boardColumns";
import { emptyBoard, type CompareBoard } from "../../domain/compareBoard";
import type { AddResult, CompareTray } from "./compareTray";

interface CompareTrayValue {
  /** 보드 열의 레퍼런스 id (담은 순서) */
  readonly tray: CompareTray;
  readonly board: CompareBoard;
  readonly add: (id: string) => AddResult;
  readonly remove: (id: string) => void;
}

const CompareTrayContext = createContext<CompareTrayValue | null>(null);

/**
 * 비교 트레이 = 비교 보드의 열 목록 (SPEC 1.1). 상태는 보드 하나이고 저장소가 정본이다.
 * 한도·중복은 지금 열로 바로 판정해 화면에 즉시 반영하고(카탈로그·상세 알림), 저장소 호출은 순서대로 보낸다.
 * 응답은 마지막 요청의 것만 반영한다 — 앞 응답(예: 진입 시 보드 조회)이 방금 한 추가를 잠시 덮지 않게.
 */
export function CompareTrayProvider({
  repository,
  children,
}: {
  readonly repository: CompareBoardRepository;
  readonly children: ReactNode;
}) {
  const [board, setBoard] = useState<CompareBoard>(() => emptyBoard("board-current", ""));
  const latest = useRef(board);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const inFlight = useRef(0);

  const apply = useCallback((next: CompareBoard) => {
    latest.current = next;
    setBoard(next);
  }, []);

  const enqueue = useCallback(
    (request: () => Promise<CompareBoard>) => {
      inFlight.current += 1;
      const settle = (next: CompareBoard | undefined) => {
        inFlight.current -= 1;
        if (inFlight.current === 0 && next) apply(next);
      };
      // 실패하면 서버 보드로 다시 맞춘다. 그것도 실패하면 화면 상태를 유지한다(Provider는 라우트 오류 경계 밖이다)
      const resync = () => repository.getBoard().then((load) => load.board, () => undefined);
      queue.current = queue.current.then(() => request().catch(resync)).then(settle);
    },
    [apply, repository],
  );

  useEffect(() => {
    enqueue(() => repository.getBoard().then((load) => load.board));
  }, [enqueue, repository]);

  const add = useCallback(
    (id: string): AddResult => {
      const result = addColumn(latest.current, id);
      if (!result.ok) return { ok: false, reason: result.reason, tray: latest.current.columns.map((c) => c.referenceId) };
      apply(result.board);
      enqueue(() => repository.addReference(id).then((r) => r.board));
      return { ok: true, tray: result.board.columns.map((c) => c.referenceId) };
    },
    [apply, enqueue, repository],
  );

  const remove = useCallback(
    (id: string) => {
      apply(removeColumn(latest.current, id).board);
      enqueue(() => repository.removeReference(id).then((r) => r.board));
    },
    [apply, enqueue, repository],
  );

  // 열 구성이 같으면 같은 배열을 준다 — 서버 응답마다 트레이 레퍼런스를 다시 조회하지 않게
  const trayKey = board.columns.map((c) => c.referenceId).join("\n");
  const tray = useMemo<CompareTray>(() => (trayKey ? trayKey.split("\n") : []), [trayKey]);
  const value = useMemo(() => ({ tray, board, add, remove }), [tray, board, add, remove]);
  return <CompareTrayContext.Provider value={value}>{children}</CompareTrayContext.Provider>;
}

export function useCompareTray(): CompareTrayValue {
  const value = useContext(CompareTrayContext);
  if (!value) throw new Error("CompareTrayProvider 밖에서 useCompareTray를 호출했습니다");
  return value;
}

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
  /** 비교 보드 화면이 같은 저장소를 쓴다 (03b) */
  readonly repository: CompareBoardRepository;
  /** 진입 시 보드 조회가 끝났는지 — 화면은 그 뒤에 보드를 불러온다(자동 해제 안내를 놓치지 않게) */
  readonly loaded: boolean;
  /** 보드 화면의 저장 결과를 트레이에 반영한다 (같거나 새 revision만) */
  readonly sync: (board: CompareBoard) => void;
  /** 아직 보여주지 않은 선택 해제 안내를 꺼낸다 — 한 번만 (SPEC 1.3 · S-08) */
  readonly takeReleasedNotices: () => readonly string[];
  /** 진행 중인 트레이 변경(추가·빼기)이 모두 끝날 때 — 보드 화면은 그 뒤에 조회한다 (Codex R1) */
  readonly whenIdle: () => Promise<unknown>;
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
  const [loaded, setLoaded] = useState(false);
  const released = useRef<readonly string[]>([]);
  const keepNotices = useCallback((notices: readonly string[]) => {
    released.current = [...released.current, ...notices];
  }, []);

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
      return queue.current;
    },
    [apply, repository],
  );

  useEffect(() => {
    // 회수·삭제로 자동 해제한 선택의 안내는 이 조회에만 한 번 온다 — 보드 화면이 보여줄 수 있게 보관한다
    enqueue(() =>
      repository.getBoard().then((load) => {
        keepNotices(load.released.map((r) => r.notice));
        return load.board;
      }),
    ).then(() => setLoaded(true));
  }, [enqueue, keepNotices, repository]);

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
      // 해제 안내는 서버 응답으로 만든다 — 트레이의 선택은 보드 화면 밖에서 최신이 아닐 수 있다
      enqueue(() =>
        repository.removeReference(id).then((r) => {
          if (r.released) keepNotices([r.released.notice]);
          return r.board;
        }),
      );
    },
    [apply, enqueue, keepNotices, repository],
  );

  const sync = useCallback(
    (next: CompareBoard) => {
      if (next.revision >= latest.current.revision) apply(next);
    },
    [apply],
  );

  const takeReleasedNotices = useCallback(() => {
    const notices = released.current;
    released.current = [];
    return notices;
  }, []);

  // 열 구성이 같으면 같은 배열을 준다 — 서버 응답마다 트레이 레퍼런스를 다시 조회하지 않게
  const trayKey = board.columns.map((c) => c.referenceId).join("\n");
  const tray = useMemo<CompareTray>(() => (trayKey ? trayKey.split("\n") : []), [trayKey]);
  const whenIdle = useCallback(() => queue.current, []);
  const value = useMemo(
    () => ({ tray, board, add, remove, repository, loaded, sync, takeReleasedNotices, whenIdle }),
    [tray, board, add, remove, repository, loaded, sync, takeReleasedNotices, whenIdle],
  );
  return <CompareTrayContext.Provider value={value}>{children}</CompareTrayContext.Provider>;
}

export function useCompareTray(): CompareTrayValue {
  const value = useContext(CompareTrayContext);
  if (!value) throw new Error("CompareTrayProvider 밖에서 useCompareTray를 호출했습니다");
  return value;
}

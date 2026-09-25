/**
 * 선택 자동 저장 직렬화 (SPEC 8.2 · AC-23). 앞 요청이 끝난 뒤 최신 상태로 한 번만 보낸다 —
 * 요청이 겹치지 않으므로 응답이 역순으로 와서 옛 선택이 새 선택을 덮는 일이 없다.
 */
import { CompareBoardError, type CompareBoardRepository } from "../../data/compareBoardRepository";
import type { CompareBoard, CompareBoardErrorCode, CustomStyle, Picks, SaveStatus } from "../../domain/compareBoard";

export interface PicksSaverState {
  /** 서버가 마지막으로 확인한 보드 (revision 기준) */
  readonly board: CompareBoard;
  readonly status: SaveStatus;
  readonly error?: CompareBoardErrorCode | "UNKNOWN";
}

interface Pending {
  readonly picks: Picks;
  readonly custom: CustomStyle;
}

export interface PicksSaver {
  save(picks: Picks, custom: CustomStyle): Promise<void>;
  /** 실패한 마지막 선택을 다시 저장 */
  retry(): Promise<void>;
  getState(): PicksSaverState;
}

export function createPicksSaver(
  repository: Pick<CompareBoardRepository, "savePicks" | "getBoard">,
  initial: CompareBoard,
  onChange?: (state: PicksSaverState) => void,
): PicksSaver {
  let state: PicksSaverState = { board: initial, status: "idle" };
  let pending: Pending | undefined;
  let failed: Pending | undefined;
  let running: Promise<void> | undefined;
  const set = (next: PicksSaverState) => {
    state = next;
    onChange?.(state);
  };

  async function fail(error: unknown, attempt: Pending): Promise<void> {
    // 저장 중에 바뀐 최신 선택이 있으면 그것을 다시 시도 대상으로 남긴다
    const latestIntent = pending ?? attempt;
    pending = undefined;
    if (error instanceof CompareBoardError && error.code === "STALE_BOARD") {
      // 다른 곳에서 바뀐 보드를 받아 화면을 맞춘다 (S-14). 재조회도 실패하면 다시 시도로 재조회·저장을 되풀이할 수 있게 남긴다
      const latest = error.board ?? (await repository.getBoard().then((load) => load.board, () => undefined));
      failed = latest ? undefined : latestIntent;
      // 최신 보드로 맞췄으면 saved + STALE 안내(확정 가능). 재조회 중 새 선택이 들어왔으면 그 저장이 끝날 때까지 saving (Codex R4), 재조회 실패면 error
      const synced = pending ? "saving" : "saved";
      set({ board: latest ?? state.board, status: latest ? synced : "error", error: "STALE_BOARD" });
      return;
    }
    failed = latestIntent;
    set({ board: state.board, status: "error", error: error instanceof CompareBoardError ? error.code : "UNKNOWN" });
  }

  async function drain(): Promise<void> {
    try {
      while (pending) {
        const attempt = pending;
        pending = undefined;
        try {
          const board = await repository.savePicks(attempt.picks, attempt.custom, state.board.revision);
          set({ board, status: pending ? "saving" : "saved" });
        } catch (error) {
          await fail(error, attempt);
        }
      }
    } finally {
      running = undefined;
    }
  }

  const save = (picks: Picks, custom: CustomStyle) => {
    pending = { picks, custom };
    failed = undefined;
    if (state.status !== "saving") set({ board: state.board, status: "saving" });
    running ??= drain();
    return running;
  };

  return {
    save,
    retry: () => (failed ? save(failed.picks, failed.custom) : Promise.resolve()),
    getState: () => state,
  };
}

/**
 * 추천 적용 흐름 — 조작 뒤 청크(RecoApply가 다시 내보낸다). RECO-SPEC 3.3 · 7a RQ-01 B · RQ-10 A · RQ-11 A.
 * 미리보기(쓰기 0) → 적용(열 ≤ 1 추가 + 전 선택 행 저장) → 되돌리기. 쓰기는 트레이 큐 통로(runQueued)로만 보낸다 —
 * 큐는 실패를 삼키고 저장소 보드로 다시 맞추므로, 성공·실패·충돌은 요청 안에서 기록한 결과로만 판정한다(AC-16).
 */
import type { CompareBoardRepository } from "../../data/compareBoardRepository";
import type { CompareBoard, PickableRowId, Picks } from "../../domain/compareBoard";
import { RECO_ROW_IDS as PICKABLE_ROW_IDS } from "./recoRows";

type RunQueued = (request: () => Promise<CompareBoard>) => Promise<unknown>;

export interface ApplyDiffRow {
  readonly row: PickableRowId;
  /** 지금 고른 레퍼런스 id — 없으면 새로 고름 */
  readonly from?: string;
}

export interface ApplyPlan {
  readonly referenceId: string;
  /** 미리보기 때 본 보드 revision — 적용 직전 다르면 충돌 */
  readonly revision: number;
  readonly before: Picks;
  readonly inColumns: boolean;
  readonly diff: readonly ApplyDiffRow[];
}

/** 적용 진행 — 열을 넣고 선택 저장만 실패했으면 재시도는 선택 저장만(3.3 2′) */
export interface ApplyProgress {
  readonly expectRevision: number;
  readonly added: boolean;
}

export type ApplyOutcome =
  | { readonly kind: "applied"; readonly revision: number; readonly added: boolean }
  | { readonly kind: "conflict" }
  | { readonly kind: "error"; readonly progress: ApplyProgress };

export interface UndoTicket {
  readonly referenceId: string;
  readonly before: Picks;
  readonly added: boolean;
  /** 적용(또는 되돌리기 일부) 뒤 revision — 다르면 되돌리기 비활성(stale) */
  readonly revision: number;
  /** 선택은 이미 되돌렸고 열 빼기만 남음 */
  readonly picksRestored?: boolean;
}

export type UndoOutcome =
  | { readonly kind: "undone" }
  | { readonly kind: "stale" }
  | { readonly kind: "error"; readonly ticket: UndoTicket };

/** 미리보기 재료 — 큐가 빈 뒤의 보드로 계산한다(쓰기 0). 바뀌는 행 = 이 레퍼런스가 아닌 값이 골라져 있거나 비어 있는 선택 행 */
export async function previewApply(repository: CompareBoardRepository, whenIdle: () => Promise<unknown>, referenceId: string): Promise<ApplyPlan> {
  await whenIdle();
  const { board } = await repository.getBoard();
  const diff = PICKABLE_ROW_IDS.filter((row) => board.picks[row] !== referenceId).map((row) => {
    const from = board.picks[row];
    return from === undefined ? { row } : { row, from };
  });
  return {
    referenceId,
    revision: board.revision,
    before: board.picks,
    inColumns: board.columns.some((c) => c.referenceId === referenceId),
    diff,
  };
}

/** 그 레퍼런스가 값을 가진 모든 선택 행(비교 셀 binding 있음) → 이 레퍼런스 */
async function picksOf(repository: CompareBoardRepository, referenceId: string): Promise<Picks> {
  const { results } = await repository.getComparison([referenceId]);
  const comparison = results.find((r) => r.referenceId === referenceId && r.status === "available")?.comparison;
  if (!comparison) throw new Error(`비교 데이터 없음: ${referenceId}`);
  return Object.fromEntries(PICKABLE_ROW_IDS.filter((row) => comparison.cells[row].binding !== null).map((row) => [row, referenceId]));
}

export async function runApply(run: RunQueued, repository: CompareBoardRepository, plan: ApplyPlan, progress?: ApplyProgress): Promise<ApplyOutcome> {
  let state: ApplyProgress = progress ?? { expectRevision: plan.revision, added: false };
  let outcome: ApplyOutcome = { kind: "error", progress: state };
  await run(async () => {
    const { board } = await repository.getBoard();
    if (board.revision !== state.expectRevision) {
      outcome = { kind: "conflict" };
      return board;
    }
    let current = board;
    if (!board.columns.some((c) => c.referenceId === plan.referenceId)) {
      const added = await repository.addReference(plan.referenceId);
      if (!added.ok) throw new Error(`열 추가 거부: ${added.reason}`);
      current = added.board;
      state = { expectRevision: current.revision, added: true };
      outcome = { kind: "error", progress: state };
    }
    const saved = await repository.savePicks(await picksOf(repository, plan.referenceId), current.custom, current.revision);
    outcome = { kind: "applied", revision: saved.revision, added: state.added };
    return saved;
  });
  return outcome;
}

export async function runUndo(run: RunQueued, repository: CompareBoardRepository, ticket: UndoTicket): Promise<UndoOutcome> {
  let state = ticket;
  let outcome: UndoOutcome = { kind: "error", ticket: state };
  await run(async () => {
    const { board } = await repository.getBoard();
    if (board.revision !== state.revision) {
      outcome = { kind: "stale" };
      return board;
    }
    let current = board;
    if (!state.picksRestored) {
      current = await repository.savePicks(state.before, board.custom, board.revision);
      state = { ...state, revision: current.revision, picksRestored: true };
      outcome = { kind: "error", ticket: state };
    }
    if (state.added) current = (await repository.removeReference(state.referenceId)).board;
    outcome = { kind: "undone" };
    return current;
  });
  return outcome;
}


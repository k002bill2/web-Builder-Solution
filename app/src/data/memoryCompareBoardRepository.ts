/**
 * 비교 보드 저장소 메모리 구현 (SPEC 8.2) — 백엔드 전까지 서버 역할을 흉내 낸다.
 * 지연(`delay`: 요청 도착 전·응답 반환 전)과 실패(`fail`)를 주입할 수 있다(AC-23 경합 테스트).
 * 프로필 버전은 공유 저장 모듈(studioStore)에 쓴다 — 확정은 ① expectedLatest 비교 ② 버전 삽입 ③ 보드 확정 갱신을
 * 한 동기 구간에서 커밋하거나 함께 롤백한다. `fail`의 `phase: "commit"`은 ② 뒤 ③ 앞 (DS-2A-04 6.3 r3).
 * 확정 본문(판정·쓰기·이어받기 준비)은 확정을 처음 부를 때 받는다(memoryBoardConfirm) — 보드 진입 직후 합계(/compare)에 싣지 않는다(FIX3 1안).
 * 받기는 `call`의 동기 구간 밖(앞)이라 비교·삽입·보드 갱신의 원자성은 그대로다.
 */
import { addColumn, removeColumn } from "../domain/boardColumns";
import { parseBoardInput } from "../domain/boardInput";
import { releaseUnavailablePicks } from "../domain/boardPicks";
import { emptyBoard, type CompareBoard, type ComparisonResult, type Picks } from "../domain/compareBoard";
import { resolveComparisons, type ComparisonCatalog } from "../domain/comparisonCells";
import { buildProfileDraft } from "../domain/profileDraft";
import { EXPOSED_LICENSE_STATUSES } from "../domain/reference";
import { SECTION_LIBRARY, type SectionLibrary } from "../domain/sectionLibrary";
import { CompareBoardError, type CompareBoardRepository, type ConfirmResult } from "./compareBoardRepository";
import type { BoardConfirmer } from "./memoryBoardConfirm";
import { createStudioStore, headOf, type StudioStore } from "./studioStore";
import { loadBoardConfirm } from "./writeBodyLoader";

export type BoardMethod = keyof CompareBoardRepository;
export interface BoardCall {
  readonly method: BoardMethod;
  /** 메서드별 1부터 */
  readonly seq: number;
  /** commit = 확정의 ② 삽입 뒤 ③ 보드 갱신 앞(`fail`만, 동기 구간이라 `delay` 없음) */
  readonly phase: "request" | "commit" | "response";
}

export interface MemoryCompareBoardOptions {
  readonly catalog: ComparisonCatalog;
  readonly library?: SectionLibrary;
  readonly initialBoard?: CompareBoard;
  readonly now?: () => string;
  readonly delay?: (call: BoardCall) => Promise<void> | void | undefined;
  readonly fail?: (call: BoardCall) => Error | undefined;
  /** 프로필 저장소와 함께 쓰는 저장 모듈 (DS-2A-04 6.3). 없으면 새로 만든다 */
  readonly store?: StudioStore;
}

export function createMemoryCompareBoardRepository(options: MemoryCompareBoardOptions): CompareBoardRepository {
  const { catalog, library = SECTION_LIBRARY, now = () => new Date().toISOString(), store = createStudioStore() } = options;
  let board: CompareBoard = options.initialBoard ?? emptyBoard("board-current", now());
  const counts = new Map<BoardMethod, number>();

  /** `commitGate`는 확정 쓰기가 ② 삽입 뒤에 부른다 — 던지면 store 트랜잭션이 ②를 버린다 */
  async function call<T>(method: BoardMethod, work: (commitGate: () => void) => T): Promise<T> {
    const seq = (counts.get(method) ?? 0) + 1;
    counts.set(method, seq);
    await options.delay?.({ method, seq, phase: "request" });
    const failure = options.fail?.({ method, seq, phase: "request" });
    if (failure) throw failure;
    const result = work(() => {
      const commitFailure = options.fail?.({ method, seq, phase: "commit" });
      if (commitFailure) throw commitFailure;
    });
    await options.delay?.({ method, seq, phase: "response" });
    return result;
  }

  /** 밖으로 나가는 보드 — 확정 계열의 최신·확정 버전 base를 읽을 때 채운다(보드 레코드에는 저장하지 않음, 6.1-1) */
  function view(current: CompareBoard = board): CompareBoard {
    const confirmed = current.confirmed;
    const versions = confirmed ? store.versions(confirmed.profileId) : [];
    const latest = versions.at(-1);
    if (!confirmed || !latest) return current;
    const confirmedBase = versions.find((v) => v.version === confirmed.version)?.base;
    return { ...current, confirmed: { ...confirmed, latestVersion: latest.version, latest: headOf(latest), ...(confirmedBase && { confirmedBase }) } };
  }
  const staleBoard = (revision: number) => new CompareBoardError("STALE_BOARD", `revision ${revision} ≠ ${board.revision}`, view());

  const resultsOf = (ids: readonly string[]) => resolveComparisons(ids, catalog, library);
  const commit = (next: CompareBoard) => (board = { ...next, revision: board.revision + 1, updatedAt: now() });

  /** 선택이 가리키는 열이 보드에 있고, 사용 가능하고, 값이 있는지 */
  function assertPicks(picks: Picks, results: readonly ComparisonResult[]): void {
    for (const [row, referenceId] of Object.entries(picks) as [keyof Picks, string][]) {
      if (!board.columns.some((c) => c.referenceId === referenceId)) throw new CompareBoardError("SCHEMA_INVALID", `보드에 없는 열: ${referenceId}`);
      const result = results.find((r) => r.referenceId === referenceId);
      if (result?.status !== "available") throw new CompareBoardError("LICENSE_BLOCKED", `사용할 수 없는 레퍼런스: ${referenceId}`);
      if (!result.comparison?.cells[row].binding) throw new CompareBoardError("UNSUPPORTED_COMBINATION", `${row}: ${referenceId}에 선택할 값이 없음`);
    }
  }

  let confirmer: BoardConfirmer | undefined;
  /** 확정 본문을 받고(받은 모듈만 기억 — 로드 실패 뒤 다시 부르면 다시 받는다) 이어받기 규칙을 준비한다. `call` 앞, 동기 구간 밖 */
  const confirmerFor = async (profileId: string | undefined): Promise<BoardConfirmer> => {
    const { createBoardConfirmer } = await loadBoardConfirm();
    confirmer ??= createBoardConfirmer({ store, library, now, resultsOf, assertPicks, staleBoard, buildProfileDraft });
    await confirmer.prepare(profileId);
    return confirmer;
  };

  /** 확정 판정·쓰기는 본문이, 확정 결과 보드 반영은 여기서 — 한 동기 구간 */
  function confirmWith(body: BoardConfirmer, revision: number, expectedLatest: number, profileId: string | undefined, commitGate: () => void): ConfirmResult {
    const { result, board: next } = body.confirmInto(board, revision, expectedLatest, profileId, commitGate);
    board = next;
    return result;
  }

  return {
    getBoard: () =>
      call("getBoard", () => {
        const { picks, released } = releaseUnavailablePicks(board, resultsOf(board.columns.map((c) => c.referenceId)));
        if (released.length > 0) commit({ ...board, picks });
        return { board: view(), released };
      }),
    addReference: (referenceId) =>
      call("addReference", () => {
        const reference = catalog.references.find((r) => r.id === referenceId);
        const exposed = reference && (EXPOSED_LICENSE_STATUSES as readonly string[]).includes(reference.licenseStatus);
        if (!exposed) return { ok: false, reason: "unavailable", board: view() } as const;
        const result = addColumn(board, referenceId);
        if (result.ok) commit(result.board);
        return { ...result, board: view() };
      }),
    removeReference: (referenceId) =>
      call("removeReference", () => {
        const { board: next, released } = removeColumn(board, referenceId);
        if (next !== board) commit(next);
        return released ? { board: view(), released } : { board: view() };
      }),
    savePicks: (picks, custom, expectedRevision) =>
      call("savePicks", () => {
        const parsed = parseBoardInput(picks, custom);
        if (!parsed.ok) throw new CompareBoardError("SCHEMA_INVALID", Object.values(parsed.errors).join(", "));
        // 열 소속은 현재 보드 기준이라 revision이 맞을 때만 본다 — 다른 곳에서 뺀 열이면 STALE_BOARD로 최신 보드를 준다
        if (expectedRevision !== board.revision) throw staleBoard(expectedRevision);
        assertPicks(parsed.value.picks, resultsOf(board.columns.map((c) => c.referenceId)));
        return view(commit({ ...board, picks: parsed.value.picks, custom: parsed.value.custom }));
      }),
    getComparison: (referenceIds) => call("getComparison", () => ({ libraryVersion: library.version, results: resultsOf(referenceIds) })),
    confirmProfile: async (revision, expectedLatest) => {
      const body = await confirmerFor(board.confirmed?.profileId);
      return call("confirmProfile", (commitGate) => confirmWith(body, revision, expectedLatest, board.confirmed?.profileId, commitGate));
    },
    createProfileVersion: async (profileId, revision, expectedLatest) => {
      const body = await confirmerFor(profileId);
      return call("createProfileVersion", (commitGate) => {
        if (board.confirmed?.profileId !== profileId) throw new CompareBoardError("SCHEMA_INVALID", `이 보드의 프로필이 아님: ${profileId}`);
        return confirmWith(body, revision, expectedLatest, profileId, commitGate);
      });
    },
    getProfileVersions: (profileId) => call("getProfileVersions", () => store.versions(profileId)),
  };
}

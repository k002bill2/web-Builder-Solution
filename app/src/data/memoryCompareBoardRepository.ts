/**
 * 비교 보드 저장소 메모리 구현 (SPEC 8.2) — 백엔드 전까지 서버 역할을 흉내 낸다.
 * 지연(`delay`: 요청 도착 전·응답 반환 전)과 실패(`fail`)를 주입할 수 있다(AC-23 경합 테스트).
 */
import { addColumn, removeColumn } from "../domain/boardColumns";
import { parseBoardInput } from "../domain/boardInput";
import { releaseUnavailablePicks } from "../domain/boardPicks";
import { emptyBoard, type CompareBoard, type ComparisonResult, type DesignProfileInput, type Picks } from "../domain/compareBoard";
import { resolveComparisons, type ComparisonCatalog } from "../domain/comparisonCells";
import { buildProfileDraft } from "../domain/profileDraft";
import { EXPOSED_LICENSE_STATUSES } from "../domain/reference";
import { SECTION_LIBRARY, resolveVariant, type SectionLibrary } from "../domain/sectionLibrary";
import { CompareBoardError, type CompareBoardRepository, type ConfirmResult, type StoredProfile } from "./compareBoardRepository";

export type BoardMethod = keyof CompareBoardRepository;
export interface BoardCall {
  readonly method: BoardMethod;
  /** 메서드별 1부터 */
  readonly seq: number;
  readonly phase: "request" | "response";
}

export interface MemoryCompareBoardOptions {
  readonly catalog: ComparisonCatalog;
  readonly library?: SectionLibrary;
  readonly initialBoard?: CompareBoard;
  readonly now?: () => string;
  readonly delay?: (call: BoardCall) => Promise<void> | void | undefined;
  readonly fail?: (call: BoardCall) => Error | undefined;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** R-12: 사업자정보 없는 Footer는 확정 시 같은 모양의 사업자정보 확장 변형으로 바꾼다. */
function withBusinessInfoFooter(profile: DesignProfileInput, library: SectionLibrary): DesignProfileInput {
  const footer = profile.component_choices.footer?.variant;
  const def = footer === undefined ? undefined : resolveVariant(library, "footer", footer)?.def;
  const variant = def?.hasBusinessInfo === false ? def.businessInfoVariant : undefined;
  if (!variant) return profile;
  return {
    ...profile,
    component_choices: { ...profile.component_choices, footer: { section: "footer", variant } },
    section_plan: profile.section_plan.map((s) => (s.type === "footer" ? { type: "footer", variant } : s)),
  };
}

export function createMemoryCompareBoardRepository(options: MemoryCompareBoardOptions): CompareBoardRepository {
  const { catalog, library = SECTION_LIBRARY, now = () => new Date().toISOString() } = options;
  let board: CompareBoard = options.initialBoard ?? emptyBoard("board-current", now());
  let profiles: readonly StoredProfile[] = [];
  const counts = new Map<BoardMethod, number>();

  async function call<T>(method: BoardMethod, work: () => T): Promise<T> {
    const seq = (counts.get(method) ?? 0) + 1;
    counts.set(method, seq);
    await options.delay?.({ method, seq, phase: "request" });
    const failure = options.fail?.({ method, seq, phase: "request" });
    if (failure) throw failure;
    const result = work();
    await options.delay?.({ method, seq, phase: "response" });
    return result;
  }

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

  function confirmInto(revision: number, profileId: string, version: number): ConfirmResult {
    if (revision !== board.revision) throw new CompareBoardError("STALE_BOARD", `revision ${revision} ≠ ${board.revision}`, board);
    const results = resultsOf(board.columns.map((c) => c.referenceId));
    assertPicks(board.picks, results);
    const draft = buildProfileDraft(board, results, library.version);
    if (draft.status !== "ready") throw new CompareBoardError("UNSUPPORTED_COMBINATION", "Hero 선택이 필요합니다");
    const record: StoredProfile = { profileId, version, boardRevision: revision, profile: withBusinessInfoFooter(draft.profile, library), createdAt: now() };
    profiles = [...profiles, deepFreeze(record)];
    board = { ...board, confirmed: { profileId, version, revision } };
    return { profileId, version };
  }

  function nextVersion(profileId: string, revision: number): ConfirmResult {
    if (board.confirmed?.profileId !== profileId) throw new CompareBoardError("SCHEMA_INVALID", `이 보드의 프로필이 아님: ${profileId}`);
    const latest = Math.max(...profiles.filter((p) => p.profileId === profileId).map((p) => p.version));
    return confirmInto(revision, profileId, latest + 1);
  }

  return {
    getBoard: () =>
      call("getBoard", () => {
        const { picks, released } = releaseUnavailablePicks(board, resultsOf(board.columns.map((c) => c.referenceId)));
        if (released.length > 0) commit({ ...board, picks });
        return { board, released };
      }),
    addReference: (referenceId) =>
      call("addReference", () => {
        const reference = catalog.references.find((r) => r.id === referenceId);
        const exposed = reference && (EXPOSED_LICENSE_STATUSES as readonly string[]).includes(reference.licenseStatus);
        if (!exposed) return { ok: false, reason: "unavailable", board } as const;
        const result = addColumn(board, referenceId);
        return result.ok ? { ok: true, board: commit(result.board) } : result;
      }),
    removeReference: (referenceId) =>
      call("removeReference", () => {
        const { board: next, released } = removeColumn(board, referenceId);
        if (next !== board) commit(next);
        return released ? { board, released } : { board };
      }),
    savePicks: (picks, custom, expectedRevision) =>
      call("savePicks", () => {
        const parsed = parseBoardInput(picks, custom);
        if (!parsed.ok) throw new CompareBoardError("SCHEMA_INVALID", Object.values(parsed.errors).join(", "));
        assertPicks(parsed.value.picks, resultsOf(board.columns.map((c) => c.referenceId)));
        if (expectedRevision !== board.revision) throw new CompareBoardError("STALE_BOARD", `revision ${expectedRevision} ≠ ${board.revision}`, board);
        return commit({ ...board, picks: parsed.value.picks, custom: parsed.value.custom });
      }),
    getComparison: (referenceIds) => call("getComparison", () => ({ libraryVersion: library.version, results: resultsOf(referenceIds) })),
    confirmProfile: (revision) =>
      call("confirmProfile", () =>
        board.confirmed ? nextVersion(board.confirmed.profileId, revision) : confirmInto(revision, `profile-${profiles.length + 1}`, 1),
      ),
    createProfileVersion: (profileId, revision) => call("createProfileVersion", () => nextVersion(profileId, revision)),
    getProfileVersions: (profileId) => call("getProfileVersions", () => profiles.filter((p) => p.profileId === profileId)),
  };
}

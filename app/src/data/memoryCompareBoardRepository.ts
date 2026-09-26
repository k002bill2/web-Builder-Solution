/**
 * 비교 보드 저장소 메모리 구현 (SPEC 8.2) — 백엔드 전까지 서버 역할을 흉내 낸다.
 * 지연(`delay`: 요청 도착 전·응답 반환 전)과 실패(`fail`)를 주입할 수 있다(AC-23 경합 테스트).
 * 프로필 버전은 공유 저장 모듈(studioStore)에 쓴다 — 확정은 ① expectedLatest 비교 ② 버전 삽입 ③ 보드 확정 갱신을
 * 한 동기 구간에서 커밋하거나 함께 롤백한다. `fail`의 `phase: "commit"`은 ② 뒤 ③ 앞 (DS-2A-04 6.3 r3).
 */
import { addColumn, removeColumn } from "../domain/boardColumns";
import { parseBoardInput } from "../domain/boardInput";
import { releaseUnavailablePicks } from "../domain/boardPicks";
import { emptyBoard, type CompareBoard, type ComparisonResult, type DesignProfileInput, type Picks } from "../domain/compareBoard";
import type { ProfileVersion } from "../domain/profile";
import { resolveComparisons, type ComparisonCatalog } from "../domain/comparisonCells";
import { buildProfileDraft } from "../domain/profileDraft";
import { EXPOSED_LICENSE_STATUSES } from "../domain/reference";
import { SECTION_LIBRARY, resolveVariant, type SectionLibrary } from "../domain/sectionLibrary";
import { CompareBoardError, type CompareBoardRepository, type ConfirmResult } from "./compareBoardRepository";
import { createStudioStore, headOf, type StudioStore } from "./studioStore";

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

type CarryOver = typeof import("../domain/profileAdjustments").carryOverAdjustments;
/** 재확정 이어받기 규칙(대비 검사 포함)은 확정할 때 받는다 — 보드 진입 직후 합계에 싣지 않는다(2a-04b1 번들). 동기 구간 앞에서 받는다 */
const loadCarryOver = async (): Promise<CarryOver> => (await import("../domain/profileAdjustments")).carryOverAdjustments;

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

  /**
   * 보드 확정 (6.1-4 · 6.3 r3). 판정 순서: 멱등 키 → STALE_BOARD → STALE_PROFILE → 선택·라이브러리 검사.
   * `profileId`가 없으면 첫 확정(새 계열). 같은 키의 재시도는 커밋된 결과를 그대로 돌려준다(새 버전 0).
   */
  function confirmInto(revision: number, expectedLatest: number, profileId: string | undefined, commitGate: () => void, carryOverAdjustments: CarryOver): ConfirmResult {
    const key = [board.id, revision, expectedLatest].join("\n");
    const done = profileId === undefined ? undefined : store.commitOf(profileId);
    if (done?.key === key) return { profileId: done.profileId, version: done.version };
    if (revision !== board.revision) throw staleBoard(revision);
    const latest = profileId === undefined ? undefined : store.versions(profileId).at(-1);
    if ((latest?.version ?? 0) !== expectedLatest) {
      throw new CompareBoardError("STALE_PROFILE", `expectedLatest ${expectedLatest} ≠ ${latest?.version ?? 0}`, undefined, latest && headOf(latest));
    }
    const results = resultsOf(board.columns.map((c) => c.referenceId));
    assertPicks(board.picks, results);
    const draft = buildProfileDraft(board, results, library.version);
    if (draft.status !== "ready") throw new CompareBoardError("UNSUPPORTED_COMBINATION", "Hero 선택이 필요합니다");
    // 기본값으로 들어간 섹션까지 현재 라이브러리 버전으로 다시 검사한다 (SPEC 8.2)
    const unsupported = draft.profile.section_plan.find(
      (s) => (s.type === "header" || s.type === "hero" || s.type === "footer") && resolveVariant(library, s.type, s.variant)?.variant !== s.variant,
    );
    if (unsupported) throw new CompareBoardError("UNSUPPORTED_COMBINATION", `라이브러리 ${library.version}에 없는 변형: ${unsupported.type}/${unsupported.variant}`);
    const base = withBusinessInfoFooter(draft.profile, library);
    // 재확정 = 필드 단위 이어받기 (6.1-3). 기준 = 보드가 확정한 버전의 base, 이어받을 조정 = 계열 최신 — 보드 패널(P-S25)과 같은 함수·입력
    const confirmedBase = latest && store.versions(latest.profileId).find((v) => v.version === board.confirmed?.version)?.base;
    const plan = latest && confirmedBase ? carryOverAdjustments(confirmedBase, latest.adjustments, base) : undefined;
    const result = store.transact((tx): ConfirmResult => {
      const id = profileId ?? tx.nextProfileId();
      const version = expectedLatest + 1;
      const record: ProfileVersion = {
        profileId: id,
        version,
        origin: profileId ? "board-reconfirm" : "board",
        boardRevision: revision,
        baseReferenceId: draft.baseReferenceId,
        base,
        adjustments: plan?.adjustments ?? {},
        ...(plan && plan.dropped.length > 0 && { dropped: plan.dropped }),
        createdAt: now(),
      };
      tx.insert(record);
      tx.remember({ key, profileId: id, version });
      commitGate();
      return { profileId: id, version };
    });
    board = { ...board, confirmed: { profileId: result.profileId, version: result.version, revision, picks: board.picks, custom: board.custom } };
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
      const carryOver = await loadCarryOver();
      return call("confirmProfile", (commitGate) => confirmInto(revision, expectedLatest, board.confirmed?.profileId, commitGate, carryOver));
    },
    createProfileVersion: async (profileId, revision, expectedLatest) => {
      const carryOver = await loadCarryOver();
      return call("createProfileVersion", (commitGate) => {
        if (board.confirmed?.profileId !== profileId) throw new CompareBoardError("SCHEMA_INVALID", `이 보드의 프로필이 아님: ${profileId}`);
        return confirmInto(revision, expectedLatest, profileId, commitGate, carryOver);
      });
    },
    getProfileVersions: (profileId) => call("getProfileVersions", () => store.versions(profileId)),
  };
}

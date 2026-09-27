/**
 * 보드 확정 본문 (6.1-4 · 6.3 r3) — memoryCompareBoardRepository가 확정을 처음 부를 때 받는다(writeBodyLoader, FIX3 1안).
 * 보드 진입 직후 합계(/compare)에 싣지 않는다. 판정·쓰기(`confirmFirst`·`confirmVersion`)는 저장소 `call`의 동기 구간 안에서만 부른다.
 * 재확정 이어받기 규칙(대비 검사 포함)은 이 청크에서 한 번 더 필요할 때만 받는다 — 계열 최신에 조정이 있을 때(`prepare`, 동기 구간 앞).
 */
import type { CompareBoard, ComparisonResult, DesignProfileInput, Picks } from "../domain/compareBoard";
import type { ProfileVersion } from "../domain/profile";
import type { buildProfileDraft } from "../domain/profileDraft";
import { defaultProjectName } from "../domain/projectName";
import { resolveVariant, type SectionLibrary } from "../domain/sectionLibrary";
import { retryableImport } from "./chunkRetry";
import { CompareBoardError, type ConfirmResult, type ConfirmTarget } from "./compareBoardRepository";
import { headOf, type StudioStore } from "./studioStore";

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
/** 조작 뒤 청크 — 실패 뒤 다시 확정하면 새 URL로 받는다(F1) */
const loadCarryOver = retryableImport(() => import("../domain/profileAdjustments"));
const hasAdjustments = (version: ProfileVersion | undefined) => version !== undefined && Object.keys(version.adjustments).length > 0;
/** 확정 결과 — 지운 조정 수는 저장한 버전 레코드에서 읽는다(멱등 재생도 같은 값, P-S25 r6) */
const resultOf = ({ profileId, version, dropped }: Pick<ProfileVersion, "profileId" | "version" | "dropped">): ConfirmResult => ({
  profileId,
  version,
  ...(dropped && dropped.length > 0 && { droppedCount: dropped.length }),
});

/** 저장소가 넘기는 것 — 보드 레코드 자체는 저장소 클로저가 갖고, 확정 결과 보드만 돌려받아 바꾼다 */
export interface BoardConfirmDeps {
  readonly store: StudioStore;
  readonly library: SectionLibrary;
  readonly now: () => string;
  readonly resultsOf: (ids: readonly string[]) => readonly ComparisonResult[];
  /** 선택이 가리키는 열이 보드에 있고, 사용 가능하고, 값이 있는지 */
  readonly assertPicks: (picks: Picks, results: readonly ComparisonResult[]) => void;
  readonly staleBoard: (revision: number) => CompareBoardError;
  /**
   * 초안 계산은 저장소가 넘긴다 — 이 청크가 profileDraft를 직접 import하면 번들러가 보드 엔진·저장소 공유 청크를 다시 나눠
   * 보드 진입 직후 합계가 오히려 +0.24KB 늘었다(FIX3 실측 125.08 → 125.32, 넘기면 124.36). 타입만 import한다
   */
  readonly buildProfileDraft: typeof buildProfileDraft;
}

export interface BoardConfirmer {
  /**
   * 계열 최신에 조정이 있을 때만 규칙을 받는다 — 첫 확정·조정 없는 재확정은 더 기다리지 않는다.
   * 받은 뒤 동기 구간에서 최신이 바뀌었으면 대개 expectedLatest 판정(STALE_PROFILE)이 먼저 거른다. 호출자가 아직 없던
   * 번호를 기대했다면 확정 본문이 STALE_PROFILE로 돌려보낸다.
   */
  prepare(profileId: string | undefined): Promise<void>;
  /**
   * 확정 (6.1-4 · 6.3 r3 · DS-2A-05 12.2) — confirmProfile. 보드가 확정한 계열의 새 버전, 없으면 새 계열 + 새 프로젝트(트랜잭션 ④).
   * 멱등 키의 대상 = 호출자가 본 최신이 0이면 new(첫 확정은 늘 새 프로젝트 — 응답 실패 뒤 재시도는 보드가 이미 확정됐어도 재생된다)
   */
  confirmFirst(board: CompareBoard, revision: number, expectedLatest: number, commitGate: () => void): ConfirmOutcome;
  /**
   * 재확정 — createProfileVersion. 판정 순서: 멱등 키(대상 포함) → 보드의 계열인지 · new면 expectedLatest 0(SCHEMA_INVALID) → 확정.
   * 멱등 재생이 계열 검사보다 먼저다 — "new" 응답 실패 뒤에는 보드가 이미 새 계열을 가리킨다(J-AC-07 ②)
   */
  confirmVersion(board: CompareBoard, profileId: string, revision: number, expectedLatest: number, target: ConfirmTarget, commitGate: () => void): ConfirmOutcome;
}

type ConfirmOutcome = { readonly result: ConfirmResult; readonly board: CompareBoard };

/**
 * 멱등 키 = (보드 id, revision, expectedLatest, 확정 대상, 호출자가 넘긴 계열) — 대상이 빠지면 대상을 바꾼 재시도가 다른 프로젝트 결과를
 * 돌려받는다(12.2). 계열이 빠지면 같은 revision의 첫 확정 결과를 "새 프로젝트" 요청이나 다른 계열 id로 재생한다(리뷰 Major).
 * 첫 확정(confirmProfile)은 호출자가 계열을 넘기지 않는다 — 재시도 때 보드가 이미 확정됐어도 같은 키
 */
const keyOf = (board: CompareBoard, revision: number, expectedLatest: number, target: ConfirmTarget, callerSeries = "") =>
  [board.id, revision, expectedLatest, target, callerSeries].join("\n");
/** 계열마다 마지막 커밋에서 같은 키를 찾는다 — 대상이 new면 재시도 때 보드는 이미 새 계열을 가리킨다 */
function replayOf(store: StudioStore, key: string): ConfirmResult | undefined {
  const done = store.profileIds().map((id) => store.commitOf(id)).find((commit) => commit?.key === key);
  return done && resultOf(store.versions(done.profileId).find((v) => v.version === done.version) ?? done);
}

function confirmIn(
  { store, library, now, resultsOf, assertPicks, staleBoard, buildProfileDraft }: BoardConfirmDeps,
  carryOver: CarryOver | undefined,
  board: CompareBoard,
  revision: number,
  expectedLatest: number,
  profileId: string | undefined,
  key: string,
  commitGate: () => void,
): ConfirmOutcome {
  const done = replayOf(store, key);
  if (done) return { result: done, board };
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
  // 규칙 준비 뒤 요청 지연 중에 조정 버전이 생겼고 호출자가 그 번호를 기대했다 — 일반 오류가 아니라 STALE_PROFILE로 돌려
  // 호출자가 최신을 다시 읽고 확정하게 한다(다음 호출은 규칙을 받는다, Codex P2)
  if (hasAdjustments(latest) && !carryOver) throw new CompareBoardError("STALE_PROFILE", "이어받을 조정이 새로 생겼습니다", undefined, latest && headOf(latest));
  const plan = latest && confirmedBase && carryOver && hasAdjustments(latest) ? carryOver(confirmedBase, latest.adjustments, base) : undefined;
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
    // ④ 프로젝트 생성 — 새 계열이면 같은 트랜잭션(commit 실패면 계열·프로젝트·보드 모두 롤백, J-AC-07 ①)
    if (!profileId) {
      const title = results.find((r) => r.referenceId === draft.baseReferenceId)?.reference?.title ?? draft.baseReferenceId;
      const createdAt = now();
      tx.putProject({
        projectId: `project-${tx.projects().length + 1}`,
        name: defaultProjectName(title, tx.projects().map((p) => p.name)),
        revision: 1,
        profileId: id,
        baseReferenceId: draft.baseReferenceId,
        createdAt,
        updatedAt: createdAt,
      });
    }
    tx.remember({ key, profileId: id, version });
    commitGate();
    return resultOf(record);
  });
  return { result, board: { ...board, confirmed: { profileId: result.profileId, version: result.version, revision, picks: board.picks, custom: board.custom } } };
}

export function createBoardConfirmer(deps: BoardConfirmDeps): BoardConfirmer {
  let carryOver: CarryOver | undefined;
  return {
    prepare: async (profileId) => {
      if (!carryOver && profileId !== undefined && hasAdjustments(deps.store.versions(profileId).at(-1))) carryOver = (await loadCarryOver()).carryOverAdjustments;
    },
    confirmFirst: (board, revision, expectedLatest, commitGate) =>
      confirmIn(deps, carryOver, board, revision, expectedLatest, board.confirmed?.profileId, keyOf(board, revision, expectedLatest, expectedLatest === 0 ? "new" : "current"), commitGate),
    confirmVersion: (board, profileId, revision, expectedLatest, target, commitGate) => {
      const key = keyOf(board, revision, expectedLatest, target, profileId);
      const done = replayOf(deps.store, key);
      if (done) return { result: done, board };
      if (board.confirmed?.profileId !== profileId) throw new CompareBoardError("SCHEMA_INVALID", `이 보드의 프로필이 아님: ${profileId}`);
      if (target === "new" && expectedLatest !== 0) throw new CompareBoardError("SCHEMA_INVALID", `새 프로젝트는 expectedLatest 0: ${expectedLatest}`);
      return confirmIn(deps, carryOver, board, revision, expectedLatest, target === "new" ? undefined : profileId, key, commitGate);
    },
  };
}

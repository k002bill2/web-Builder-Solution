/**
 * 비교 보드 화면 상태 (SPEC 4 · S-01~S-17). 03a API를 연결만 한다:
 * 저장소 → togglePick·pickAllFrom → picksSaver(직렬화 자동 저장) → buildProfileDraft·evaluateBoardWarnings·confirmAvailability.
 * 화면에 보이는 선택(intent)은 저장 요청 전에 바로 반영하고, 저장소가 확인한 보드(revision)는 saver 상태로 따로 둔다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { PrimaryColorCheck } from "../../components/compare/CustomStyleFields";
import type { Announcement, PanelNotice, UndoView } from "../../components/compare/DraftPanel";
import { removeColumn as removeBoardColumn, withoutReference } from "../../domain/boardColumns";
import type { WarningFix } from "../../domain/boardWarnings";
import { draftStatusOf, type CompareBoard, type ComparisonRowId, type CustomStyle, type DraftStatus } from "../../domain/compareBoard";
import type { ConfirmAvailability } from "../../domain/confirmGate";
import { EMPTY_ANNOUNCEMENT, carryOverCount, intentOf, type Comparison, type Intent } from "./boardScreen";
import { useCompareTray } from "./CompareTrayContext";
import type { BoardEngine } from "./boardEngine";
import type { PicksSaver, PicksSaverState } from "./picksSaver";

type Phase = "loading" | "error" | "ready";
interface UndoEntry extends UndoView {
  readonly previous: Intent;
}

const CONFIRMING: ConfirmAvailability = { ok: false, reason: "프로필을 확정하는 중입니다" };
const REJECT_UNTIL_LOADED: PrimaryColorCheck = async () => ({ ok: false, error: "잠시 후 다시 입력하세요" });
const UNCONFIRMED: DraftStatus = { kind: "unconfirmed", nextVersion: 1 };

export function useCompareBoard() {
  const { repository, loaded, sync, takeReleasedNotices, whenIdle } = useCompareTray();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<PicksSaverState | null>(null);
  const [intent, setIntent] = useState<Intent>({ picks: {}, custom: {} });
  const [comparison, setComparison] = useState<Comparison>({ libraryVersion: "", results: [] });
  const [notices, setNotices] = useState<readonly PanelNotice[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement>(EMPTY_ANNOUNCEMENT);
  const [undo, setUndo] = useState<UndoEntry | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [engine, setEngine] = useState<BoardEngine | null>(null);
  const engineRef = useRef<BoardEngine | null>(null);
  const saver = useRef<PicksSaver | null>(null);
  const lastSave = useRef<Promise<void>>(Promise.resolve());
  const confirmLock = useRef(false);
  const pendingReleased = useRef<readonly string[]>([]);

  const announce = useCallback((text: string) => setAnnouncement((a) => ({ text, key: a.key + 1 })), []);
  const putNotice = useCallback((id: string, notice: PanelNotice | null) => {
    setNotices((current) => [...current.filter((n) => n.id !== id), ...(notice ? [notice] : [])]);
  }, []);

  /** 저장소가 확인한 보드로 saver를 새로 만든다 — 진입·열 빼기·확정 충돌 뒤 revision을 맞춘다 */
  const startSaver = useCallback(
    (board: CompareBoard) => {
      const next = engineRef.current!.createPicksSaver(repository, board, (state) => {
        if (saver.current !== next) return;
        setSaved(state);
        sync(state.board);
        // 다른 곳에서 바뀐 보드로 맞췄다 — 화면 선택도 서버 값으로 (S-14). 재조회 중 새 선택이 있으면(saving) 그것을 둔다
        if (state.error === "STALE_BOARD" && state.status === "saved") {
          setIntent(intentOf(state.board));
          putNotice("stale", engineRef.current!.STALE_SAVE_NOTICE);
        }
      });
      saver.current = next;
      lastSave.current = Promise.resolve();
      setSaved(next.getState());
      sync(board);
    },
    [repository, sync, putNotice],
  );

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    const load = async () => {
      // 엔진(선택 규칙·초안·zod)은 데이터와 함께 받는다 — 첫 화면 정적 JS에서 뺀다 (ADR-004 · boardEngine.ts)
      // 카탈로그에서 막 한 추가·빼기가 끝난 뒤의 보드를 읽는다 (Codex R1)
      const [{ boardEngine }, { board, released }] = await Promise.all([import("./boardEngine"), whenIdle().then(() => repository.getBoard())]);
      // 해제 안내는 한 번만 온다 — 취소된 실행(StrictMode 재실행)이 받아도 잃지 않게 보관한다
      pendingReleased.current = [...pendingReleased.current, ...takeReleasedNotices(), ...released.map((r) => r.notice)];
      const next = await repository.getComparison(board.columns.map((c) => c.referenceId));
      if (cancelled) return;
      engineRef.current = boardEngine;
      setEngine(boardEngine);
      startSaver(board);
      setIntent(intentOf(board));
      setComparison(next);
      setNotices(boardEngine.releasedNotices(pendingReleased.current));
      pendingReleased.current = [];
      setPhase("ready");
    };
    load().catch((error: unknown) => {
      if (cancelled) return;
      console.error("[compare] 비교 보드 불러오기 실패", error);
      setPhase("error");
    });
    return () => {
      cancelled = true;
    };
  }, [loaded, attempt, repository, startSaver, takeReleasedNotices, whenIdle]);

  // 열 구성이 바뀌면(빼기·다른 곳의 변경) 비교 데이터를 다시 받는다
  const columnKey = saved?.board.columns.map((c) => c.referenceId).join("\n") ?? "";
  const comparedKey = comparison.results.map((r) => r.referenceId).join("\n");
  useEffect(() => {
    if (phase !== "ready" || columnKey === comparedKey) return;
    let cancelled = false;
    repository.getComparison(columnKey ? columnKey.split("\n") : []).then(
      (next) => {
        if (!cancelled) setComparison(next);
      },
      (error: unknown) => console.error("[compare] 비교 데이터 다시 받기 실패", error),
    );
    return () => {
      cancelled = true;
    };
  }, [phase, columnKey, comparedKey, repository]);

  const board = useMemo(() => (saved ? { ...saved.board, picks: intent.picks, custom: intent.custom } : null), [saved, intent]);
  const evaluation = useMemo(() => (board && engine ? engine.evaluate(board, comparison) : null), [board, comparison, engine]);
  const view = useMemo(() => (board && engine ? engine.buildBoardView(board, comparison.results) : null), [board, comparison.results, engine]);
  const locked = confirming || removing;
  // P-S25 (DS-2A-04 r6) — 진입 직후 자동은 개수 캡션뿐(인라인 계산). 판정·목록은 CarryOverCaption이 펼칠 때 받는다
  // 캡션은 확정 프로필 + 최신 조정 ≥ 1이면 초안 상태와 무관하게 보인다. 판정 입력(nextBase)은 초안이 ready일 때만 (FIX4)
  const confirmedRef = saved?.board.confirmed;
  const adjustmentCount = carryOverCount(confirmedRef?.latest?.adjustments);
  const draft = evaluation?.draft;
  const carryOver =
    engine && adjustmentCount > 0 && confirmedRef?.confirmedBase && confirmedRef.latest
      ? {
          Caption: engine.CarryOverCaption,
          count: adjustmentCount,
          props:
            draft?.status === "ready"
              ? { confirmedBase: confirmedRef.confirmedBase, adjustments: confirmedRef.latest.adjustments, nextBase: draft.profile }
              : null,
        }
      : null;
  // S-15 — 확정한 선택에서 바뀐 게 없으면 새 버전으로 확정하지 않는다 (태그도 "확정됨")
  const unchanged = useMemo(() => (board && engine ? engine.unchangedSinceConfirm(board) : false), [board, engine]);

  const commit = (next: Intent, text: string) => {
    if (!board || !evaluation || !engine || !saver.current) return;
    setIntent(next);
    lastSave.current = saver.current.save(next.picks, next.custom);
    announce(engine.withWarningDelta(text, evaluation, engine.evaluate({ ...board, ...next }, comparison)));
  };

  const toggle = (rowId: ComparisonRowId, referenceId: string) => {
    if (!board || !engine || locked) return;
    const result = engine.togglePick(board, comparison.results, rowId, referenceId);
    if (!result.ok) return;
    setUndo(null);
    commit({ picks: result.picks, custom: intent.custom }, engine.pickAnnouncement(board, result.change));
  };

  const pickAll = (referenceId: string) => {
    if (!board || !engine || locked) return;
    const result = engine.pickAllFrom(board, comparison.results, referenceId);
    const label = board.columns.find((c) => c.referenceId === referenceId)?.label ?? "";
    setUndo(result.notice ? { message: result.notice, previous: intent, focus: false } : null);
    commit({ picks: result.picks, custom: intent.custom }, result.notice ?? `${label}의 요소로 전부 선택`);
  };

  const clear = () => {
    if (!board || locked) return;
    const count = Object.keys(intent.picks).length;
    if (count === 0 && Object.keys(intent.custom).length === 0) return announce("비울 선택이 없습니다");
    const message = `선택 ${count}개를 비웠습니다`;
    setUndo({ message, previous: intent, focus: true });
    commit({ picks: {}, custom: {} }, message);
  };

  const undoLast = () => {
    if (!undo || locked) return;
    setUndo(null);
    commit(undo.previous, "되돌렸습니다");
  };

  const changeCustom = (custom: CustomStyle) => {
    if (!board || !engine || locked) return;
    setUndo(null);
    commit({ picks: intent.picks, custom }, engine.customAnnouncement(intent.custom, custom));
  };

  const applyFix = (fix: WarningFix) => {
    if (fix.kind === "use-corrected-primary") changeCustom({ ...intent.custom, primaryColor: fix.hex });
    else if (fix.kind === "pick-column" && intent.picks[fix.rowId] !== fix.referenceId) toggle(fix.rowId, fix.referenceId);
  };

  /** P-7 열 빼기 — 앞 저장이 끝난 뒤 빼고, 그 응답의 revision으로 saver를 다시 만든다(다음 선택이 STALE로 버려지지 않게) */
  const removeColumn = async (referenceId: string) => {
    if (!board || !engine || locked) return;
    const local = removeBoardColumn(board, referenceId);
    const label = board.columns.find((c) => c.referenceId === referenceId)?.label ?? "";
    setRemoving(true);
    setUndo(null);
    try {
      await lastSave.current;
      // 앞 저장이 STALE_BOARD로 끝나 서버 선택으로 맞췄으면 그 선택을 기준으로 뺀다 — 옛 로컬 선택으로 덮지 않게 (Codex R1)
      const after = saver.current!.getState();
      const base: Intent = after.error === "STALE_BOARD" ? intentOf(after.board) : { picks: local.board.picks, custom: intent.custom };
      const next: Intent = { picks: withoutReference(base.picks, referenceId), custom: base.custom };
      const { board: server } = await repository.removeReference(referenceId);
      startSaver(server);
      setIntent(next);
      if (!engine.sameIntent(next, intentOf(server))) lastSave.current = saver.current!.save(next.picks, next.custom);
      announce(local.released?.notice ?? `${label}를 뺐습니다`);
    } catch (error) {
      console.error("[compare] 열 빼기 실패", error);
      announce(`${label}를 빼지 못했습니다. 다시 시도하세요`);
    } finally {
      setRemoving(false);
    }
  };

  /** LICENSE_BLOCKED — 최신 보드·비교 결과로 다시 맞춘다(회수 열은 S-08로 보임) */
  const refresh = async () => {
    const { board: latest, released } = await repository.getBoard();
    const next = await repository.getComparison(latest.columns.map((c) => c.referenceId));
    startSaver(latest);
    setIntent(intentOf(latest));
    setComparison(next);
    setNotices((current) => [...current, ...(engineRef.current?.releasedNotices(released.map((r) => r.notice)) ?? [])]);
  };

  const onConfirmError = async (error: unknown) => {
    // 다시 시도는 그때의 최신 핸들러로 — 실패 당시 상태로 확정 가능 여부를 판단하지 않게 (Codex R1)
    const plan = engineRef.current?.confirmErrorPlan(error, () => void latestConfirm.current(), saver.current?.getState().board);
    if (!plan) return;
    if (plan.kind === "resync") {
      startSaver(plan.board);
      setIntent(intentOf(plan.board));
    }
    if (plan.kind === "refresh") await refresh().catch((e: unknown) => console.error("[compare] 보드 다시 받기 실패", e));
    if (plan.kind === "notice" && plan.unexpected) console.error("[compare] 프로필 확정 실패", error);
    putNotice("confirm", plan.notice);
  };

  /** S-13~S-16 — 저장이 끝난 revision으로만 확정. 연타는 ref로 막는다(AC-17) */
  async function confirm() {
    if (confirmLock.current || removing || !evaluation || !saved || !saver.current) return;
    const availability = engineRef.current!.confirmAvailability(evaluation.draft, saved.status, unchanged);
    if (!availability.ok) return announce(availability.reason);
    confirmLock.current = true;
    setConfirming(true);
    putNotice("confirm", null);
    try {
      const target = saver.current.getState().board;
      // expectedLatest = 보드가 본 계열 최신 (첫 확정 0) — 다른 곳에서 버전이 생겼으면 STALE_PROFILE (DS-2A-04 6.1-4)
      const result = target.confirmed
        ? await repository.createProfileVersion(target.confirmed.profileId, target.revision, target.confirmed.latestVersion ?? target.confirmed.version, "current")
        : await repository.confirmProfile(target.revision, 0);
      engineRef.current!.reportConfirmed(result.version, target.confirmed !== undefined);
      // 지운 조정 수는 저장소 결과로 — 패널을 펼치지 않았어도 프로필 화면이 "조정 M개를 지웠습니다"를 알린다(P-S25 r6)
      navigate(`/profile/${result.profileId}`, result.droppedCount ? { state: { droppedCount: result.droppedCount } } : undefined);
    } catch (error) {
      engineRef.current!.reportConfirmFailed(error);
      await onConfirmError(error);
    } finally {
      confirmLock.current = false;
      setConfirming(false);
    }
  }

  const latestConfirm = useRef(confirm);
  useEffect(() => {
    latestConfirm.current = confirm;
  });

  return {
    phase,
    reload: () => {
      setPhase("loading");
      setAttempt((a) => a + 1);
    },
    board,
    view,
    items: evaluation && engine ? engine.draftItemsView(evaluation.draft, comparison.results) : [],
    checkPrimaryColor: engine?.checkPrimaryColor ?? REJECT_UNTIL_LOADED,
    CustomStyleFields: engine?.CustomStyleFields,
    carryOver,
    warnings: evaluation?.warnings ?? [],
    draftStatus: saved ? draftStatusOf(saved.board, unchanged) : UNCONFIRMED,
    availability: confirming || !engine || !evaluation || !saved ? CONFIRMING : engine.confirmAvailability(evaluation.draft, saved.status, unchanged),
    fonts: engine?.fonts ?? [],
    saveStatus: saved?.status ?? "idle",
    notices,
    announcement,
    undo,
    confirming,
    locked,
    announce,
    toggle,
    pickAll,
    clear,
    undoLast,
    changeCustom,
    applyFix,
    removeColumn,
    confirm,
    retrySave: () => {
      if (saver.current) lastSave.current = saver.current.retry();
    },
  };
}

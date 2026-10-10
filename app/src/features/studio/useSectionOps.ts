import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useProfileRepository } from "../../data/ProfileRepositoryContext";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { ProfileSeries } from "../../domain/profile";
import { applyDocOp, createInstanceIds, loadDocEngine, type DocEngine, type DocOp, type OpResult } from "./docOps";
import { docMotionPreset, docPurpose } from "./docPurpose";
import type { FieldMode, FieldOpen, FieldRec, HistoryKeys, StepTell } from "./opAfter";
import { useUndoStack, type UndoEntry } from "./undoStack";

const PROFILE_UNAVAILABLE = "프로필을 불러오지 못해 목적을 확인할 수 없습니다 — 다시 시도해 주세요";

export type OpOutcome = { readonly ok: true; readonly result: OpResult; readonly before: PageDoc } | { readonly ok: false; readonly reason: string };

export interface SectionOps {
  /** 문서 프로필 계열(목적·모션 파생) — 불러오기 전 undefined */
  readonly series: ProfileSeries | undefined;
  /** 연산 1회(순서대로 하나씩) — 기록 스택에 쌓고 `undoable`이면 알림 줄 "되돌리기" 대상이 된다(Q7) */
  readonly run: (op: DocOp, label: string, undoable?: boolean) => Promise<OpOutcome>;
  /** 알림 줄 "되돌리기"를 보일지 — 바로 앞 연산 뒤로 문서가 바뀌지 않았을 때만(필드 입력·다른 연산·충돌 해결 "최신" 등이면 사라진다) */
  readonly canUndoLast: boolean;
  /** 바로 앞 연산 1개 되돌리기 = 이전 문서(같은 instanceId·값·위치·톤). 되돌린 문서를 돌려준다 */
  readonly undoLast: () => PageDoc | undefined;
  /** 단축키 · "더보기" 실행 취소(false)/다시 실행(true) — 연산과 같은 사슬로 하나씩. 한 기록 = 반환(알림 이름) */
  readonly step: (redo: boolean, tell: StepTell) => Promise<UndoEntry | undefined>;
  /** step이 지금 옮길 기록 이름("더보기" 항목) — 지금 문서와 이어지지 않으면 undefined(step도 아무것도 하지 않는다) */
  readonly peekStep: (redo: boolean) => string | undefined;
  /** 기록이 쥔 문서 — 이미지 참조 집합(SPEC 3.5) · 열린 필드 묶음의 시작 문서와 그 사슬 포함(FIELD-UNDO 4.4) */
  readonly held: readonly PageDoc[];
  /**
   * 필드 글자 입력 1회(FIELD-UNDO 4.1) — 같은 key가 이어지면 한 묶음, 멈춤 600ms·blur(focusout)·다른 key·다른 기록이 닫는다. 편집 경계가 거절하면 기록 0 · false.
   * 이미지 패널 편집(4.5)도 같은 함수 — 클릭은 mode "click"(즉시 1건) · 대체텍스트는 글자와 같다. 닫기·타이머는 조작 뒤 청크(closeField · fieldTyped)
   */
  readonly field: (key: string, label: string, next: PageDoc, composing?: FieldMode) => boolean | void;
}

/**
 * 구조 연산 훅 (K2 · 5.2~5.5 · 5.14). 목적·모션은 **문서 버전**의 프로필 값(docPurpose) — 프로필 조회를 기다린 뒤 연산한다
 * (불러오기 전 "none"으로 추정하지 않는다). 연산은 promise 사슬로 하나씩 — 동적 import 사이에 두 번 눌러도 같은 문서로 두 번 계산하지 않는다.
 */
export function useSectionOps({
  doc,
  edit,
  profileId,
  keys,
}: {
  readonly doc: PageDoc;
  readonly edit: (next: PageDoc) => boolean | void;
  readonly profileId: string;
  /** 단축키 맥락 — 있으면 첫 연산 뒤 조작 뒤 청크가 keydown 리스너를 붙인다(ER-4b) */
  readonly keys?: RefObject<HistoryKeys | undefined>;
}): SectionOps {
  const profiles = useProfileRepository();
  const [series, setSeries] = useState<ProfileSeries>();
  // 조회 1회를 공유한다 — 실패하면 비워 두고 다음 연산이 다시 조회한다(편집기를 오류 경계로 보내지 않는다: 저장·필드 편집은 계속된다)
  const seriesRef = useRef<Promise<ProfileSeries | undefined>>(undefined);
  const loadSeries = useCallback(() => {
    const pending =
      seriesRef.current ??
      profiles.getProfile(profileId).catch((error: unknown) => {
        seriesRef.current = undefined;
        throw error;
      });
    seriesRef.current = pending;
    return pending;
  }, [profiles, profileId]);
  useEffect(() => {
    let cancelled = false;
    loadSeries().then(
      (loaded) => {
        if (!cancelled) setSeries(loaded);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [loadSeries]);

  const docRef = useRef(doc);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);
  const [nextId] = useState(() => createInstanceIds());
  const stack = useUndoStack();
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const [last, setLast] = useState<{ readonly before: PageDoc; readonly after: PageDoc }>();
  const peekStep = useCallback(
    (redo: boolean) => {
      const entry = redo ? stack.peekRedo() : stack.peek();
      return entry && (redo ? entry.before : entry.after) === docRef.current ? entry.label : undefined;
    },
    [stack],
  );
  // 단축키 리스너 — 첫 연산·첫 필드 기록 뒤 1회 붙이고 언마운트 때 뗀다. 언마운트 뒤 끝난 연산은 붙이지 않는다(Codex fix2 P2)
  const unlisten = useRef<() => void>(undefined);
  const mounted = useRef(false);
  // 열린 필드 묶음(타이머·닫기는 조작 뒤 청크 — FIELD-UNDO 8.2). 언마운트 = 묶음 버림(스택도 비워진다)
  const open = useRef<FieldOpen>(undefined);
  // 열린 묶음의 시작 문서(참조 집합용 상태 — 렌더 중 ref를 읽지 않는다). 닫으면 청크가 비운다
  const [hold, setHold] = useState<PageDoc>();
  useEffect(() => {
    const [ref, o] = [unlisten, open];
    mounted.current = true;
    return () => {
      mounted.current = false;
      ref.current?.();
      ref.current = undefined;
      o.current?.off?.();
      o.current = undefined;
    };
  }, []);
  const rec: FieldRec = useMemo(() => ({ open, docRef, stack, edit, hold: setHold }), [stack, edit]);
  const listen = useCallback(
    (e: DocEngine) => {
      if (keys && mounted.current) unlisten.current ??= e.listenHistory(keys);
      return e;
    },
    [keys],
  );

  const step = useCallback(
    (redo: boolean, tell: StepTell) => {
      const next = chain.current.then(async () => {
        const e = await loadDocEngine();
        e.closeField(rec);
        return e.stepHistory(redo, docRef, stack, setLast, edit, tell);
      });
      chain.current = next;
      return next;
    },
    [edit, stack, rec],
  );
  const run = useCallback(
    (op: DocOp, label: string, undoable = false) => {
      const next = chain.current.then(async (): Promise<OpOutcome> => {
        let loaded: ProfileSeries | undefined;
        try {
          loaded = await loadSeries();
        } catch {
          // 목적을 모른 채 "none"으로 연산하지 않는다(예약·문의 필수 섹션 보호) — 유추 문장(REPORT)
          return { ok: false, reason: PROFILE_UNAVAILABLE };
        }
        try {
          // 열린 필드 묶음을 먼저 기록한다 — 기록 순서 = 사용자가 한 순서(FU 2.2)
          (await loadDocEngine()).closeField(rec);
          const before = docRef.current;
          const ctx = { purpose: docPurpose(loaded, before.profileVersion), motionPreset: docMotionPreset(loaded, before.profileVersion), nextInstanceId: nextId };
          const result = await applyDocOp(before, op, ctx);
          // 꼬리(문서 참조·기록 스택·되돌리기 대상·편집 반영)는 연산 청크에 둔다 — 이미 받은 청크라 바로 풀린다(ER-OFF A2)
          return listen(await loadDocEngine()).commitOp(docRef, stack, setLast, edit, label, before, result, undoable);
        } catch (error) {
          // 화면은 can*로 먼저 막는다 — 여기 오는 것은 프로필을 불러오기 전 목적 판정 등. 엔진 이유 문장을 그대로 알린다
          return { ok: false, reason: error instanceof Error ? error.message : String(error) };
        }
      });
      chain.current = next;
      return next;
    },
    [edit, nextId, stack, loadSeries, listen, rec],
  );

  const canUndoLast = last !== undefined && last.after === doc;
  const undoLast = useCallback(() => {
    if (!last || last.after !== docRef.current) return undefined;
    stack.undo();
    docRef.current = last.before;
    setLast(undefined);
    edit(last.before);
    return last.before;
  }, [last, stack, edit]);

  const field = useCallback(
    (key: string, label: string, next: PageDoc, composing?: FieldMode) => {
      const base = docRef.current;
      if (edit(next) === false) return false;
      // 문서 참조는 같은 틱에 — 바로 이은 Ctrl+Z·연산의 동일성 비교가 이 입력을 본다(FU 4.2)
      docRef.current = next;
      const o = (open.current ??= { key, label, base });
      o.after = next;
      setHold(o.base);
      // 다른 칸(재마운트·탭 전환 포함) · 기록 밖 교체 뒤면 청크가 앞 묶음을 닫고 새로 연다 — 청크 응답 전 입력도 순서대로(Codex r1 P2-1 · P2-3)
      void loadDocEngine().then((e) => listen(e).fieldTyped(rec, composing, key, label, base, next));
    },
    [edit, listen, rec],
  );
  // 기록이 바뀌는 곳(연산 · 단축키 · 되돌리기 · 필드)은 모두 edit로 문서도 바꾼다 — 문서 기준으로 다시 계산.
  // 열린 묶음은 시작 문서부터 센다 — 묶음이 닫히기 전(600ms 안)에 이미지가 놓이지 않게(FU 4.4)
  const held = useMemo(() => (hold ? [hold, ...stack.reachable(hold)] : stack.reachable(doc)), [stack, doc, hold]);

  return { series, run, canUndoLast, undoLast, step, peekStep, held, field };
}

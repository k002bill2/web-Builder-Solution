import { useCallback, useEffect, useRef, useState } from "react";
import { useProfileRepository } from "../../data/ProfileRepositoryContext";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { ProfileSeries } from "../../domain/profile";
import { applyDocOp, createInstanceIds, type DocOp, type OpResult } from "./docOps";
import { docMotionPreset, docPurpose } from "./docPurpose";
import { useUndoStack } from "./undoStack";

export type OpOutcome = { readonly ok: true; readonly result: OpResult; readonly before: PageDoc } | { readonly ok: false; readonly reason: string };

export interface SectionOps {
  /** 문서 프로필 계열(목적·모션 파생) — 불러오기 전 undefined */
  readonly series: ProfileSeries | undefined;
  /** 연산 1회(순서대로 하나씩) — 기록 스택에 쌓고 `undoable`이면 알림 줄 "되돌리기" 대상이 된다(Q7) */
  readonly run: (op: DocOp, label: string, undoable?: boolean) => Promise<OpOutcome>;
  /** 알림 줄 "되돌리기"를 보일지 — 바로 앞 연산 뒤로 문서가 바뀌지 않았을 때만(필드 입력·다른 연산·충돌 해결이면 사라진다) */
  readonly canUndoLast: boolean;
  /** 바로 앞 연산 1개 되돌리기 = 이전 문서(같은 instanceId·값·위치·톤). 되돌린 문서를 돌려준다 */
  readonly undoLast: () => PageDoc | undefined;
}

/**
 * 구조 연산 훅 (K2 · 5.2~5.5 · 5.14). 목적·모션은 **문서 버전**의 프로필 값(docPurpose) — 프로필 조회를 기다린 뒤 연산한다
 * (불러오기 전 "none"으로 추정하지 않는다). 연산은 promise 사슬로 하나씩 — 동적 import 사이에 두 번 눌러도 같은 문서로 두 번 계산하지 않는다.
 */
export function useSectionOps({ doc, edit, profileId }: { readonly doc: PageDoc; readonly edit: (next: PageDoc) => void; readonly profileId: string }): SectionOps {
  const profiles = useProfileRepository();
  const [series, setSeries] = useState<ProfileSeries>();
  const seriesRef = useRef<Promise<ProfileSeries | undefined>>(undefined);
  useEffect(() => {
    let cancelled = false;
    const pending = profiles.getProfile(profileId);
    seriesRef.current = pending;
    pending.then(
      (loaded) => {
        if (!cancelled) setSeries(loaded);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [profiles, profileId]);

  const docRef = useRef(doc);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);
  const [nextId] = useState(() => createInstanceIds());
  const stack = useUndoStack();
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const [last, setLast] = useState<{ readonly before: PageDoc; readonly after: PageDoc }>();

  const run = useCallback(
    (op: DocOp, label: string, undoable = false) => {
      const next = chain.current.then(async (): Promise<OpOutcome> => {
        const loaded = await (seriesRef.current ?? Promise.resolve(undefined));
        const before = docRef.current;
        const ctx = { purpose: docPurpose(loaded, before.profileVersion), motionPreset: docMotionPreset(loaded, before.profileVersion), nextInstanceId: nextId };
        try {
          const result = await applyDocOp(before, op, ctx);
          docRef.current = result.doc;
          stack.push({ label, before, after: result.doc });
          setLast(undoable ? { before, after: result.doc } : undefined);
          edit(result.doc);
          return { ok: true, result, before };
        } catch (error) {
          // 화면은 can*로 먼저 막는다 — 여기 오는 것은 프로필을 불러오기 전 목적 판정 등. 엔진 이유 문장을 그대로 알린다
          return { ok: false, reason: error instanceof Error ? error.message : String(error) };
        }
      });
      chain.current = next;
      return next;
    },
    [edit, nextId, stack],
  );

  const canUndoLast = last !== undefined && last.after === doc;
  const undoLast = useCallback(() => {
    if (!last || last.after !== docRef.current) return undefined;
    stack.pop();
    docRef.current = last.before;
    setLast(undefined);
    edit(last.before);
    return last.before;
  }, [last, stack, edit]);

  return { series, run, canUndoLast, undoLast };
}

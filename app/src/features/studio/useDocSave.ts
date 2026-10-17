/**
 * 편집 문서 자동 저장 훅 (DS-2A-05 SPEC 5.10 · E-S06~E-S10 · E-AC-07). 타이밍·실패·오프라인·STALE 멈춤·떠나기 경고는
 * a1-α `useAutosaveScheduler`를 그대로 쓰고, 이 훅은 저장 코어 연결만 한다(INTEGRATE-6 2.2-2 · RS6-L3b CP-A — 코어 없는 saveDoc 경로 제거):
 * - 저장 = `core.save()`(코어 초안 · revision·hash는 코어 io) — 결과 reason으로 판정(readonly·unsupported = 이 탭 저장 0이 정상).
 * - 화면 문서는 늘 내 편집이다. 다른 탭 커밋(포트 stale)은 I6 8.1 `stale` 환경 행(failed + 출처 reason) — 충돌 영역·최신 문서 읽기 0(RS6-L4 R2).
 * - `resolve(choice)` = 저장소 `resolveConflict`(보존 스냅샷 + 저장 한 트랜잭션, 8.3) 1회 → 성공이면 스케줄러 `settle`(추가 저장 0).
 *   "다른 편집 불러오기"는 돌려받은 최신 문서를 화면 문서로. 거부는 그대로 돌려주고 STALE을 유지한다(고르기 전 자동 저장 0).
 * - `flushed()` = 저장 먼저(ER SPEC r1 3.2 · 5.13 순서) — 진행 중 저장을 기다리고 저장 전 변경을 바로 저장. 저장됨이면 true, 실패·충돌·오프라인이면 false.
 * - `adopt(write)` = 저장소 revision을 올리는 쓰기(스냅샷 복원)를 저장 훅 경로로 — 저장 먼저 → `write(저장 revision)` 1회 →
 *   돌려받은 문서·revision·스케줄러(`settle`, 추가 저장 0)를 함께 갱신. 저장하지 못했으면 쓰기 0 · undefined.
 * - `leave()` = 앱 안 이동 전(MQ-6-7 A · INTEGRATE-6 3.1-3) — 판정 순서 ① 오프라인 ② STALE ③ 실패(읽기 전용·잠금 없음 외) = 보류:
 *   지금 저장 1회 하고 `flushed()` 결과(이번 이탈 중 저장이 읽기 전용 거절이면 true — 지난 거절은 쓰지 않는다, Codex r1·r2 P1).
 *   ④ 그 밖 = undefined(바로 이동) · 저장할 것이 있으면 지금 1회 낸다(기다리지 않음 — 코어가 탭 수명으로 끝낸다).
 * - lease 해제(진짜 언마운트 — 링크·POP·재마운트 공통, 3.1-1): 마지막 제출 뒤 편집이 있으면 `core.save()` 1회(기다리지 않음).
 */
import { useCallback, useEffect, useId, useReducer, useRef, useState } from "react";
import { ProjectRepositoryError, type ConflictChoice, type ProjectPersistence } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { useAutosaveScheduler, type AutosaveState } from "./useAutosaveScheduler";
import type { SaveSource } from "./saveStatusText";
import type { SaveCore } from "./save/saveCore";

/** 저장소 중 이 훅이 쓰는 부분(ProjectRepository<PageDoc>의 부분 구조) */
export interface DocSaveRepository {
  readonly persistence: ProjectPersistence;
  resolveConflict(projectId: string, choice: ConflictChoice, myDoc: PageDoc): Promise<PageDoc>;
  /** 저장 코어 레지스트리(INTEGRATE-6 2.2-2) — seed·편집·저장이 코어 경유 */
  readonly core: (projectId: string, seed: PageDoc) => SaveCore;
}

export interface UseDocSaveOptions {
  readonly repository: DocSaveRepository;
  readonly projectId: string;
  readonly initialDoc: PageDoc;
  readonly debounceMs?: number;
  readonly maxWaitMs?: number;
}

/** 충돌 영역(스케줄러 stale 단계) — RS6-L4 R2 뒤 제품 도달 경로 0(REPORT 도달 경로 표) · 최신 문서 결선은 감량 1회로 뺐다 */
export type DocConflict = Readonly<Record<string, never>>;

export interface UseDocSave {
  readonly doc: PageDoc;
  readonly state: AutosaveState;
  readonly persistence: ProjectPersistence;
  /** STALE_DOC일 때만 */
  readonly conflict?: DocConflict;
  readonly edit: (next: PageDoc) => void;
  /** 돌려주는 값 = 재시도 직후 단계(스케줄러) — effect에서 그대로 return하지 않는다 */
  readonly retry: () => AutosaveState["phase"] | undefined;
  /** 저장소에 저장된 마지막 revision(내보내기 요청 revision — 5.13 "저장 먼저" 뒤에 읽는다) */
  readonly savedRevision: () => number;
  readonly resolve: (choice: ConflictChoice) => Promise<void>;
  readonly flushed: () => Promise<boolean>;
  readonly adopt: (write: (revision: number) => Promise<PageDoc>) => Promise<PageDoc | undefined>;
  readonly leave: () => Promise<boolean> | undefined;
  /** 상태 판정 출처(INTEGRATE-6 8.1 · RS6-L4 CP1) — 코어 view(inflight·dirty) + 마지막 저장 결과 reason(성공이면 없음) */
  readonly source: SaveSource;
  readonly core: SaveCore;
  /** "저장 확인" 결과 → 출처(SaveActions가 부른다) */
  readonly report: (next?: { readonly reason: string; readonly text?: string }) => void;
}

export function useDocSave({ repository, projectId, initialDoc, debounceMs, maxWaitMs }: UseDocSaveOptions): UseDocSave {
  // 코어 = 탭 수명(레지스트리 동기 생성 · 같은 projectId 재마운트 = 같은 코어) — seed = 코어 초안(G7)
  const [core] = useState(() => repository.core(projectId, initialDoc));
  const [doc, setDoc] = useState(() => core.view().doc);
  const docRef = useRef(doc);
  const revisionRef = useRef(initialDoc.revision);
  /** 이번 이탈 중 저장이 읽기 전용 탭 거절(P1C-SPEC 1.5 — 다른 탭 잠금 · Web Locks 없는 로컬 폴백)을 받았나 — `leave()`가 지우고 저장마다 새로 정한다(Codex r2 P1) */
  const readOnly = useRef(false);
  /** 마지막으로 코어 save에 실은 mark — lease 해제 save는 그 뒤 편집이 있을 때만(3.1-1 · U7 최대 1회) */
  const submitted = useRef(core.view().dirty ? 0 : core.view().mark);

  const [reason, setReason] = useState<{ readonly reason: string; readonly text?: string }>();
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  const save = useCallback(async () => {
    // 저장 대상 = 코어 초안(G1 — DocBook 반영은 saved 뒤 코어가 · 실패면 DocBook 변화 0, U3). not-persistent(memory) = 메모리 커밋 성공(I5)
    submitted.current = core.view().mark;
    const result = await core.save();
    const { reason } = result as { readonly reason?: string };
    // 저장됨 = saved 또는 not-persistent(memory 메모리 커밋 revision)뿐 — 다른 failed가 revision을 실어도 저장됨 아님(L3a QA 4절 2)
    const saved = result.status === "saved" ? result.receipt.revision : reason === "not-persistent" ? result.revision : undefined;
    // readonly·unsupported = 이 탭 저장 0이 정상(이탈 허용 판정)
    readOnly.current = reason === "readonly" || reason === "unsupported";
    // 실패 reason 문구 = 조작 뒤 청크(io 이미 받음) — 받지 못하면 ★"저장하지 못했습니다"
    setReason(saved === undefined ? { reason: String(reason), text: await core.link((io) => io.text(String(reason))).catch(() => undefined) } : undefined);
    // 다른 탭 stale(포트 mode·다른 탭 커밋) = I6 8.1 `stale` 환경 행(failed + "버리고 새로고침") — 충돌 영역(STALE_DOC)으로 보내지 않는다(RS6-L4 R2)
    if (saved === undefined) throw new ProjectRepositoryError("INFRA", String(reason));
    revisionRef.current = saved;
  }, [core]);

  const autosave = useAutosaveScheduler<PageDoc>({ save, persistence: repository.persistence, debounceMs, maxWaitMs });
  const { change, settle } = autosave;
  // 스케줄러 단계를 동기로 따라간다 — 같은 흐름에서 edit 직후 flushed()·adopt()가 effect 전 단계(idle·saved)를 보고 저장 없이 끝나지 않게(Codex r1 P2).
  // 규칙은 스케줄러 change()와 같다: idle·saved → dirty, 그 밖(저장 중·실패 등)은 그대로
  const phase = useRef<AutosaveState["phase"]>("idle");
  const edit = useCallback(
    (next: PageDoc) => {
      docRef.current = next;
      // G2: 편집마다 코어 초안 동기 1회 — 디바운스는 저장 시점만 정한다(언마운트 뒤에도 초안 보존, F9)
      core.edit(next);
      setDoc(next);
      change(next);
      if (phase.current === "idle" || phase.current === "saved") phase.current = "dirty";
    },
    [change, core],
  );

  // lease(G7 · U6) — commit 단계 acquire · 진짜 언마운트일 때만 release(StrictMode 재마운트는 같은 commit에서 다시 acquire → 같은 토큰)
  const mountId = useId();
  const lease = useRef<number>(undefined);
  useEffect(() => {
    const token = (lease.current = core.acquire(mountId));
    // 재진입 seed가 미저장 초안이면(F9 뒤) 다시 저장 차례에 올린다 — 코어 기준이라 거짓 STALE 0(C5 T2)
    const { dirty, doc, inflight } = core.view();
    if (dirty) change(doc);
    // POP 재진입(C5 T1) — 앞 해제 save가 진행 중이면 상태 글자 = 저장 중(출처 inflight) · 끝나면 다시 그린다
    if (inflight) void core.idle().then(redraw);
    return () => {
      lease.current = undefined;
      queueMicrotask(() => {
        if (lease.current !== undefined) return;
        // 3.1-1 lease 해제 save — 결과를 기다리지 않는다(실패는 /projects 행·탭 경고 몫)
        if (core.view().mark > submitted.current) void core.save().catch(() => undefined);
        core.release(token);
      });
    };
  }, [core, mountId, change, redraw]);

  const resolve = useCallback(
    async (choice: ConflictChoice) => {
      const mine = docRef.current;
      const resolved = await repository.resolveConflict(projectId, choice, { ...mine, hash: hashDoc(mine) });
      revisionRef.current = resolved.revision;
      if (choice === "theirs") {
        docRef.current = resolved;
        setDoc(resolved);
      }
      settle();
      // 해결 요청 중에 생긴 내 편집은 다시 미저장으로 둔다("내 편집으로 저장"만 — 불러오기는 최신으로 바꿨다)
      if (choice === "mine" && docRef.current !== mine) change(docRef.current);
    },
    [repository, projectId, settle, change],
  );

  // 저장 먼저 기다리는 쪽 — 렌더마다 상태를 보고 저장 중이면 기다리고, 저장 전 변경이면 바로 저장, 그 밖이면 결과를 돌려준다
  const { retry } = autosave;
  const current = autosave.state.phase;
  const waiters = useRef<((ok: boolean) => void)[]>([]);
  const check = useCallback(() => {
    const now = phase.current;
    if (!waiters.current.length || now === "saving") return;
    if (now === "dirty") return retry();
    for (const done of waiters.current.splice(0)) done(now === "idle" || now === "saved");
  }, [retry]);
  useEffect(() => {
    phase.current = current;
    check();
  });
  const flushed = useCallback(() => new Promise<boolean>((done) => (waiters.current.push(done), check())), [check]);
  const adopt = useCallback(
    async (write: (revision: number) => Promise<PageDoc>) => {
      if (!(await flushed())) return undefined;
      const next = await write(revisionRef.current);
      revisionRef.current = next.revision;
      docRef.current = next;
      setDoc(next);
      settle();
      return next;
    },
    [flushed, settle],
  );

  const leave = useCallback(() => {
    const now = phase.current;
    if (now === "idle" || now === "saved") return undefined;
    // ④ 이동 — 지금 저장 1회(저장 중이면 해제 save가 뒤를 잇는다) · 기다리지 않는다
    if (navigator.onLine && now !== "stale" && (now !== "failed" || readOnly.current)) return void retry();
    readOnly.current = false;
    phase.current = retry() ?? phase.current;
    return flushed().then((ok) => ok || readOnly.current);
  }, [retry, flushed]);

  /** 확인 결과 → 출처(SaveActions · 조작 뒤) — 성공이면 reason 지우고 스케줄러 settle(추가 저장 0) */
  const report = useCallback((next?: { readonly reason: string; readonly text?: string }) => (setReason(next), next || settle()), [settle]);

  const conflict = autosave.state.phase === "stale" ? {} : undefined;
  const savedRevision = useCallback(() => revisionRef.current, []);
  const { inflight, dirty } = core.view();
  const source = { ...reason, inflight, dirty };
  return { doc, state: autosave.state, persistence: repository.persistence, conflict, edit, retry, savedRevision, resolve, flushed, adopt, leave, source, core, report };
}

/**
 * 편집 문서 자동 저장 훅 (DS-2A-05 SPEC 5.10 · E-S06~E-S10 · E-AC-07). 타이밍·실패·오프라인·STALE 멈춤·떠나기 경고는
 * a1-α `useAutosaveScheduler`를 그대로 쓰고, 이 훅은 저장소 연결만 한다:
 * - 저장 요청 = 문서 전체 + `expectedRevision`(마지막으로 저장소가 돌려준 revision) + `hashDoc` 해시(멱등 키 (revision, hash), 8.3).
 * - 화면 문서는 늘 내 편집이다 — `STALE_DOC`이어도 바꾸지 않고 최신 문서만 `conflict.latest`로 따로 둔다(E-S09).
 * - `resolve(choice)` = 저장소 `resolveConflict`(보존 스냅샷 + 저장 한 트랜잭션, 8.3) 1회 → 성공이면 스케줄러 `settle`(추가 저장 0).
 *   "다른 편집 불러오기"는 돌려받은 최신 문서를 화면 문서로. 거부는 그대로 돌려주고 STALE을 유지한다(고르기 전 자동 저장 0).
 * - `flushed()` = 저장 먼저(ER SPEC r1 3.2 · 5.13 순서) — 진행 중 저장을 기다리고 저장 전 변경을 바로 저장. 저장됨이면 true, 실패·충돌·오프라인이면 false.
 * - `adopt(write)` = 저장소 revision을 올리는 쓰기(스냅샷 복원)를 저장 훅 경로로 — 저장 먼저 → `write(저장 revision)` 1회 →
 *   돌려받은 문서·revision·스케줄러(`settle`, 추가 저장 0)를 함께 갱신. 저장하지 못했으면 쓰기 0 · undefined.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { projectErrorCode, type ConflictChoice, type DocHead, type ProjectPersistence } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { useAutosaveScheduler, type AutosaveState } from "./useAutosaveScheduler";

/** 저장소 중 이 훅이 쓰는 부분(ProjectRepository<PageDoc>의 부분 구조) */
export interface DocSaveRepository {
  readonly persistence: ProjectPersistence;
  saveDoc(projectId: string, expectedRevision: number, doc: PageDoc): Promise<DocHead>;
  resolveConflict(projectId: string, choice: ConflictChoice, myDoc: PageDoc): Promise<PageDoc>;
}

export interface UseDocSaveOptions {
  readonly repository: DocSaveRepository;
  readonly projectId: string;
  readonly initialDoc: PageDoc;
  readonly debounceMs?: number;
  readonly maxWaitMs?: number;
}

export interface DocConflict {
  /** STALE_DOC에 동봉된 최신 문서(없으면 undefined) */
  readonly latest?: PageDoc;
}

export interface UseDocSave {
  readonly doc: PageDoc;
  readonly state: AutosaveState;
  readonly persistence: ProjectPersistence;
  /** STALE_DOC일 때만 */
  readonly conflict?: DocConflict;
  readonly edit: (next: PageDoc) => void;
  readonly retry: () => void;
  /** 저장소에 저장된 마지막 revision(내보내기 요청 revision — 5.13 "저장 먼저" 뒤에 읽는다) */
  readonly savedRevision: () => number;
  readonly resolve: (choice: ConflictChoice) => Promise<void>;
  readonly flushed: () => Promise<boolean>;
  readonly adopt: (write: (revision: number) => Promise<PageDoc>) => Promise<PageDoc | undefined>;
}

export function useDocSave({ repository, projectId, initialDoc, debounceMs, maxWaitMs }: UseDocSaveOptions): UseDocSave {
  const [doc, setDoc] = useState(initialDoc);
  const docRef = useRef(initialDoc);
  const [latest, setLatest] = useState<PageDoc | undefined>(undefined);
  const revisionRef = useRef(initialDoc.revision);

  const save = useCallback(
    async (next: PageDoc) => {
      const revision = revisionRef.current;
      try {
        const saved = await repository.saveDoc(projectId, revision, { ...next, revision, hash: hashDoc(next) });
        revisionRef.current = saved.revision;
      } catch (error) {
        if (projectErrorCode(error) === "STALE_DOC") setLatest((error as { readonly doc?: PageDoc }).doc);
        throw error;
      }
    },
    [repository, projectId],
  );

  const autosave = useAutosaveScheduler<PageDoc>({ save, persistence: repository.persistence, debounceMs, maxWaitMs });
  const { change, settle } = autosave;
  const edit = useCallback(
    (next: PageDoc) => {
      docRef.current = next;
      setDoc(next);
      change(next);
    },
    [change],
  );

  const resolve = useCallback(
    async (choice: ConflictChoice) => {
      const mine = docRef.current;
      const resolved = await repository.resolveConflict(projectId, choice, { ...mine, hash: hashDoc(mine) });
      revisionRef.current = resolved.revision;
      setLatest(undefined);
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
  const phase = useRef(current);
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

  const conflict = autosave.state.phase === "stale" ? { latest } : undefined;
  const savedRevision = useCallback(() => revisionRef.current, []);
  return { doc, state: autosave.state, persistence: repository.persistence, conflict, edit, retry, savedRevision, resolve, flushed, adopt };
}

/**
 * 편집 문서 자동 저장 훅 (DS-2A-05 SPEC 5.10 · E-S06~E-S10 · E-AC-07). 타이밍·실패·오프라인·STALE 멈춤·떠나기 경고는
 * a1-α `useAutosaveScheduler`를 그대로 쓰고, 이 훅은 저장소 연결만 한다:
 * - 저장 요청 = 문서 전체 + `expectedRevision`(마지막으로 저장소가 돌려준 revision) + `hashDoc` 해시(멱등 키 (revision, hash), 8.3).
 * - 화면 문서는 늘 내 편집이다 — `STALE_DOC`이어도 바꾸지 않고 최신 문서만 `conflict.latest`로 따로 둔다(E-S09).
 */
import { useCallback, useRef, useState } from "react";
import { projectErrorCode, type DocHead, type ProjectPersistence } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { useAutosaveScheduler, type AutosaveState } from "./useAutosaveScheduler";

/** 저장소 중 이 훅이 쓰는 부분(ProjectRepository<PageDoc>의 부분 구조) */
export interface DocSaveRepository {
  readonly persistence: ProjectPersistence;
  saveDoc(projectId: string, expectedRevision: number, doc: PageDoc): Promise<DocHead>;
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
}

export function useDocSave({ repository, projectId, initialDoc, debounceMs, maxWaitMs }: UseDocSaveOptions): UseDocSave {
  const [doc, setDoc] = useState(initialDoc);
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
  const { change } = autosave;
  const edit = useCallback(
    (next: PageDoc) => {
      setDoc(next);
      change(next);
    },
    [change],
  );

  const conflict = autosave.state.phase === "stale" ? { latest } : undefined;
  return { doc, state: autosave.state, persistence: repository.persistence, conflict, edit, retry: autosave.retry };
}

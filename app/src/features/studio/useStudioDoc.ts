import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import type { Project, StudioEntryState } from "../../data/projectRepository";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { useProjectRepository } from "../projects/useProjectRepository";

export type StudioEntry =
  | { readonly status: "loading" }
  | { readonly status: "missing" }
  | { readonly status: "ready"; readonly project: Project; readonly doc: PageDoc | undefined };

/** `/studio/:projectId` 프로젝트 + 편집 문서 조회 (E-S01~E-S05). 실패는 오류 경계로(E-S04) */
export function useStudioDoc(projectId: string): StudioEntry {
  const repository = useProjectRepository();
  const fail = useThrowToBoundary();
  const [entry, setEntry] = useState<StudioEntry>({ status: "loading" });
  useEffect(() => {
    if (!repository) return;
    let cancelled = false;
    Promise.all([repository.getProject(projectId), repository.getDoc(projectId)]).then(
      ([project, doc]) => {
        // 저장소 문서는 엔진이 만든 것만 있다(startDoc = createDocFromCandidate · saveDoc = validatePageDoc 통과) — 계약상 PageDoc
        if (!cancelled) setEntry(project ? { status: "ready", project, doc: doc as PageDoc | undefined } : { status: "missing" });
      },
      (error: unknown) => {
        if (!cancelled) fail(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, projectId, fail]);
  return entry;
}

const isEntryState = (value: unknown): value is StudioEntryState =>
  typeof value === "object" && value !== null && ("editNotice" in value || "changes" in value);

/**
 * "편집 시작" 이동 state(12.3 · 8.3.1)를 마운트 때 1회만 읽는다 — 다시 그려도 같은 값, 다시 열기(state 없음)에는 undefined.
 * 새로고침·뒤로 가기로 같은 기록에 돌아와도 다시 알리지 않게 브라우저 기록의 `usr`만 비운다(key·idx 유지).
 * `navigate(현재 경로, { replace })`는 쓰지 않는다 — 라우터 이동과 경쟁한다(editor-a2-data REPORT 9절 C6).
 */
export function useEntryState(): StudioEntryState | undefined {
  const location = useLocation();
  const [entry] = useState(() => (isEntryState(location.state) ? location.state : undefined));
  useEffect(() => {
    if (!entry) return;
    const current: unknown = window.history.state;
    if (typeof current === "object" && current !== null && "usr" in current) window.history.replaceState({ ...current, usr: null }, "");
  }, [entry]);
  return entry;
}

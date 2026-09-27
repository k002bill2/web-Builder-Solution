import { lazy, Suspense } from "react";
import { useParams } from "react-router";
import { LoadingState } from "../components/layout/LoadingState";
import { StudioNoDoc, StudioProjectNotFound } from "../components/studio/StudioEmptyStates";
import type { StudioEntryState } from "../data/projectRepository";
import { useEntryState, useStudioDoc } from "../features/studio/useStudioDoc";

/**
 * 편집 틀(배치·필드·자동 저장)은 문서가 있을 때 자동으로 받는 진입 직후 청크(`scripts/check-bundle-size.mjs` studio auto) —
 * 첫 화면(`/studio` ≤ 99.40KB)에는 조회·빈 상태만 둔다.
 */
const loadLayout = () => import("../components/studio/StudioLayout").then((m) => ({ default: m.StudioLayout }));
const StudioLayout = lazy(loadLayout);

/** `/studio/:projectId` 집중 모드 (E-S01~E-S05). 문서 있음 = 편집 틀, 없음 = E-S03 */
/**
 * 접힌 알림 요약의 N = 원문(8.2.1 (a) "구조안의 섹션 N개를 …")의 바뀐 섹션 수 — `changes`는 같은 쌍을 한 번만 적어 더 적을 수 있다(Codex r1 P2).
 * 바뀐 쌍이 없으면 0(접지 않음 — DOC_EXISTS 등).
 */
const changedSections = (state: StudioEntryState | undefined): number =>
  state?.changes?.length ? Number(/섹션 (\d+)개/.exec(state.editNotice ?? "")?.[1] ?? state.changes.length) : 0;

export function StudioPage() {
  const { projectId = "" } = useParams();
  const entry = useStudioDoc(projectId);
  // 이동 state는 로딩 전에 1회 읽는다(로딩 → 준비 사이 다시 그려져도 같은 값)
  const entryState = useEntryState();
  if (entry.status === "loading") return <LoadingState />;
  if (entry.status === "missing") return <StudioProjectNotFound />;
  if (!entry.doc) return <StudioNoDoc projectName={entry.project.name} profileId={entry.project.profileId} />;
  return (
    <Suspense fallback={<LoadingState />}>
      <StudioLayout
        key={projectId}
        project={entry.project}
        doc={entry.doc}
        repository={entry.repository}
        entryNotice={entryState?.editNotice}
        entryChanges={changedSections(entryState)}
        focusHeading={entryState !== undefined}
      />
    </Suspense>
  );
}

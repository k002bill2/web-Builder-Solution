import { lazy, Suspense } from "react";
import { useParams } from "react-router";
import { LoadingState } from "../components/layout/LoadingState";
import { StudioNoDoc, StudioProjectNotFound } from "../components/studio/StudioEmptyStates";
import { useEntryState, useStudioDoc } from "../features/studio/useStudioDoc";

/**
 * 편집 틀(배치·필드·자동 저장)은 문서가 있을 때 자동으로 받는 진입 직후 청크(`scripts/check-bundle-size.mjs` studio auto) —
 * 첫 화면(`/studio` ≤ 99.40KB)에는 조회·빈 상태만 둔다.
 */
const loadLayout = () => import("../components/studio/StudioLayout").then((m) => ({ default: m.StudioLayout }));
const StudioLayout = lazy(loadLayout);

/** `/studio/:projectId` 집중 모드 (E-S01~E-S05). 문서 있음 = 편집 틀, 없음 = E-S03 */
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
        focusHeading={entryState !== undefined}
      />
    </Suspense>
  );
}

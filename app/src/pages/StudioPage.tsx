import { useParams } from "react-router";
import { LoadingState } from "../components/layout/LoadingState";
import { StudioNoDoc, StudioProjectNotFound } from "../components/studio/StudioEmptyStates";
import { StudioLayout } from "../components/studio/StudioLayout";
import { useEntryState, useStudioDoc } from "../features/studio/useStudioDoc";

/** `/studio/:projectId` 집중 모드 (E-S01~E-S05). 문서 있음 = 편집 틀, 없음 = E-S03 */
export function StudioPage() {
  const { projectId = "" } = useParams();
  const entry = useStudioDoc(projectId);
  // 이동 state는 로딩 전에 1회 읽는다(로딩 → 준비 사이 다시 그려져도 같은 값)
  const entryState = useEntryState();
  if (entry.status === "loading") return <LoadingState />;
  if (entry.status === "missing") return <StudioProjectNotFound />;
  if (!entry.doc) return <StudioNoDoc projectName={entry.project.name} profileId={entry.project.profileId} />;
  return <StudioLayout project={entry.project} doc={entry.doc} entryNotice={entryState?.editNotice} focusHeading={entryState !== undefined} />;
}

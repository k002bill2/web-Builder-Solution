import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { LoadingState } from "../components/layout/LoadingState";
import { StudioNoDoc, StudioProjectNotFound } from "../components/studio/StudioEmptyStates";
import type { Project } from "../data/projectRepository";
import { useThrowToBoundary } from "../data/useThrowToBoundary";
import { useProjectRepository } from "../features/projects/useProjectRepository";

type Entry = { readonly status: "loading" } | { readonly status: "missing" } | { readonly status: "ready"; readonly project: Project; readonly hasDoc: boolean };

/** `/studio/:projectId` 집중 모드 셸 (E-S01~E-S04). 편집기 틀(E-S05~)은 2a-05a2 */
export function StudioPage() {
  const { projectId = "" } = useParams();
  const repository = useProjectRepository();
  const fail = useThrowToBoundary();
  const [entry, setEntry] = useState<Entry>({ status: "loading" });
  useEffect(() => {
    if (!repository) return;
    let cancelled = false;
    Promise.all([repository.getProject(projectId), repository.getDoc(projectId)]).then(
      ([project, doc]) => {
        if (!cancelled) setEntry(project ? { status: "ready", project, hasDoc: doc !== undefined } : { status: "missing" });
      },
      (error: unknown) => {
        if (!cancelled) fail(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, projectId, fail]);
  if (entry.status === "loading") return <LoadingState />;
  if (entry.status === "missing") return <StudioProjectNotFound />;
  return <StudioNoDoc projectName={entry.project.name} profileId={entry.project.profileId} />;
}

import type { ReactNode } from "react";
import type { CompareBoardRepository } from "../data/compareBoardRepository";
import { ReferenceRepositoryProvider } from "../data/ReferenceRepositoryContext";
import type { ReferenceRepository } from "../data/referenceRepository";
import { CompareTrayProvider } from "../features/compare/CompareTrayContext";
import { SavedReferencesProvider } from "../features/saved/SavedReferencesContext";

export function AppProviders({
  repository,
  boardRepository,
  children,
}: {
  readonly repository: ReferenceRepository;
  readonly boardRepository: CompareBoardRepository;
  readonly children: ReactNode;
}) {
  return (
    <ReferenceRepositoryProvider repository={repository}>
      <SavedReferencesProvider>
        <CompareTrayProvider repository={boardRepository}>{children}</CompareTrayProvider>
      </SavedReferencesProvider>
    </ReferenceRepositoryProvider>
  );
}

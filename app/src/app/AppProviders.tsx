import type { ReactNode } from "react";
import { ReferenceRepositoryProvider } from "../data/ReferenceRepositoryContext";
import type { ReferenceRepository } from "../data/referenceRepository";
import { CompareTrayProvider } from "../features/compare/CompareTrayContext";
import { SavedReferencesProvider } from "../features/saved/SavedReferencesContext";

export function AppProviders({
  repository,
  children,
}: {
  readonly repository: ReferenceRepository;
  readonly children: ReactNode;
}) {
  return (
    <ReferenceRepositoryProvider repository={repository}>
      <SavedReferencesProvider>
        <CompareTrayProvider>{children}</CompareTrayProvider>
      </SavedReferencesProvider>
    </ReferenceRepositoryProvider>
  );
}

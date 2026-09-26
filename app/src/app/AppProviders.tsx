import type { ReactNode } from "react";
import type { CompareBoardRepository } from "../data/compareBoardRepository";
import { ProfileRepositoryProvider } from "../data/ProfileRepositoryContext";
import type { ProfileReadRepository } from "../data/profileRepository";
import { ReferenceRepositoryProvider } from "../data/ReferenceRepositoryContext";
import type { ReferenceRepository } from "../data/referenceRepository";
import { CompareTrayProvider } from "../features/compare/CompareTrayContext";
import { SavedReferencesProvider } from "../features/saved/SavedReferencesContext";

export function AppProviders({
  repository,
  boardRepository,
  profileRepository,
  children,
}: {
  readonly repository: ReferenceRepository;
  readonly boardRepository: CompareBoardRepository;
  readonly profileRepository: ProfileReadRepository;
  readonly children: ReactNode;
}) {
  return (
    <ReferenceRepositoryProvider repository={repository}>
      <SavedReferencesProvider>
        <CompareTrayProvider repository={boardRepository}>
          <ProfileRepositoryProvider repository={profileRepository}>{children}</ProfileRepositoryProvider>
        </CompareTrayProvider>
      </SavedReferencesProvider>
    </ReferenceRepositoryProvider>
  );
}

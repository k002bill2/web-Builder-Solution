import type { ReactNode } from "react";
import type { CompareBoardRepository } from "../data/compareBoardRepository";
import { ProfileRepositoryProvider, type GenerationLoader } from "../data/ProfileRepositoryContext";
import type { ProfileRepository } from "../data/profileRepository";
import { ReferenceRepositoryProvider } from "../data/ReferenceRepositoryContext";
import type { ReferenceRepository } from "../data/referenceRepository";
import { CompareTrayProvider } from "../features/compare/CompareTrayContext";
import { SavedReferencesProvider } from "../features/saved/SavedReferencesContext";

export function AppProviders({
  repository,
  boardRepository,
  profileRepository,
  generations,
  children,
}: {
  readonly repository: ReferenceRepository;
  readonly boardRepository: CompareBoardRepository;
  readonly profileRepository: ProfileRepository;
  readonly generations: GenerationLoader;
  readonly children: ReactNode;
}) {
  return (
    <ReferenceRepositoryProvider repository={repository}>
      <SavedReferencesProvider>
        <CompareTrayProvider repository={boardRepository}>
          <ProfileRepositoryProvider repository={profileRepository} generations={generations}>{children}</ProfileRepositoryProvider>
        </CompareTrayProvider>
      </SavedReferencesProvider>
    </ReferenceRepositoryProvider>
  );
}

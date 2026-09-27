import { createContext, useContext, type ReactNode } from "react";
import type { GenerationRepository } from "./generationRepository";
import type { ProfileRepository } from "./profileRepository";

/** 생성 저장소는 로더 핸들로만 넘긴다 — 메서드 위임 래퍼를 공통 청크에 두지 않는다(2a-04c 번들, 2a-05 S-B3 방식) */
export type GenerationLoader = () => Promise<GenerationRepository>;

const ProfileContext = createContext<{ readonly repository: ProfileRepository; readonly generations: GenerationLoader } | null>(null);

/** 프로필 저장소 + 3안 생성 저장소 로더 (DS-2A-04 6.3) */
export function ProfileRepositoryProvider({
  repository,
  generations,
  children,
}: {
  readonly repository: ProfileRepository;
  readonly generations: GenerationLoader;
  readonly children: ReactNode;
}) {
  return <ProfileContext.Provider value={{ repository, generations }}>{children}</ProfileContext.Provider>;
}

function useProfileContext() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("ProfileRepositoryProvider 밖에서 프로필 저장소를 찾았습니다");
  return value;
}

/** 프로필 화면은 이 훅으로만 프로필 데이터에 접근한다. */
export const useProfileRepository = (): ProfileRepository => useProfileContext().repository;
/** 3안 생성 저장소 로더 — 화면(엔진 청크)이 처음 쓸 때 받는다 */
export const useGenerationLoader = (): GenerationLoader => useProfileContext().generations;

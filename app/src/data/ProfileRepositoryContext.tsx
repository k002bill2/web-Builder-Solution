import { createContext, useContext, type ReactNode } from "react";
import type { ProfileReadRepository } from "./profileRepository";

const ProfileContext = createContext<ProfileReadRepository | null>(null);

/** 프로필 저장소 (DS-2A-04 6.3). 생성 저장소는 2a-04c에서 더한다. */
export function ProfileRepositoryProvider({
  repository,
  children,
}: {
  readonly repository: ProfileReadRepository;
  readonly children: ReactNode;
}) {
  return <ProfileContext.Provider value={repository}>{children}</ProfileContext.Provider>;
}

/** 프로필 화면은 이 훅으로만 프로필 데이터에 접근한다. */
export function useProfileRepository(): ProfileReadRepository {
  const repository = useContext(ProfileContext);
  if (!repository) throw new Error("ProfileRepositoryProvider 밖에서 useProfileRepository를 호출했습니다");
  return repository;
}

import { createContext, useContext, type ReactNode } from "react";
import type { ReferenceRepository } from "./referenceRepository";

const RepositoryContext = createContext<ReferenceRepository | null>(null);

export function ReferenceRepositoryProvider({
  repository,
  children,
}: {
  readonly repository: ReferenceRepository;
  readonly children: ReactNode;
}) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

/** 화면은 이 훅으로만 레퍼런스 데이터에 접근한다. */
export function useReferenceRepository(): ReferenceRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) throw new Error("ReferenceRepositoryProvider 밖에서 useReferenceRepository를 호출했습니다");
  return repository;
}

import { ProjectRepositoryError, type DocHead, type ProjectRepository } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { DocSaveRepository } from "./useDocSave";

/**
 * 저장소 문서(`DocHead`)가 편집 문서(`PageDoc`)인지 — 저장소 문서는 엔진이 만든 것만 있다(startDoc = createDocFromCandidate · saveDoc = validatePageDoc).
 * 캐스트 대신 이 모양 확인 한 곳에서 좁힌다(A2-F REPORT 6절 타입 불일치 정리).
 */
export function isPageDoc(doc: DocHead): doc is PageDoc {
  return "sections" in doc && Array.isArray(doc.sections) && "meta" in doc && typeof doc.meta === "object" && doc.meta !== null;
}

/** 프로젝트 저장소(`ProjectRepository<DocHead>`) → 자동 저장 훅 저장소(`DocSaveRepository`) 어댑터. 저장 결과는 머리만 쓰고, 충돌 해결 결과는 모양을 확인한다 */
export function toDocSaveRepository(repository: ProjectRepository): DocSaveRepository {
  return {
    persistence: repository.persistence,
    saveDoc: (projectId, expectedRevision, doc) => repository.saveDoc(projectId, expectedRevision, doc),
    resolveConflict: async (projectId, choice, myDoc) => {
      const resolved = await repository.resolveConflict(projectId, choice, myDoc);
      if (!isPageDoc(resolved)) throw new ProjectRepositoryError("SCHEMA_INVALID", "충돌 해결 결과가 편집 문서 모양이 아닙니다");
      return resolved;
    },
  };
}

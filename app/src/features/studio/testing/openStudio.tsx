import { act, screen } from "@testing-library/react";
import type { ProfileRepository } from "../../../data/profileRepository";
import type { Project, ProjectRepository } from "../../../data/projectRepository";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import type { ProfileSeries } from "../../../domain/profile";
import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { renderApp } from "../../../test/renderApp";

/** 테스트 전용(제품 코드가 import하지 않는다) — 편집기 연산 테스트 공용 (EDITOR-A3-1) — StudioShell.test와 같은 셋업을 문서·프로필 주입으로 */
export const STUDIO_PROJECT: Project = {
  projectId: "project-1",
  name: "동네 치과 클리닉 프로젝트",
  revision: 1,
  profileId: "profile-1",
  baseReferenceId: "ref-1",
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
};

/** 화면이 쓰는 조회·저장만 — 저장은 받은 문서를 기록한다 */
export function stubProjectRepository(doc: PageDoc) {
  const saved: PageDoc[] = [];
  const repository = {
    persistence: "memory",
    getProject: async (id: string) => (id === STUDIO_PROJECT.projectId ? STUDIO_PROJECT : undefined),
    getDoc: async (id: string) => (id === STUDIO_PROJECT.projectId ? doc : undefined),
    saveDoc: async (_id: string, revision: number, next: PageDoc) => {
      saved.push(next);
      return { ...next, revision: revision + 1 };
    },
  } as unknown as ProjectRepository;
  return { repository, saved };
}

/** 프로필 조회만 — 목적·모션 파생(docPurpose)용 */
export const stubProfiles = (series: ProfileSeries | undefined) => ({ getProfile: async () => series }) as unknown as ProfileRepository;

const original = window.matchMedia;
/** Tailwind 기준 폭(rem)으로 matchMedia를 흉내 낸다 (StudioShell.test와 같은 방식) */
export function setViewport(width: number) {
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width:\s*([\d.]+)rem/.exec(query)?.[1] ?? 0) * 16;
    return {
      matches: width >= min,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  }) as typeof window.matchMedia;
}
export const restoreViewport = () => {
  window.matchMedia = original;
};

export async function openStudio({ width = 1280, doc = sampleDoc(), series }: { width?: number; doc?: PageDoc; series?: ProfileSeries } = {}) {
  setViewport(width);
  const projects = stubProjectRepository(doc);
  const { router } = renderApp("/catalog", undefined, undefined, stubProfiles(series), undefined, () => Promise.resolve(projects.repository));
  act(() => void router.navigate("/studio/project-1"));
  await screen.findByRole("heading", { level: 1, name: STUDIO_PROJECT.name });
  return { router, saved: projects.saved };
}

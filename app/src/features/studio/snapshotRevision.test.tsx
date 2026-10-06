import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createMemoryCompareBoardRepository } from "../../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "../../data/memoryGenerationRepository";
import { createMemoryProjectRepository } from "../../data/memoryProjectRepository";
import type { ExportGenerator, ProjectRepository } from "../../data/projectRepository";
import { createStudioStore } from "../../data/studioStore";
import { isTerminal } from "../../domain/generation";
import type { PageDoc, SectionInstance } from "../../engine/contracts/pageDoc";
import { withAlt } from "../../engine/testing/gateKit";
import { section } from "../../engine/testing/sampleDoc";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { useDocSave } from "./useDocSave";

/**
 * ER-AC-S10 (EDITOR-REST SPEC r1 3.2) — 실메모리 저장소 통합: 복원(저장 훅 경로 adopt) → 편집 → 저장 → 내보내기 요청까지 revision이 끊기지 않는다.
 * 게이트 통과 문서 = memoryExport.test와 같은 픽스처(ref-e 팔레트 + 렌더러 있는 7변형 · 대체텍스트·SEO 채움).
 */
const RENDERED: readonly SectionInstance[] = [
  section("header", "sticky-right-cta", "s-header"),
  section("hero", "fullbleed-left", "s-hero"),
  section("about", "story", "s-about"),
  section("services", "cards-3", "s-services"),
  section("faq", "accordion", "s-faq"),
  section("contact", "form", "s-contact"),
  section("footer", "biz-extended", "s-footer"),
].map((s) => withAlt(s));
const META = { title: "동네 치과", description: "동네 치과를 소개합니다." };
const fake: ExportGenerator = async ({ format }) => ({ downloadRef: `blob:${format}`, resultHash: "h-1" });
const titled = (doc: PageDoc, title: string): PageDoc => ({ ...doc, meta: { ...doc.meta, title } });

async function setup() {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-e", "ref-a", "ref-b"], { hero: "ref-e" }), store });
  await board.confirmProfile(1, 0);
  const gen = createMemoryGenerationRepository({ store });
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i++) job = await gen.getJob(job.jobId);
  let ticks = 0;
  const now = () => `2026-10-06T14:0${ticks++ % 10}:00.000Z`;
  const repo = createMemoryProjectRepository({ store, now, generators: { "static-html": fake } }) as ProjectRepository<PageDoc>;
  const { doc } = await repo.startDoc("project-1", 1, "A", "create");
  return { repo, doc };
}

/** act 밖에서 시작한 약속을 렌더를 흘려 가며 기다린다(useDocSaveWrite.test와 같은 도우미) */
async function settle<T>(start: () => Promise<T>): Promise<T> {
  let promise!: Promise<T>;
  act(() => void (promise = start()));
  let done = false;
  void promise.finally(() => (done = true));
  while (!done) await act(async () => void (await new Promise((res) => setTimeout(res, 0))));
  return promise;
}

describe("복원 → 편집 → 저장 → 내보내기 revision 연속 (ER-AC-S10 · 실메모리 저장소)", () => {
  it("스냅샷 복원(adopt) 뒤 편집 저장 STALE_DOC 0 · 내보내기 요청 = 저장 revision · '내보내기 전' 스냅샷 문서 = 복원 뒤 편집", async () => {
    const { repo, doc: started } = await setup();
    const { result } = renderHook(() => useDocSave({ repository: repo, projectId: "project-1", initialDoc: started, debounceMs: 60_000 }));
    const r0 = started.revision;

    act(() => result.current.edit({ ...started, meta: META, sections: RENDERED }));
    expect(await settle(() => result.current.flushed())).toBe(true);
    const snapshot = await repo.createSnapshot("project-1", "수동 1");
    act(() => result.current.edit(titled(result.current.doc, "스냅샷 뒤 제목")));
    expect(await settle(() => result.current.flushed())).toBe(true);
    expect(result.current.savedRevision()).toBe(r0 + 2);

    const restored = await settle(() => result.current.adopt((revision) => repo.restoreSnapshot("project-1", snapshot.snapshotId, revision)));
    expect(restored?.meta.title).toBe("동네 치과");
    expect(result.current.savedRevision()).toBe(r0 + 3);
    expect(result.current.state.phase).toBe("saved");

    act(() => result.current.edit(titled(result.current.doc, "복원 뒤 편집")));
    expect(await settle(() => result.current.flushed())).toBe(true);
    expect(result.current.savedRevision()).toBe(r0 + 4);
    expect((await repo.getDoc("project-1"))?.revision).toBe(r0 + 4);

    const { job, snapshotId } = await repo.requestExport("project-1", "static-html", result.current.savedRevision());
    expect(job.docRevision).toBe(r0 + 4);
    const exported = (await repo.listSnapshots("project-1")).find((s) => s.snapshotId === snapshotId)!;
    expect(exported).toMatchObject({ kind: "auto", reason: "export" });
    expect(exported.doc.meta.title).toBe("복원 뒤 편집");
  });
});

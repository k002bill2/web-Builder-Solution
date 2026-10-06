import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileRepositoryProvider } from "../../data/ProfileRepositoryContext";
import type { GenerationRepository } from "../../data/generationRepository";
import type { ProfileRepository } from "../../data/profileRepository";
import type { Project, ProjectRepository, ProjectSnapshot } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import type { IngestResult } from "../../features/studio/images/ingest";
import { connectRenderFrame } from "../../features/studio/testing/renderFrame";
import { StudioLayout } from "./StudioLayout";

/** ER-AC-S6 화면 (EDITOR-REST SPEC r1 3.2) — 스냅샷 문서도 이미지 참조 집합에 든다: A → 스냅샷 → 교체 → 복원 = A 유지 */
const ingest = vi.hoisted(() => vi.fn<(file: File) => Promise<IngestResult>>());
vi.mock("../../features/studio/images/ingest/ingestImage", () => ({ ingestImage: ingest }));

const PROJECT: Project = {
  projectId: "project-1",
  name: "동네 치과 클리닉 프로젝트",
  revision: 1,
  profileId: "profile-1",
  baseReferenceId: "ref-1",
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
};
const NO_PROFILE = { getProfile: async () => undefined } as unknown as ProfileRepository;
const UNUSED = () => Promise.reject(new Error("이 테스트는 쓰지 않는다"));
const webp = (bytes: number) => new Blob([new Uint8Array(bytes)], { type: "image/webp" });
const picked = (bytes: number): IngestResult => ({ ok: true, image: { variants: { 640: webp(bytes), 1280: webp(bytes) }, width: 1280, height: 640, format: "webp", bytes } }) as IngestResult;
const settle = () =>
  act(async () => {
    await vi.dynamicImportSettled();
    await new Promise<void>((r) => setTimeout(r, 0));
  });

/** 상태 있는 저장소 흉내 — 저장 = revision +1 · 스냅샷 = 저장된 문서 · 복원 = 그 문서를 새 revision으로 */
function snapshotRepo(initial: PageDoc) {
  let stored = initial;
  const snaps: ProjectSnapshot<PageDoc>[] = [];
  const repository = {
    persistence: "memory",
    saveDoc: async (_id: string, revision: number, next: PageDoc) => (stored = { ...next, revision: revision + 1 }),
    resolveConflict: vi.fn(),
    listSnapshots: async () => [...snaps],
    createSnapshot: async (_id: string, name?: string) => {
      const s = { snapshotId: `snapshot-${snaps.length + 1}`, projectId: "project-1", kind: "manual" as const, name: name ?? "수동 · 14:02", createdAt: "2026-10-06T05:02:00.000Z", doc: stored, profileVersion: stored.profileVersion, candidateId: stored.candidateId, hash: "h" };
      snaps.push(s);
      return s;
    },
    restoreSnapshot: async (_id: string, snapshotId: string, revision: number) => (stored = { ...snaps.find((s) => s.snapshotId === snapshotId)!.doc, revision: revision + 1 }),
  } as unknown as ProjectRepository;
  return repository;
}

type RenderMessage = { type: string; doc: PageDoc; images?: Record<string, { blob: Blob }> };
const heroSource = (doc: PageDoc) => (doc.sections.find((s) => s.instanceId === "s-hero")!.slots as Record<string, { source?: string }>).image!.source!;
const editRegion = () => screen.getByRole("region", { name: /^편집 · / });
const pickFile = async () => {
  await screen.findByTestId("image-file-image");
  fireEvent.change(screen.getByTestId("image-file-image"), { target: { files: [new File([new Uint8Array([0xff, 0xd8, 0xff])], "IMG_0001.jpg", { type: "image/jpeg" })] } });
  await settle();
};

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:test/preview");
  URL.revokeObjectURL = vi.fn();
});

describe("스냅샷 문서 = 이미지 참조 집합 (ER-AC-S6 화면)", () => {
  it("이미지 A → 스냅샷 → B로 교체해도 A가 캔버스 images에 남는다 → 복원 = 문서 A · A 이미지 그대로", async () => {
    render(
      <ProfileRepositoryProvider repository={NO_PROFILE} generations={UNUSED as () => Promise<GenerationRepository>} projects={UNUSED as () => Promise<ProjectRepository>}>
        <MemoryRouter>
          <StudioLayout project={PROJECT} doc={sampleDoc()} repository={snapshotRepo(sampleDoc())} entryNotice={undefined} focusHeading={false} />
        </MemoryRouter>
      </ProfileRepositoryProvider>,
    );
    const { sent } = connectRenderFrame();
    const last = () => sent.filter((m) => m.type === "render").at(-1) as unknown as RenderMessage;
    const details = within(editRegion()).getByText("이미지 편집 (1)").closest("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    await settle();

    ingest.mockResolvedValueOnce(picked(20));
    await pickFile();
    const a = heroSource(last().doc);
    expect(last().images?.[a]?.blob.size).toBe(20);

    act(() => void fireEvent.click(screen.getByRole("button", { name: "스냅샷" })));
    const dialog = within(await screen.findByRole("dialog", { name: "스냅샷" }));
    await act(async () => void fireEvent.click(dialog.getByRole("button", { name: "지금 상태 저장" })));
    await dialog.findByText("수동 · 14:02");
    act(() => void fireEvent.click(dialog.getByRole("button", { name: "닫기" })));

    ingest.mockResolvedValueOnce(picked(30));
    await pickFile();
    const b = heroSource(last().doc);
    expect(b).not.toBe(a);
    await waitFor(() => expect(Object.keys(last().images ?? {}).sort()).toEqual([a, b].sort()));

    act(() => void fireEvent.click(screen.getByRole("button", { name: "스냅샷" })));
    const again = within(await screen.findByRole("dialog", { name: "스냅샷" }));
    const previewButton = await again.findByRole("button", { name: "수동 · 14:02 미리보기" });
    act(() => void fireEvent.click(previewButton));
    const restoreButton = await screen.findByRole("button", { name: "이 스냅샷으로 복원" });
    await act(async () => void fireEvent.click(restoreButton));
    await waitFor(() => expect(heroSource(last().doc)).toBe(a));
    expect(last().images?.[a]?.blob.size).toBe(20);
  }, 10_000);
});

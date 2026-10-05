import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileRepositoryProvider } from "../../data/ProfileRepositoryContext";
import type { GenerationRepository } from "../../data/generationRepository";
import type { ProfileRepository } from "../../data/profileRepository";
import type { Project, ProjectRepository } from "../../data/projectRepository";
import type { ImageSlotValue } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import type { IngestResult } from "../../features/studio/images/ingest";
import { connectRenderFrame } from "../../features/studio/testing/renderFrame";
import { StudioLayout } from "./StudioLayout";

/**
 * 편집 틀 ↔ 이미지 패널 ↔ 캔버스 연결 (SPEC m2c 2.1 · 5.1 · 7절 · IMG-AC-12). 진입 층 = "이미지 편집 (N)" 펼침 1개 —
 * 펼치기 전 패널 청크 요청 0 · 파일을 고르기 전 변환기 청크 요청 0. 고른 이미지는 render 메시지 images로 캔버스에 간다.
 */
const loads = vi.hoisted(() => ({ panel: 0, ingest: 0, fn: vi.fn<(file: File) => Promise<IngestResult>>() }));
vi.mock("./ImageSlotPanel", async (original) => {
  loads.panel += 1;
  return original();
});
vi.mock("../../features/studio/images/ingest/ingestImage", () => {
  loads.ingest += 1;
  return { ingestImage: loads.fn };
});

const PROJECT: Project = {
  projectId: "project-1",
  name: "동네 치과 클리닉 프로젝트",
  revision: 1,
  profileId: "profile-1",
  baseReferenceId: "ref-1",
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
};
const repository = { persistence: "memory", saveDoc: vi.fn(async (_id: string, revision: number, doc: unknown) => ({ ...(doc as object), revision: revision + 1 })), resolveConflict: vi.fn() } as unknown as ProjectRepository;
const NO_PROFILE = { getProfile: async () => undefined } as unknown as ProfileRepository;
const UNUSED = () => Promise.reject(new Error("이 테스트는 쓰지 않는다"));
const webp = (bytes: number) => new Blob([new Uint8Array(bytes)], { type: "image/webp" });
const settle = () =>
  act(async () => {
    await vi.dynamicImportSettled();
    await new Promise<void>((r) => setTimeout(r, 0));
  });

function draw() {
  render(
    <ProfileRepositoryProvider repository={NO_PROFILE} generations={UNUSED as () => Promise<GenerationRepository>} projects={UNUSED as () => Promise<ProjectRepository>}>
      <MemoryRouter>
        <StudioLayout project={PROJECT} doc={sampleDoc()} repository={repository} entryNotice={undefined} focusHeading={false} />
      </MemoryRouter>
    </ProfileRepositoryProvider>,
  );
  return connectRenderFrame();
}
const editRegion = () => screen.getByRole("region", { name: /^편집 · / });
const openImages = async () => {
  const summary = within(editRegion()).getByText("이미지 편집 (1)");
  const details = summary.closest("details")!;
  details.open = true;
  fireEvent(details, new Event("toggle"));
  await settle();
};
const pickFile = async () => {
  fireEvent.change(screen.getByTestId("image-file-image"), { target: { files: [new File([new Uint8Array([0xff, 0xd8, 0xff])], "IMG_0001.jpg", { type: "image/jpeg" })] } });
  await settle();
};

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:test/preview");
  URL.revokeObjectURL = vi.fn();
  loads.fn.mockResolvedValue({ ok: true, image: { variants: { 640: webp(10), 1280: webp(20) }, width: 1280, height: 640, format: "webp", bytes: 30 } });
});

describe("이미지 편집 진입 층 · 캔버스 연결 (IMG-AC-12 · SPEC 5.1)", () => {
  it("이미지 슬롯 있는 섹션 = '이미지 편집 (N)' 펼침 1개 · 펼치기 전 패널·변환기 청크 0 · 펼치면 패널 · 파일 고르기 전 변환기 0", async () => {
    draw();
    expect(within(editRegion()).getAllByText(/^이미지 편집/)).toHaveLength(1);
    expect(screen.queryByRole("switch")).toBeNull();
    expect(loads).toMatchObject({ panel: 0, ingest: 0 });
    await openImages();
    expect(loads.panel).toBe(1);
    expect(within(editRegion()).getByRole("switch", { name: "대표 이미지 사용" })).toBeInTheDocument();
    expect(loads.ingest).toBe(0);
  });

  it("파일 고르기 → 캔버스 render 메시지 images = {새 로컬 id: {Blob, 원본 폭·높이}} · 문서 hero source = 그 id", async () => {
    const { sent } = draw();
    await openImages();
    await pickFile();
    expect(loads.ingest).toBe(1);
    const last = sent.filter((m) => m.type === "render").at(-1) as { doc: { sections: Array<{ instanceId: string; slots: Record<string, ImageSlotValue> }> }; images?: Record<string, { blob: Blob; width: number; height: number }> };
    const id = last.doc.sections.find((s) => s.instanceId === "s-hero")!.slots.image!.source as string;
    expect(Object.keys(last.images ?? {})).toEqual([id]);
    expect(last.images![id]).toMatchObject({ width: 1280, height: 640 });
    expect(last.images![id]!.blob.size).toBe(20);
  });

  it("이미지 지우기 → 참조 밖이 된 이미지가 캔버스 images에서 빠진다", async () => {
    const { sent } = draw();
    await openImages();
    await pickFile();
    fireEvent.click(within(editRegion()).getByRole("button", { name: "이미지 지우기" }));
    await settle();
    const last = sent.filter((m) => m.type === "render").at(-1) as { images?: Record<string, unknown> };
    expect(Object.keys(last.images ?? {})).toEqual([]);
  });
});

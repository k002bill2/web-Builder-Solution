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
  await screen.findByTestId("image-file-image");
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
    expect(await within(editRegion()).findByRole("switch", { name: "대표 이미지 사용" })).toBeInTheDocument();
    expect(loads.panel).toBe(1);
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

  it("이미지 지우기 → 기록(지우기 전 문서)이 쥐는 동안 캔버스 images에 남는다 · Ctrl+Z = 같은 이미지 id(FIELD-UNDO 4.4 · MQ-F3 A — 무효화는 아래 다시 실행 잘림 it)", async () => {
    const { sent } = draw();
    await openImages();
    await pickFile();
    const picked = sent.filter((m) => m.type === "render").at(-1) as { images?: Record<string, unknown> };
    const [id] = Object.keys(picked.images ?? {});
    fireEvent.click(within(editRegion()).getByRole("button", { name: "이미지 지우기" }));
    await settle();
    const last = sent.filter((m) => m.type === "render").at(-1) as { doc: { sections: Array<{ instanceId: string; slots: Record<string, ImageSlotValue> }> }; images?: Record<string, unknown> };
    expect(last.doc.sections.find((s) => s.instanceId === "s-hero")!.slots.image!.source).not.toBe(id);
    expect(Object.keys(last.images ?? {})).toEqual([id]);
    fireEvent.keyDown(document.body, { key: "z", code: "KeyZ", ctrlKey: true });
    await settle();
    const restored = sent.filter((m) => m.type === "render").at(-1) as { doc: { sections: Array<{ instanceId: string; slots: Record<string, ImageSlotValue> }> }; images?: Record<string, unknown> };
    expect(restored.doc.sections.find((s) => s.instanceId === "s-hero")!.slots.image!.source).toBe(id);
    expect(Object.keys(restored.images ?? {})).toEqual([id]);
  });

  it("무효화(MQ-F3 A): 이미지 고르기 → 칸 밖 Ctrl+Z(다시 실행 목록만 쥠) → 필드 입력(다시 실행 잘림) → 캔버스 images에서 빠진다", async () => {
    const { sent } = draw();
    await openImages();
    await pickFile();
    fireEvent.keyDown(document.body, { key: "z", code: "KeyZ", ctrlKey: true });
    await settle();
    const undone = sent.filter((m) => m.type === "render").at(-1) as { images?: Record<string, unknown> };
    expect(Object.keys(undone.images ?? {})).toHaveLength(1);
    fireEvent.change(within(editRegion()).getAllByRole("textbox")[0]!, { target: { value: "새 제목" } });
    await settle();
    fireEvent.blur(within(editRegion()).getAllByRole("textbox")[0]!);
    fireEvent.change(within(editRegion()).getAllByRole("textbox")[0]!, { target: { value: "새 제목 2" } });
    await settle();
    const last = sent.filter((m) => m.type === "render").at(-1) as { images?: Record<string, unknown> };
    expect(Object.keys(last.images ?? {})).toEqual([]);
  });

  it("패널이 닫혀 있어도 삭제한 섹션의 이미지는 기록이 쥐는 동안 남는다 — 삭제 → 필드 입력 = 유지(Ctrl+Z 2번으로 닿음)", async () => {
    const { sent } = draw();
    act(() => within(screen.getByRole("navigation", { name: "섹션" })).getByRole("button", { name: /^About/ }).click());
    await openImages();
    await pickFile();
    const summary = within(editRegion()).getByText("이미지 편집 (1)").closest("details")!;
    summary.open = false;
    fireEvent(summary, new Event("toggle"));
    await settle();
    expect(screen.queryByRole("switch")).toBeNull();
    fireEvent.click(within(editRegion()).getByRole("button", { name: "삭제" }));
    await settle();
    const withUndo = sent.filter((m) => m.type === "render").at(-1) as { images?: Record<string, unknown> };
    expect(Object.keys(withUndo.images ?? {})).toHaveLength(1);
    const [id] = Object.keys(withUndo.images ?? {});
    // 600ms 전(묶음이 열린 채)에도 놓지 않는다(FU-AC-8)
    fireEvent.change(within(editRegion()).getAllByRole("textbox")[0]!, { target: { value: "새 제목" } });
    await settle();
    const typing = sent.filter((m) => m.type === "render").at(-1) as { images?: Record<string, unknown> };
    expect(Object.keys(typing.images ?? {})).toEqual([id]);
    fireEvent.blur(within(editRegion()).getAllByRole("textbox")[0]!);
    await settle();
    const last = sent.filter((m) => m.type === "render").at(-1) as { images?: Record<string, unknown> };
    expect(Object.keys(last.images ?? {})).toHaveLength(1);
    for (let i = 0; i < 2; i++) {
      fireEvent.keyDown(document.body, { key: "z", code: "KeyZ", ctrlKey: true });
      await settle();
    }
    expect(within(screen.getByRole("navigation", { name: "섹션" })).getByRole("button", { name: /^About/ })).toBeInTheDocument();
    const restored = sent.filter((m) => m.type === "render").at(-1) as { doc: { sections: Array<{ instanceId: string; slots: Record<string, ImageSlotValue> }> }; images?: Record<string, unknown> };
    expect(restored.doc.sections.find((s) => s.instanceId === "s-about")!.slots.image!.source).toBe(id);
    expect(Object.keys(restored.images ?? {})).toEqual([id]);
  });

  it("무효화: 삭제한 섹션의 이미지만 쥔 기록이 상한 50에서 밀려나면 캔버스 images에서 빠진다(FU-AC-9 · Codex r1 의도 보존)", async () => {
    const { sent } = draw();
    act(() => within(screen.getByRole("navigation", { name: "섹션" })).getByRole("button", { name: /^About/ }).click());
    await openImages();
    await pickFile();
    fireEvent.click(within(editRegion()).getByRole("button", { name: "삭제" }));
    await settle();
    for (let i = 0; i < 49; i++) {
      fireEvent.change(within(editRegion()).getAllByRole("textbox")[0]!, { target: { value: `제목 ${i}` } });
      await settle();
      fireEvent.blur(within(editRegion()).getAllByRole("textbox")[0]!);
    }
    await settle();
    const kept = sent.filter((m) => m.type === "render").at(-1) as { images?: Record<string, unknown> };
    expect(Object.keys(kept.images ?? {})).toHaveLength(1);
    fireEvent.change(within(editRegion()).getAllByRole("textbox")[0]!, { target: { value: "제목 끝" } });
    await settle();
    fireEvent.blur(within(editRegion()).getAllByRole("textbox")[0]!);
    fireEvent.change(within(editRegion()).getAllByRole("textbox")[0]!, { target: { value: "제목 끝 2" } });
    await settle();
    const last = sent.filter((m) => m.type === "render").at(-1) as { images?: Record<string, unknown> };
    expect(Object.keys(last.images ?? {})).toEqual([]);
  }, 20000);
});

describe("폭 변경 시 '이미지 편집' 펼침 유지 (B-M2C-04)", () => {
  /** 폭을 바꾸면 change를 알리는 matchMedia 흉내 — 배치(3단·2단·탭) 전환이 실제로 일어나게 */
  function stubWidth(initial: number) {
    let width = initial;
    const listeners = new Set<() => void>();
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      get matches() {
        return width >= Number(/min-width:\s*([\d.]+)rem/.exec(query)?.[1] ?? 0) * 16;
      },
      media: query,
      addEventListener: (_: string, fn: () => void) => void listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => void listeners.delete(fn),
    })) as unknown as typeof window.matchMedia;
    return {
      resize: (next: number) => {
        width = next;
        act(() => listeners.forEach((fn) => fn()));
      },
      restore: () => {
        window.matchMedia = original;
      },
    };
  }

  it("1280에서 펼친 뒤 1024·768·390·1280으로 바꿔도 펼침과 패널이 남는다", async () => {
    const viewport = stubWidth(1280);
    try {
      draw();
      await openImages();
      for (const width of [1024, 768, 390, 1280]) {
        viewport.resize(width);
        await settle();
        expect(screen.getByText("이미지 편집 (1)").closest("details")!.open, `${width}`).toBe(true);
        expect(screen.getByRole("switch", { name: "대표 이미지 사용", hidden: true }), `${width}`).toBeInTheDocument();
      }
    } finally {
      viewport.restore();
    }
  });
});

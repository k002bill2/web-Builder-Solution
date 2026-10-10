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
 * 이미지 패널 편집 실행 취소 (FIELD-UNDO SPEC r0 4.5 · FU-AC-13 · MQ-F3 A) — 켜기·고르기·지우기·끄기·장식 = 클릭 1회 즉시 기록 1건 ·
 * 대체텍스트 = 필드 묶음 규칙 · 변환 거절 = 기록 0. 편집 틀 + 칸 밖 단축키 + 캔버스 render 메시지로 본다.
 */
const loads = vi.hoisted(() => ({ fn: vi.fn<(file: File) => Promise<IngestResult>>() }));
vi.mock("../../features/studio/images/ingest/ingestImage", () => ({ ingestImage: loads.fn }));

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
type RenderMessage = { readonly doc: { readonly sections: ReadonlyArray<{ readonly instanceId: string; readonly slots: Record<string, unknown> }> }; readonly images?: Record<string, unknown> };

function draw() {
  render(
    <ProfileRepositoryProvider repository={NO_PROFILE} generations={UNUSED as () => Promise<GenerationRepository>} projects={UNUSED as () => Promise<ProjectRepository>}>
      <MemoryRouter>
        <StudioLayout project={PROJECT} doc={sampleDoc()} repository={repository} entryNotice={undefined} focusHeading={false} />
      </MemoryRouter>
    </ProfileRepositoryProvider>,
  );
  const { sent } = connectRenderFrame();
  const last = () => sent.filter((m) => m.type === "render").at(-1) as unknown as RenderMessage;
  const heroSlot = (slot: string) => last().doc.sections.find((s) => s.instanceId === "s-hero")!.slots[slot];
  return { last, hero: () => heroSlot("image") as ImageSlotValue, title: () => heroSlot("title") };
}
const editRegion = () => within(screen.getByRole("region", { name: /^편집 · / }));
const notice = () => screen.getByRole("status", { name: "편집 알림" });
const openImages = async () => {
  const details = editRegion().getByText("이미지 편집 (1)").closest("details")!;
  details.open = true;
  fireEvent(details, new Event("toggle"));
  await settle();
};
const pickFile = async () => {
  await screen.findByTestId("image-file-image");
  fireEvent.change(screen.getByTestId("image-file-image"), { target: { files: [new File([new Uint8Array([0xff, 0xd8, 0xff])], "IMG_0001.jpg", { type: "image/jpeg" })] } });
  await settle();
};
const CTRL_Z = { key: "z", code: "KeyZ", ctrlKey: true };
const REDO = { ...CTRL_Z, key: "Z", shiftKey: true };
const press = async (init: KeyboardEventInit) => {
  fireEvent.keyDown(document.body, init);
  await settle();
};
const click = async (element: HTMLElement) => {
  fireEvent.click(element);
  await settle();
};
const toggleSwitch = () => editRegion().getByRole("switch", { name: "대표 이미지 사용" });
const altBox = () => editRegion().getByRole("textbox", { name: /^대체텍스트/ }) as HTMLInputElement;

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:test/preview");
  URL.revokeObjectURL = vi.fn();
  loads.fn.mockReset();
  loads.fn.mockResolvedValue({ ok: true, image: { variants: { 640: webp(10), 1280: webp(20) }, width: 1280, height: 640, format: "webp", bytes: 30 } });
});

describe("이미지 패널 클릭 = 즉시 기록 1건 — FU-AC-13 (SPEC 4.5)", () => {
  it("고르기 → 칸 밖 Ctrl+Z = 이미지 빠짐 + '실행 취소: Hero 이미지 고르기' · Shift+Ctrl+Z = 같은 이미지(id·render images)", async () => {
    const view = draw();
    await openImages();
    const original = view.hero().source;
    await pickFile();
    const id = view.hero().source as string;
    expect(typeof id).toBe("string");
    await press(CTRL_Z);
    expect(view.hero().source).toEqual(original);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 이미지 고르기$/);
    await press(REDO);
    expect(view.hero().source).toBe(id);
    expect(Object.keys(view.last().images ?? {})).toEqual([id]);
    expect(notice()).toHaveTextContent(/^다시 실행: Hero 이미지 고르기$/);
  });

  it("바꾸기(A → B) → Ctrl+Z = 문서 A · A 이미지가 render images에 그대로(기록이 쥔 이미지는 놓지 않음 — SPEC 4.4)", async () => {
    const view = draw();
    await openImages();
    await pickFile();
    const a = view.hero().source as string;
    await pickFile();
    const b = view.hero().source as string;
    expect(b).not.toBe(a);
    await press(CTRL_Z);
    expect(view.hero().source).toBe(a);
    expect(Object.keys(view.last().images ?? {})).toContain(a);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 이미지 고르기$/);
  });

  it("지우기 → Ctrl+Z = 같은 이미지 id로 복원 + '실행 취소: Hero 이미지 지우기' · 한 번 더 = 고르기 취소", async () => {
    const view = draw();
    await openImages();
    const original = view.hero().source;
    await pickFile();
    const id = view.hero().source as string;
    await click(editRegion().getByRole("button", { name: "이미지 지우기" }));
    expect(view.hero().source).not.toBe(id);
    await press(CTRL_Z);
    expect(view.hero().source).toBe(id);
    expect(Object.keys(view.last().images ?? {})).toEqual([id]);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 이미지 지우기$/);
    await press(CTRL_Z);
    expect(view.hero().source).toEqual(original);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 이미지 고르기$/);
  });

  it("끄기 → 켜기 = 기록 2건(묶이지 않음) · Ctrl+Z = '… 켜기' 취소(꺼짐) · 한 번 더 = '… 끄기' 취소(켜짐)", async () => {
    const view = draw();
    await openImages();
    expect(view.hero().enabled).toBe(true);
    await click(toggleSwitch());
    expect(view.hero().enabled).toBe(false);
    await click(toggleSwitch());
    expect(view.hero().enabled).toBe(true);
    await press(CTRL_Z);
    expect(view.hero().enabled).toBe(false);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 이미지 켜기$/);
    await press(CTRL_Z);
    expect(view.hero().enabled).toBe(true);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 이미지 끄기$/);
  });

  it("장식 체크 → Ctrl+Z = 장식 해제 + '실행 취소: Hero 이미지 장식'", async () => {
    const view = draw();
    await openImages();
    const before = view.hero().decorative;
    await click(editRegion().getByRole("checkbox", { name: /^장식 이미지/ }));
    expect(view.hero().decorative).toBe(!before);
    await press(CTRL_Z);
    expect(view.hero().decorative).toBe(before);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 이미지 장식$/);
  });
});

describe("대체텍스트 = 필드 묶음 · 거절 = 기록 0 — FU-AC-13", () => {
  it("대체텍스트 2회 입력 + blur = 기록 1건 '실행 취소: Hero 대체텍스트 편집' · 텍스트만 원복(이미지 그대로)", async () => {
    const view = draw();
    await openImages();
    await pickFile();
    const id = view.hero().source as string;
    const original = view.hero().alt;
    fireEvent.change(altBox(), { target: { value: "가게" } });
    await settle();
    fireEvent.change(altBox(), { target: { value: "가게 외관" } });
    await settle();
    fireEvent.blur(altBox());
    await press(CTRL_Z);
    expect(view.hero().alt).toBe(original);
    expect(view.hero().source).toBe(id);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 대체텍스트 편집$/);
    await press(REDO);
    expect(view.hero().alt).toBe("가게 외관");
  });

  it("변환 거절(TOO_LARGE) = 기록 0 — Ctrl+Z 1회가 앞의 고르기를 되돌린다", async () => {
    const view = draw();
    await openImages();
    const original = view.hero().source;
    await pickFile();
    const id = view.hero().source as string;
    loads.fn.mockResolvedValueOnce({ ok: false, code: "TOO_LARGE", detail: "12.4MB" });
    await pickFile();
    expect((await screen.findAllByText("10MB까지 쓸 수 있습니다 (12.4MB)")).length).toBeGreaterThan(0);
    expect(view.hero().source).toBe(id);
    await press(CTRL_Z);
    expect(view.hero().source).toEqual(original);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 이미지 고르기$/);
  });

  it("글자 묶음이 열린 채(blur·600ms 전) 스위치 끄기 = 앞 묶음 닫힘 후 1건 — Ctrl+Z = 끄기만 · 한 번 더 = 제목", async () => {
    const view = draw();
    await openImages();
    const original = view.title();
    fireEvent.change(editRegion().getAllByRole("textbox")[0]!, { target: { value: "새 제목" } });
    await settle();
    await click(toggleSwitch());
    await press(CTRL_Z);
    expect(view.hero().enabled).toBe(true);
    expect(view.title()).toBe("새 제목");
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 이미지 끄기$/);
    await press(CTRL_Z);
    expect(view.title()).toBe(original);
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 제목 편집$/);
  });
});

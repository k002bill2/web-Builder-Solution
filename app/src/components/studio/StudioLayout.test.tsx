import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError, type Project, type ProjectRepository } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { StudioLayout } from "./StudioLayout";

/**
 * A2-F 부품 연결 (EDITOR-A2-SHELL S7 — RESUME-1): 편집 패널 필드 · 페이지 정보 · 저장 상태 · 충돌 Callout · 자동 저장.
 * 라우터·lazy·Suspense를 거치지 않고 틀만 가짜 타이머로 그린다(타이밍 간헐 실패 방지).
 */
const PROJECT: Project = {
  projectId: "project-1",
  name: "동네 치과 클리닉 프로젝트",
  revision: 1,
  profileId: "profile-1",
  baseReferenceId: "ref-1",
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
};

function fakeRepository(saveDoc: ProjectRepository["saveDoc"] = async (_id, revision, doc) => ({ ...doc, revision: revision + 1 })) {
  const save = vi.fn(saveDoc);
  const repository = { persistence: "memory", saveDoc: save, resolveConflict: vi.fn() } as unknown as ProjectRepository;
  return { repository, save };
}

function draw(repository: ProjectRepository, doc: PageDoc = sampleDoc()) {
  return render(
    <MemoryRouter>
      <StudioLayout project={PROJECT} doc={doc} repository={repository} entryNotice={undefined} focusHeading={false} />
    </MemoryRouter>,
  );
}

const editRegion = () => screen.getByRole("region", { name: /^편집 · / });
const canvas = () => screen.getByRole("region", { name: "구조 미리보기" });
const row = (name: RegExp) => within(screen.getByRole("navigation", { name: "섹션" })).getByRole("button", { name });

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("편집 패널 필드 (S7 · E-AC-06 · SPEC 5.6)", () => {
  it("선택 섹션의 글자 슬롯이 FieldEditor로 — 섹션을 바꾸면 필드가 바뀐다", () => {
    draw(fakeRepository().repository);
    expect(within(editRegion()).getByRole("textbox", { name: /^제목/ })).toHaveValue(String(sampleDoc().sections[1]!.slots.title));
    act(() => row(/^About/).click());
    expect(screen.getByRole("heading", { level: 2, name: "편집 · About" })).toBeInTheDocument();
    expect(within(editRegion()).queryByDisplayValue(String(sampleDoc().sections[1]!.slots.title))).toBeNull();
  });

  it("'페이지 정보' → 제목·설명 필드(문서 meta)", () => {
    draw(fakeRepository().repository);
    act(() => row(/^페이지 정보/).click());
    expect(within(editRegion()).getByRole("textbox", { name: /^제목/ })).toHaveValue("브랜드 홈");
    expect(within(editRegion()).getByRole("textbox", { name: /^설명/ })).toHaveValue("브랜드를 소개하는 페이지입니다.");
  });

  it("권장 초과 → 캔버스 문제 문장이 생기고 필드 aria-describedby 맨 앞에 그 id", () => {
    draw(fakeRepository().repository);
    const title = within(editRegion()).getByRole("textbox", { name: /^제목/ });
    act(() => void fireEvent.change(title, { target: { value: "가".repeat(30) } }));
    const sentence = within(canvas()).getByText("제목이 권장 28자를 넘었습니다 (30/28자)");
    expect(title.getAttribute("aria-describedby")!.split(" ")[0]).toBe(sentence.id);
    expect(within(canvas()).getByText("경고 1")).toBeInTheDocument();
  });
});

describe("자동 저장 · 저장 상태 (S7 · E-AC-07·08 · SPEC 5.10)", () => {
  it("필드 입력 → 캔버스 글자 반영 → 2초 뒤 저장 1회 → '이 탭에 저장됨', 편집 알림 글자 변화 0", async () => {
    const { repository, save } = fakeRepository();
    draw(repository);
    const title = within(editRegion()).getByRole("textbox", { name: /^제목/ });
    act(() => void fireEvent.change(title, { target: { value: "새 제목" } }));
    expect(within(canvas()).getByText("새 제목")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveTextContent("저장 전 변경 있음");
    await act(() => vi.advanceTimersByTimeAsync(1999));
    expect(save).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![2]).toMatchObject({ sections: expect.arrayContaining([expect.objectContaining({ instanceId: "s-hero", slots: expect.objectContaining({ title: "새 제목" }) })]) });
    expect(screen.getByRole("banner")).toHaveTextContent("이 탭에 저장됨");
    expect(screen.getByRole("status", { name: "편집 알림" }).textContent).toBe("");
  });

  it("편집 직후 앱 안 링크(프로젝트로 돌아가기)로 떠나면 디바운스를 기다리지 않고 바로 저장 1회(Codex r1 P2)", () => {
    const { repository, save } = fakeRepository();
    draw(repository);
    act(() => void fireEvent.change(within(editRegion()).getByRole("textbox", { name: /^제목/ }), { target: { value: "떠나기 전 편집" } }));
    act(() => void fireEvent.click(screen.getByRole("link", { name: "프로젝트로 돌아가기" })));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![2]).toMatchObject({ sections: expect.arrayContaining([expect.objectContaining({ slots: expect.objectContaining({ title: "떠나기 전 편집" }) })]) });
  });

  it("바뀐 것이 없으면 링크를 눌러도 저장 0", () => {
    const { repository, save } = fakeRepository();
    draw(repository);
    act(() => void fireEvent.click(screen.getByRole("link", { name: "프로젝트로 돌아가기" })));
    expect(save).not.toHaveBeenCalled();
  });

  it("STALE_DOC → 캔버스 위 ConflictCallout(r7) · 내 편집 유지 · 알림 영역 1개", async () => {
    const latest = sampleDoc({ revision: 7 });
    const { repository } = fakeRepository(async () => {
      throw new ProjectRepositoryError("STALE_DOC", "stale", { doc: latest });
    });
    draw(repository);
    act(() => void fireEvent.change(within(editRegion()).getByRole("textbox", { name: /^제목/ }), { target: { value: "내 편집" } }));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(within(canvas()).getByText("다른 곳에서 이 문서가 바뀌었습니다(r7)")).toBeInTheDocument();
    expect(within(canvas()).getByRole("button", { name: "내 편집으로 저장" })).toBeInTheDocument();
    expect(within(editRegion()).getByRole("textbox", { name: /^제목/ })).toHaveValue("내 편집");
    expect(screen.getAllByRole("status", { name: "편집 알림" })).toHaveLength(1);
  });
});

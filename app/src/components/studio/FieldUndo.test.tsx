import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProjectRepositoryError, type ProjectSnapshot } from "../../data/projectRepository";
import { READ_ONLY_TAB, toInfra } from "../../data/persistence/infra";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { setSlot } from "../../engine/ops/slotOps";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** 필드 편집 묶음 실행 취소 (FIELD-UNDO SPEC r0 · FU-AC-2 · 3 · 5 · 6 · 10 · 12 · 16) — 편집 틀 + 칸 밖 단축키 */
afterEach(restoreViewport);

const navEl = () => screen.getByRole("navigation", { name: "섹션" });
const rowIds = () => [...navEl().querySelectorAll("[data-row-id]")].map((b) => b.getAttribute("data-row-id"));
const pick = (name: string) => act(() => void fireEvent.click(within(navEl()).getByRole("button", { name: new RegExp(`^${name}`) })));
const editPanel = () => within(screen.getByRole("region", { name: /^편집 · / }));
const notice = () => screen.getByRole("status", { name: "편집 알림" });
const box = (label: RegExp) => editPanel().getByRole("textbox", { name: label }) as HTMLInputElement;
const typeIn = (label: RegExp, value: string) => act(() => void fireEvent.change(box(label), { target: { value } }));
const key = async (init: KeyboardEventInit, target: Element = document.body) => {
  let passed = true;
  await act(async () => {
    passed = fireEvent.keyDown(target, init);
    await Promise.resolve();
  });
  return passed;
};
const CTRL_Z = { key: "z", code: "KeyZ", ctrlKey: true };
const REDO = { ...CTRL_Z, key: "Z", shiftKey: true };
/** 청크 응답(리스너 붙음) 기다림 */
const settle = () => act(async () => void (await new Promise<void>((r) => setTimeout(r, 0))));

describe("필드 기록 실행 취소 · 다시 실행 — FU-AC-5 · 6 · 16", () => {
  it("입력만 한 세션: 제목 입력 → blur → 칸 밖 Ctrl+Z = 값 원래대로 + '실행 취소: Hero 제목 편집' · Shift+Ctrl+Z = 다시 · 칸 안 Ctrl+Z 가로채지 않음", async () => {
    await openStudio();
    const original = box(/^제목/).value;
    const statuses = screen.getAllByRole("status").length;
    typeIn(/^제목/, "봄 신메뉴 출시");
    await settle();
    expect(await key(CTRL_Z, box(/^제목/))).toBe(true);
    act(() => void fireEvent.blur(box(/^제목/)));
    expect(notice()).toHaveTextContent(/^$/);
    expect(await key(CTRL_Z)).toBe(false);
    await waitFor(() => expect(box(/^제목/).value).toBe(original));
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 제목 편집$/);
    await key(REDO);
    await waitFor(() => expect(box(/^제목/).value).toBe("봄 신메뉴 출시"));
    expect(notice()).toHaveTextContent(/^다시 실행: Hero 제목 편집$/);
    expect(screen.getAllByRole("status")).toHaveLength(statuses);
  });

  it("페이지 정보 설명 입력 → blur → Ctrl+Z = '실행 취소: 페이지 정보 설명 편집'", async () => {
    await openStudio();
    pick("페이지 정보");
    const original = box(/^설명/).value;
    typeIn(/^설명/, "새 설명");
    await settle();
    act(() => void fireEvent.blur(box(/^설명/)));
    await key(CTRL_Z);
    await waitFor(() => expect(box(/^설명/).value).toBe(original));
    expect(notice()).toHaveTextContent(/^실행 취소: 페이지 정보 설명 편집$/);
  });
});

describe("묶음 닫힘 계기 — FU-AC-2 · 3", () => {
  it("다른 칸 입력(blur 없음) = 앞 묶음 닫힘 · Ctrl+Z 1회 = 부제만 · 2회 = 제목", async () => {
    await openStudio();
    const [title, subtitle] = [box(/^제목/).value, box(/^부제/).value];
    typeIn(/^제목/, "새 제목");
    await settle();
    typeIn(/^부제/, "새 부제");
    await settle();
    await key(CTRL_Z);
    await waitFor(() => expect(box(/^부제/).value).toBe(subtitle));
    expect(box(/^제목/).value).toBe("새 제목");
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 부제 편집$/);
    await key(CTRL_Z);
    await waitFor(() => expect(box(/^제목/).value).toBe(title));
  });

  it("섹션 바꿈(재마운트 · blur 없음) 뒤 다른 섹션 입력 = 따로 기록", async () => {
    await openStudio();
    typeIn(/^제목/, "새 제목");
    await settle();
    pick("About");
    const about = box(/^섹션 제목/).value;
    typeIn(/^섹션 제목/, "새 소개");
    await settle();
    await key(CTRL_Z);
    await waitFor(() => expect(box(/^섹션 제목/).value).toBe(about));
    expect(notice()).toHaveTextContent(/^실행 취소: About 섹션 제목 편집$/);
    await key(CTRL_Z);
    await waitFor(() => expect(notice()).toHaveTextContent(/^실행 취소: Hero 제목 편집$/));
  });

  it("묶음 열린 채(600ms 전 · blur 없음) 섹션 삭제 = 필드 → 연산 순서 · Ctrl+Z 1회 = 삭제만 · 2회 = 글자", async () => {
    await openStudio();
    const ids = rowIds();
    pick("FAQ");
    const original = box(/^섹션 제목/).value;
    typeIn(/^섹션 제목/, "새 질문");
    await settle();
    await act(async () => void fireEvent.click(editPanel().getByRole("button", { name: "삭제" })));
    await waitFor(() => expect(notice()).toHaveTextContent("FAQ를 삭제했습니다"));
    await key(CTRL_Z);
    await waitFor(() => expect(rowIds()).toEqual(ids));
    expect(notice()).toHaveTextContent(/^실행 취소: FAQ 삭제$/);
    pick("FAQ");
    expect(box(/^섹션 제목/).value).toBe("새 질문");
    await key(CTRL_Z);
    await waitFor(() => expect(box(/^섹션 제목/).value).toBe(original));
    expect(notice()).toHaveTextContent(/^실행 취소: FAQ 섹션 제목 편집$/);
  });
});

describe("미리보기 · 읽기 전용 탭 — FU-AC-10 · 12", () => {
  it("묶음 열린 채 미리보기 열기 = 묶음 닫힘 · 편집으로 돌아가 Ctrl+Z = 그 필드 기록", async () => {
    const snap: ProjectSnapshot<PageDoc> = { snapshotId: "snapshot-1", projectId: "project-1", kind: "manual", name: "수동 1", createdAt: "2026-10-06T05:02:00.000Z", doc: sampleDoc(), profileVersion: sampleDoc().profileVersion, candidateId: sampleDoc().candidateId, hash: "h" };
    await openStudio({ repository: { listSnapshots: async () => [snap] } });
    const original = box(/^제목/).value;
    typeIn(/^제목/, "새 제목");
    await settle();
    act(() => void fireEvent.click(screen.getByRole("button", { name: "스냅샷" })));
    const dialog = within(await screen.findByRole("dialog", { name: "스냅샷" }));
    const previewButton = await dialog.findByRole("button", { name: "수동 1 미리보기" });
    act(() => void fireEvent.click(previewButton));
    await screen.findByRole("heading", { name: "스냅샷 '수동 1'를 보고 있습니다 · 편집은 멈췄습니다" });
    expect(await key(CTRL_Z)).toBe(true);
    act(() => void fireEvent.click(screen.getByRole("button", { name: "편집으로 돌아가기" })));
    await waitFor(() => expect(box(/^제목/).value).toBe("새 제목"));
    await key(CTRL_Z);
    await waitFor(() => expect(box(/^제목/).value).toBe(original));
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 제목 편집$/);
  });

  it("읽기 전용 탭(저장 거절 READ_ONLY_TAB)에서도 필드 기록 · 실행 취소 동작 · 저장 0", async () => {
    const { saved } = await openStudio({ repository: { saveDoc: async () => Promise.reject(toInfra(undefined, "저장", READ_ONLY_TAB)) } });
    const original = box(/^제목/).value;
    typeIn(/^제목/, "새 제목");
    await settle();
    act(() => void fireEvent.blur(box(/^제목/)));
    await key(CTRL_Z);
    await waitFor(() => expect(box(/^제목/).value).toBe(original));
    expect(notice()).toHaveTextContent(/^실행 취소: Hero 제목 편집$/);
    expect(saved).toHaveLength(0);
  });
});

describe("기록 밖 문서 교체 — Codex r1 P2-3", () => {
  it("묶음 열린 채 충돌 '다른 편집 불러오기' 뒤 같은 칸 입력 → Ctrl+Z = 불러온 문서(다른 탭 값을 덮지 않음)", async () => {
    const theirs = setSlot(sampleDoc({ revision: 7 }), "s-hero", "subtitle", "다른 탭 부제");
    await openStudio({
      repository: {
        saveDoc: async () => Promise.reject(new ProjectRepositoryError("STALE_DOC", "stale", { doc: theirs })),
        resolveConflict: async () => theirs,
      },
    });
    typeIn(/^제목/, "첫 편집");
    await screen.findByRole("button", { name: "다른 편집 불러오기" }, { timeout: 4000 });
    // 묶음을 열어 둔 채(600ms 안 · blur 없음) 불러오기 → 같은 칸 입력
    typeIn(/^제목/, "첫 편집 둘");
    await settle();
    act(() => void fireEvent.click(screen.getByRole("button", { name: "다른 편집 불러오기" })));
    await waitFor(() => expect(box(/^부제/).value).toBe("다른 탭 부제"));
    const latestTitle = box(/^제목/).value;
    typeIn(/^제목/, `${latestTitle}!`);
    await settle();
    act(() => void fireEvent.blur(box(/^제목/)));
    await key(CTRL_Z);
    await waitFor(() => expect(box(/^제목/).value).toBe(latestTitle));
    expect(box(/^부제/).value).toBe("다른 탭 부제");
  }, 10_000);
});

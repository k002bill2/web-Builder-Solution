import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError, type ProjectRepository, type ProjectSnapshot, type SnapshotKind, type SnapshotReason } from "../../data/projectRepository";
import type { DesignProfileInput } from "../../domain/compareBoard";
import type { ProfileSeries } from "../../domain/profile";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** ER-AC-S3·S4·S6~S10 (EDITOR-REST SPEC r1 3.2 · 7절) — 스냅샷 화면: 대화상자 · 미리보기 · 복원(저장 훅 경로) */
afterEach(() => {
  restoreViewport();
  vi.useRealTimers();
});

const titled = (doc: PageDoc, title: string): PageDoc => ({ ...doc, meta: { ...doc.meta, title } });
const notice = () => screen.getByRole("status", { name: "편집 알림" });
const h1 = () => screen.getByRole("heading", { level: 1 });
const snapButton = () => screen.getByRole("button", { name: "스냅샷" });

/** 상태를 가진 저장소 흉내 — revision 불일치 STALE_DOC · 복원 = "복원 전" 자동 + 새 revision · 쓰기 순서 기록 */
function snapshotRepo(initial: PageDoc, seed: number = 0) {
  let stored = initial;
  const snaps: ProjectSnapshot<PageDoc>[] = [];
  const writes: string[] = [];
  const add = (name: string, kind: SnapshotKind, reason?: SnapshotReason) => {
    const s = { snapshotId: `snapshot-${snaps.length + 1}`, projectId: "project-1", kind, ...(reason && { reason }), name, createdAt: "2026-10-06T05:02:00.000Z", doc: stored, profileVersion: stored.profileVersion, candidateId: stored.candidateId, hash: "h" };
    snaps.push(s);
    return s;
  };
  for (let i = 1; i <= seed; i++) add(`수동 ${i}`, "manual");
  let failSave = false;
  let failRestore = false;
  const repository: Partial<ProjectRepository> = {
    saveDoc: async (_id, revision, next) => {
      writes.push(`save:${revision}`);
      if (failSave) throw new ProjectRepositoryError("INFRA", "fail");
      if (revision !== stored.revision) throw new ProjectRepositoryError("STALE_DOC", "stale", { doc: stored });
      stored = { ...(next as PageDoc), revision: revision + 1 };
      return stored;
    },
    listSnapshots: async () => [...snaps],
    createSnapshot: async (_id, name) => {
      writes.push("create");
      return add(name ?? "수동 · 14:02", "manual");
    },
    restoreSnapshot: async (_id, snapshotId, revision) => {
      writes.push(`restore:${revision}`);
      if (failRestore) throw new ProjectRepositoryError("INFRA", "fail");
      if (revision !== stored.revision) throw new ProjectRepositoryError("STALE_DOC", "stale", { doc: stored });
      const target = snaps.find((s) => s.snapshotId === snapshotId)!;
      add("복원 전 · 14:05", "auto", "restore");
      stored = { ...target.doc, revision: stored.revision + 1 };
      return stored;
    },
  };
  return {
    repository,
    writes,
    snaps,
    stored: () => stored,
    failSave: (on: boolean) => void (failSave = on),
    failRestore: (on: boolean) => void (failRestore = on),
  };
}

const titleField = () => document.getElementById("page-info-title") as HTMLInputElement;
/** 페이지 정보 줄을 골라 SEO 제목 입력칸을 연다(1280 · 1024 섹션 열의 첫 줄) */
const type = (value: string) => {
  if (!titleField()) act(() => void fireEvent.click(screen.getAllByText("페이지 정보")[0]!));
  act(() => void fireEvent.change(titleField(), { target: { value } }));
};
async function openDialog() {
  act(() => void fireEvent.click(snapButton()));
  return within(await screen.findByRole("dialog", { name: "스냅샷" }));
}
async function saveNow(dialog: ReturnType<typeof within>) {
  await act(async () => void fireEvent.click(dialog.getByRole("button", { name: "지금 상태 저장" })));
}
async function previewFirst(dialog: ReturnType<typeof within>, name: string) {
  const button = await dialog.findByRole("button", { name: `${name} 미리보기` });
  act(() => void fireEvent.click(button));
  return screen.findByRole("heading", { name: `스냅샷 '${name}'를 보고 있습니다 · 편집은 멈췄습니다` });
}

describe("만들기 · 미리보기 — ER-AC-S3 · S9", () => {
  it("열면 포커스 = 이름 입력 · 입력 직후 '지금 상태 저장' = 저장 먼저(최신 입력 포함) → 스냅샷 1 · 편집 알림 · 닫기 → 포커스 '스냅샷'", async () => {
    const r = snapshotRepo(sampleDoc());
    await openStudio({ repository: r.repository });
    type("방금 입력");
    const dialog = await openDialog();
    expect(dialog.getByRole("textbox")).toHaveFocus();
    await saveNow(dialog);
    await dialog.findByText("수동 · 14:02");
    expect(r.writes).toEqual([`save:${sampleDoc().revision}`, "create"]);
    expect(r.snaps[0]!.doc.meta.title).toBe("방금 입력");
    expect(notice()).toHaveTextContent("스냅샷 '수동 · 14:02'를 저장했습니다");
    act(() => void fireEvent.click(dialog.getByRole("button", { name: "닫기" })));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(snapButton()).toHaveFocus();
  });

  it("저장 실패면 createSnapshot 0 + 대화상자 안 문장", async () => {
    const r = snapshotRepo(sampleDoc());
    await openStudio({ repository: r.repository });
    r.failSave(true);
    type("방금 입력");
    const dialog = await openDialog();
    await saveNow(dialog);
    expect(await dialog.findByRole("alert")).toHaveTextContent("저장하지 못해 스냅샷을 만들지 않았습니다");
    expect(r.writes).not.toContain("create");
  });

  it("미리보기: 캔버스 = 스냅샷 문서 · 포커스 Callout 제목 · 편집 컨트롤 aria-disabled + 같은 이유 · 입력 무시 · 자동 저장 0 · 돌아가기 → 포커스 '스냅샷' · 잠금 해제", async () => {
    const r = snapshotRepo(titled(sampleDoc(), "스냅샷 때 제목"), 1);
    const { frame } = await openStudio({ doc: titled(sampleDoc(), "지금 제목"), repository: r.repository });
    type("미리보기 직전 입력");
    const dialog = await openDialog();
    const title = await previewFirst(dialog, "수동 1");
    expect(title).toHaveFocus();
    await waitFor(() => expect(frame.lastDoc().meta.title).toBe("스냅샷 때 제목"));
    const savesAtPreview = r.writes.length;
    expect(titleField()).toHaveAttribute("aria-disabled", "true");
    expect(titleField()).toHaveAccessibleDescription("스냅샷을 보는 중에는 편집할 수 없습니다");
    expect(screen.getByRole("button", { name: "검사 · 내보내기" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("스냅샷 보는 중 — 편집 문서 기준 결과")).toBeInTheDocument();
    type("미리보기 중 입력");
    await act(async () => void (await new Promise((res) => setTimeout(res, 2300))));
    expect(r.writes.length).toBe(savesAtPreview);
    expect(r.stored().meta.title).toBe("미리보기 직전 입력");
    act(() => void fireEvent.click(screen.getByRole("button", { name: "편집으로 돌아가기" })));
    expect(snapButton()).toHaveFocus();
    expect(titleField()).not.toHaveAttribute("aria-disabled");
    await waitFor(() => expect(frame.lastDoc().meta.title).toBe("미리보기 직전 입력"));
  }, 10_000);
});

describe("복원 — ER-AC-S4 · S10", () => {
  it("복원 = 저장 훅 경로: 알림('복원 전' 이름) · 포커스 h1 · 다음 편집 저장 STALE 0 · '되돌리기' 1건 = 새 revision 저장", async () => {
    const r = snapshotRepo(titled(sampleDoc(), "스냅샷 때 제목"), 1);
    await openStudio({ doc: titled(sampleDoc(), "지금 제목"), repository: r.repository });
    type("복원 직전 입력");
    const dialog = await openDialog();
    await previewFirst(dialog, "수동 1");
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "이 스냅샷으로 복원" })));
    await waitFor(() => expect(notice()).toHaveTextContent("스냅샷 '수동 1'으로 복원했습니다 · 복원 전 상태는 '복원 전 · 14:05'에 있습니다"));
    expect(h1()).toHaveFocus();
    const base = sampleDoc().revision;
    expect(r.writes).toEqual([`save:${base}`, `restore:${base + 1}`]);
    expect(titleField()).toHaveValue("스냅샷 때 제목");
    type("복원 뒤 편집");
    act(() => void fireEvent.click(screen.getByRole("button", { name: "검사 · 내보내기" })));
    await waitFor(() => expect(r.writes).toContain(`save:${base + 2}`), { timeout: 4000 });
    expect(r.stored().revision).toBe(base + 3);
    expect(r.stored().meta.title).toBe("복원 뒤 편집");
  }, 10_000);

  it("복원 직후 '되돌리기' → 복원 직전 문서를 새 편집으로(새 revision) · 포커스 h1", async () => {
    const r = snapshotRepo(titled(sampleDoc(), "스냅샷 때 제목"), 1);
    await openStudio({ doc: titled(sampleDoc(), "지금 제목"), repository: r.repository });
    const dialog = await openDialog();
    await previewFirst(dialog, "수동 1");
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "이 스냅샷으로 복원" })));
    await waitFor(() => expect(h1()).toHaveFocus());
    act(() => void fireEvent.click(screen.getByRole("button", { name: "되돌리기" })));
    expect(notice()).toHaveTextContent("복원을 되돌렸습니다");
    expect(h1()).toHaveFocus();
    const base = sampleDoc().revision;
    await waitFor(() => expect(r.writes).toContain(`save:${base + 1}`), { timeout: 4000 });
    expect(r.stored().meta.title).toBe("지금 제목");
  }, 10_000);

  it("복원 실패 → role=alert 1회 '복원하지 못했습니다 · 다시 시도' · 미리보기 유지 · 포커스 = 복원 버튼 그대로", async () => {
    const r = snapshotRepo(sampleDoc(), 1);
    await openStudio({ repository: r.repository });
    r.failRestore(true);
    const dialog = await openDialog();
    await previewFirst(dialog, "수동 1");
    const button = screen.getByRole("button", { name: "이 스냅샷으로 복원" });
    act(() => button.focus());
    await act(async () => void fireEvent.click(button));
    await waitFor(() => expect(screen.getAllByRole("alert").filter((el) => el.textContent === "복원하지 못했습니다 · 다시 시도")).toHaveLength(1));
    expect(button).toHaveFocus();
  });
});

const color = (value: string) => ({ $type: "color", $value: value }) as const;
const V1 = "rgb(10, 92, 54)";
const V2 = "rgb(120, 20, 40)";
const versionOf = (version: number, primary: string) => ({
  profileId: "profile-1",
  version,
  origin: "board",
  baseReferenceId: "ref-1",
  base: {
    motion_preset: "L1",
    color_tokens: { primary: color(primary), surface: color("rgb(244, 244, 244)"), ink: color("rgb(26, 26, 26)"), muted: color("rgb(138, 138, 138)"), bg: color("rgb(255, 255, 255)") },
    typography_tokens: { family: "Pretendard", headingWeight: 700, bodyWeight: 400, scale: 1.25 },
    spacing_tokens: { grid: "8pt", sectionGap: 96 },
    component_choices: {},
  } as unknown as DesignProfileInput,
  adjustments: {},
  createdAt: "2026-09-27T00:00:00.000Z",
});
const SERIES = { profileId: "profile-1", latestVersion: 2, versions: [versionOf(1, V1), versionOf(2, V2)] } as unknown as ProfileSeries;

describe("Codex r1 지적 — 복원 중 잠금 · 미리보기 팔레트", () => {
  it("복원 요청 중 '편집으로 돌아가기' = aria-disabled · 눌러도 미리보기 유지 · 상태 문장 → 끝나면 복원 알림(늦은 결과가 입력을 덮지 않는다 — P1)", async () => {
    const r = snapshotRepo(titled(sampleDoc(), "스냅샷 때 제목"), 1);
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));
    const restore = r.repository.restoreSnapshot!;
    r.repository.restoreSnapshot = async (...args) => (await gate, restore(...args));
    const { frame } = await openStudio({ doc: titled(sampleDoc(), "지금 제목"), repository: r.repository });
    const dialog = await openDialog();
    await previewFirst(dialog, "수동 1");
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "이 스냅샷으로 복원" })));
    const back = screen.getByRole("button", { name: "편집으로 돌아가기" });
    await waitFor(() => expect(back).toHaveAttribute("aria-disabled", "true"));
    expect(screen.getByText("복원하는 중입니다 · 끝나면 편집으로 돌아갑니다")).toBeInTheDocument();
    act(() => void fireEvent.click(back));
    expect(screen.getByRole("heading", { name: "스냅샷 '수동 1'를 보고 있습니다 · 편집은 멈췄습니다" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "검사 · 내보내기" })).toHaveAttribute("aria-disabled", "true");
    await act(async () => release());
    await waitFor(() => expect(notice()).toHaveTextContent("스냅샷 '수동 1'으로 복원했습니다"));
    await waitFor(() => expect(frame.lastDoc().meta.title).toBe("스냅샷 때 제목"));
  });

  it("미리보기 캔버스 kitTokens = 스냅샷 profileVersion 팔레트 · 돌아가면 편집 문서 버전 팔레트(P2)", async () => {
    const r = snapshotRepo(sampleDoc({ profileVersion: 1 }), 1);
    const { frame } = await openStudio({ doc: sampleDoc({ profileVersion: 2 }), series: SERIES, repository: r.repository });
    await waitFor(() => expect(frame.lastKitTokens()?.palette.primary).toBe(V2));
    const dialog = await openDialog();
    await previewFirst(dialog, "수동 1");
    await waitFor(() => expect(frame.lastDoc().profileVersion).toBe(1));
    expect(frame.lastKitTokens()?.palette.primary).toBe(V1);
    act(() => void fireEvent.click(screen.getByRole("button", { name: "편집으로 돌아가기" })));
    await waitFor(() => expect(frame.lastDoc().profileVersion).toBe(2));
    expect(frame.lastKitTokens()?.palette.primary).toBe(V2);
  });
});

describe("목록 · 좁은 폭 — ER-AC-S1(화면) · S7 · 7절", () => {
  it("12개 → 최신 10개 + '이전 스냅샷 2개 더 보기' → 누르면 버튼이 사라지고 포커스 = 새로 보인 첫 스냅샷 '미리보기'", async () => {
    const r = snapshotRepo(sampleDoc(), 12);
    await openStudio({ repository: r.repository });
    const dialog = await openDialog();
    await dialog.findByText("수동 12");
    expect(dialog.getAllByRole("button", { name: /미리보기$/ })).toHaveLength(10);
    act(() => void fireEvent.click(dialog.getByRole("button", { name: "이전 스냅샷 2개 더 보기" })));
    expect(dialog.queryByRole("button", { name: /더 보기/ })).toBeNull();
    expect(dialog.getByRole("button", { name: "수동 2 미리보기" })).toHaveFocus();
  });

  it("'내보내기 전' 자동 스냅샷이 종류 글자와 함께 보이고 미리보기 된다", async () => {
    const r = snapshotRepo(titled(sampleDoc(), "내보낸 제목"));
    r.snaps.push({ ...r.snaps[0]!, ...{ snapshotId: "snapshot-1", projectId: "project-1", kind: "auto", reason: "export", name: "내보내기 전 · 14:00", createdAt: "2026-10-06T05:00:00.000Z", doc: titled(sampleDoc(), "내보낸 제목"), profileVersion: 1, candidateId: "B", hash: "h" } });
    await openStudio({ repository: r.repository });
    const dialog = await openDialog();
    expect(await dialog.findByText(/^자동 · 내보내기 전 · /)).toBeInTheDocument();
    expect(await previewFirst(dialog, "내보내기 전 · 14:00")).toHaveFocus();
  });

  it.each([390, 1024])("폭 %ipx → 대화상자 정확히 1개", async (width) => {
    await openStudio({ width, repository: snapshotRepo(sampleDoc()).repository });
    act(() => void fireEvent.click(snapButton()));
    expect(await screen.findAllByRole("dialog", { name: "스냅샷" })).toHaveLength(1);
  });

  it("390 미리보기 중 '편집' 탭으로 바꿔 새로 그린 필드도 잠김", async () => {
    const r = snapshotRepo(sampleDoc(), 1);
    await openStudio({ width: 390, repository: r.repository });
    const dialog = await openDialog();
    await previewFirst(dialog, "수동 1");
    act(() => void fireEvent.click(screen.getByRole("tab", { name: "편집" })));
    await waitFor(() => expect(screen.getByRole("tabpanel").querySelector("input, textarea")).toHaveAttribute("aria-disabled", "true"));
  });
});

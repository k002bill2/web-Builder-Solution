import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError, type ExportJob, type ProjectRepository } from "../../data/projectRepository";
import type { ProfileSeries } from "../../domain/profile";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { passingDoc, withPhoto } from "../../engine/testing/gateKit";
import { section, withSections } from "../../engine/testing/sampleDoc";
import { sampleTheme } from "../../engine/testing/sampleTheme";
import { EDITOR_EVENT, type EditorEvent } from "../../features/studio/editorEvents";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

afterEach(restoreViewport);

const SERIES = { profileId: "profile-1", latestVersion: 2, versions: [sampleTheme().profile] } as unknown as ProfileSeries;
/** 게이트 통과 + 렌더러 있는 섹션만(샘플에서 CTA Band 폴백을 뺀 본문 5개) */
const clean = (over: Partial<PageDoc> = {}) => {
  const doc = passingDoc(over);
  return withSections(doc, doc.sections.filter((s) => s.type !== "cta-band"));
};
const gateRegion = () => screen.getByRole("region", { name: "품질 게이트" });
const zip = () => within(gateRegion()).getByRole("button", { name: /React 프로젝트\(zip\) 내보내기|내보내는 중…/ });
const html = () => within(gateRegion()).getByRole("button", { name: /정적 HTML 내보내기|내보내는 중…/ });

async function open(doc: PageDoc, repository: Partial<ProjectRepository> = {}) {
  const requestExport = vi.fn(repository.requestExport ?? (async () => Promise.reject(new ProjectRepositoryError("GENERATOR_UNAVAILABLE", "기본"))));
  const studio = await openStudio({ doc, series: SERIES, repository: { ...repository, requestExport } });
  await waitFor(() => expect(within(gateRegion()).queryByText("검사하는 중입니다")).not.toBeInTheDocument());
  return { ...studio, requestExport };
}
function listen() {
  const events: EditorEvent[] = [];
  const handler = (e: Event) => events.push((e as CustomEvent<EditorEvent>).detail);
  window.addEventListener(EDITOR_EVENT, handler);
  return { events, stop: () => window.removeEventListener(EDITOR_EVENT, handler) };
}

describe("버튼 사전 차단 · 이유 (SPEC 5.13 · m2a 3.2 A · E-AC-29·50 · K-AC-18)", () => {
  it("게이트 차단 + 폴백 → 두 버튼 aria-disabled · 이유 ul 순서 게이트 → 구조 미리보기 · aria-describedby 같은 순서 · 눌러도 요청 0", async () => {
    const { requestExport } = await open(withSections(passingDoc(), passingDoc().sections.map((s) => (s.type === "hero" ? withPhoto(section("hero", "fullbleed-left", "s-hero")) : s))));
    for (const button of [zip(), html()]) {
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAttribute("aria-describedby", "export-reason-gate export-reason-fallback");
    }
    const reasons = within(within(gateRegion()).getByRole("list", { name: "내보낼 수 없는 이유" })).getAllByRole("listitem");
    expect(reasons.map((li) => li.querySelector("p")!.id)).toEqual(["export-reason-gate", "export-reason-fallback"]);
    expect(reasons[0]!.textContent).toMatch(/^차단 1건\(대체텍스트: .+\) — 고치면 열립니다첫 차단으로 이동$/);
    expect(reasons[1]!.querySelector("p")!.textContent).toBe("구조 미리보기 섹션 1개(CTA Band)가 있어 내보낼 수 없습니다 — 실제 렌더가 있는 변형으로 바꾸거나 지우면 열립니다");
    act(() => void fireEvent.click(zip()));
    act(() => void fireEvent.click(html()));
    expect(requestExport).not.toHaveBeenCalled();
  });

  it("폴백만 → 구조 미리보기 이유 1개 · '첫 구조 미리보기 섹션으로 이동' → 그 섹션 선택 + 편집 패널 머리 포커스", async () => {
    await open(passingDoc());
    expect(html()).toHaveAttribute("aria-describedby", "export-reason-fallback");
    act(() => void fireEvent.click(within(gateRegion()).getByRole("button", { name: "첫 구조 미리보기 섹션으로 이동" })));
    const head = await screen.findByRole("heading", { level: 2, name: "편집 · CTA Band" });
    await waitFor(() => expect(document.activeElement).toBe(head));
  });

  it("'첫 차단으로 이동' → 첫 차단 줄 이동과 같은 곳(대체텍스트 → 그 섹션 편집 패널 머리)", async () => {
    await open(withSections(clean(), clean().sections.map((s) => (s.type === "hero" ? withPhoto(section("hero", "fullbleed-left", "s-hero")) : s))));
    expect(html()).toHaveAttribute("aria-describedby", "export-reason-gate");
    act(() => void fireEvent.click(within(gateRegion()).getByRole("button", { name: "첫 차단으로 이동" })));
    const head = await screen.findByRole("heading", { level: 2, name: "편집 · Hero" });
    await waitFor(() => expect(document.activeElement).toBe(head));
  });
});

describe("내보내기 시작 · 결과 (SPEC 5.13 · E-S24 · E-S27 · E-AC-28·29·30 · 9절)", () => {
  it("통과 → 바로 requestExport 1회(저장된 revision) · GENERATOR_UNAVAILABLE = 형식별 informative 문구(alert 아님) · 계측 · 스냅샷 이벤트 0", async () => {
    const { requestExport } = await open(clean());
    const { events, stop } = listen();
    act(() => void fireEvent.click(html()));
    await within(gateRegion()).findByText(/^정적 HTML은 생성기 연결 후\(다음 단계\) 내보낼 수 있습니다\. 지금 문서는 이 탭에 저장돼 있습니다/);
    expect(requestExport).toHaveBeenCalledTimes(1);
    expect(requestExport).toHaveBeenCalledWith("project-1", "static-html", 3);
    expect(within(gateRegion()).queryByRole("alert")).not.toBeInTheDocument();
    act(() => void fireEvent.click(zip()));
    await within(gateRegion()).findByText(/^React 프로젝트\(zip\)는 코드 생성기 연결 후\(M4\) 내보낼 수 있습니다/);
    stop();
    expect(events.map((e) => e.name)).toEqual(["export_requested", "export_failed", "export_requested", "export_failed"]);
    expect(events[1]).toEqual({ name: "export_failed", reason: "GENERATOR_UNAVAILABLE" });
  });

  it("경고만 → 확인 대화상자(경고 목록) · 취소 = 요청 0 · '경고를 확인했습니다 · 내보내기' = 요청 1", async () => {
    const { requestExport } = await open(clean({ meta: { title: "가".repeat(80), description: "브랜드를 소개하는 페이지입니다." } }));
    expect(html()).not.toHaveAttribute("aria-disabled");
    act(() => void fireEvent.click(html()));
    const dialog = await screen.findByRole("dialog", { name: "경고 1건이 있습니다" });
    expect(within(dialog).getByText(/^SEO 메타 · /)).toBeInTheDocument();
    act(() => void fireEvent.click(within(dialog).getByRole("button", { name: "취소" })));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(requestExport).not.toHaveBeenCalled();
    act(() => void fireEvent.click(html()));
    const again = await screen.findByRole("dialog");
    act(() => void fireEvent.click(within(again).getByRole("button", { name: "경고를 확인했습니다 · 내보내기" })));
    await waitFor(() => expect(requestExport).toHaveBeenCalledTimes(1));
  });

  // M2A-3a-fix F2 (Codex P2 1): `open` 속성이 있으면 showModal()이 돌지 않아 비모달 — 배경 조작·Esc 0
  it("경고 확인 대화상자 = showModal()(모달) · Esc(cancel) = 취소 · 요청 0 · 닫히면 여는 버튼으로 포커스 복귀", async () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    try {
      const { requestExport } = await open(clean({ meta: { title: "가".repeat(80), description: "브랜드를 소개하는 페이지입니다." } }));
      act(() => html().focus());
      act(() => void fireEvent.click(html()));
      const dialog = await screen.findByRole("dialog", { name: "경고 1건이 있습니다" });
      expect(showModal).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "경고를 확인했습니다 · 내보내기" }));
      act(() => void fireEvent(dialog, new Event("cancel", { cancelable: true })));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(requestExport).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(html());
    } finally {
      showModal.mockRestore();
    }
  });

  it("편집 직후(결과 오래됨 · 저장 전 변경) → 다시 검사 → 저장 먼저 → 저장된 revision으로 요청 1회 (E-AC-28·30)", async () => {
    const { requestExport, saved } = await open(clean());
    act(() => void fireEvent.click(screen.getByRole("button", { name: /^페이지 정보/ })));
    act(() => void fireEvent.change(screen.getByRole("textbox", { name: /^제목/ }), { target: { value: "새 제목" } }));
    expect(within(gateRegion()).getByRole("list", { name: "검사 항목" })).toHaveAttribute("aria-busy", "true");
    act(() => void fireEvent.click(html()));
    await waitFor(() => expect(requestExport).toHaveBeenCalledTimes(1));
    expect(saved).toHaveLength(1);
    expect(saved[0]!.meta.title).toBe("새 제목");
    expect(requestExport).toHaveBeenCalledWith("project-1", "static-html", 4);
  });

  it("재시도 가능 실패(JOB_TIMEOUT) → alert '내보내지 못했습니다' + '다시 시도'(같은 요청 다시) · 새 스냅샷이면 snapshot_created 1회", async () => {
    const job: ExportJob = { jobId: "export-1", format: "static-html", docRevision: 3, state: "queued", retryable: false };
    const requestExport = vi.fn(async () => ({ job, snapshotId: "snapshot-1", snapshotName: "내보내기 전 · 14:02", wrote: requestExport.mock.calls.length === 1 }));
    const getExportJob = async () => ({ ...job, state: "failed" as const, errorCode: "JOB_TIMEOUT" as const, retryable: true });
    const { events, stop } = listen();
    await open(clean(), { requestExport, getExportJob });
    act(() => void fireEvent.click(html()));
    const alert = await within(gateRegion()).findByRole("alert");
    expect(alert.textContent).toContain("내보내지 못했습니다");
    act(() => void fireEvent.click(within(alert).getByRole("button", { name: "다시 시도" })));
    await waitFor(() => expect(requestExport).toHaveBeenCalledTimes(2));
    await within(gateRegion()).findByRole("alert");
    stop();
    expect(events.filter((e) => e.name === "snapshot_created")).toHaveLength(1);
  });

  // M2A-3a-fix F4 (Codex P2 4): "다시 시도"는 실패 요청의 revision이 지금 문서와 같을 때만 같은 잡 — 다르면 일반 시작 흐름
  const failingExport = () => {
    const job: ExportJob = { jobId: "export-1", format: "static-html", docRevision: 3, state: "queued", retryable: false };
    const requestExport = vi.fn(async () => ({ job, snapshotId: "snapshot-1", snapshotName: "내보내기 전 · 14:02", wrote: true }));
    const getExportJob = async () => ({ ...job, state: "failed" as const, errorCode: "JOB_TIMEOUT" as const, retryable: true });
    return { requestExport, getExportJob };
  };
  async function failOnce(repository: ReturnType<typeof failingExport>) {
    const studio = await open(clean(), repository);
    act(() => void fireEvent.click(html()));
    await within(gateRegion()).findByRole("alert");
    act(() => void fireEvent.click(screen.getByRole("button", { name: /^페이지 정보/ })));
    return studio;
  }

  it("실패 뒤 미저장 편집 → '다시 시도' = 일반 시작 흐름: 다시 검사 → 저장 먼저 → 새 revision으로 요청", async () => {
    const repository = failingExport();
    const { saved } = await failOnce(repository);
    act(() => void fireEvent.change(screen.getByRole("textbox", { name: /^제목/ }), { target: { value: "새 제목" } }));
    act(() => void fireEvent.click(within(within(gateRegion()).getByRole("alert")).getByRole("button", { name: "다시 시도" })));
    await waitFor(() => expect(repository.requestExport).toHaveBeenCalledTimes(2));
    expect(saved).toHaveLength(1);
    expect(saved[0]!.meta.title).toBe("새 제목");
    expect(repository.requestExport).toHaveBeenLastCalledWith("project-1", "static-html", 4);
  });

  it("실패 뒤 차단이 생기는 미저장 편집(SEO 제목 비움) → '다시 시도' = 다시 검사 → 차단이라 요청 0", async () => {
    const repository = failingExport();
    await failOnce(repository);
    act(() => void fireEvent.change(screen.getByRole("textbox", { name: /^제목/ }), { target: { value: "" } }));
    act(() => void fireEvent.click(within(within(gateRegion()).getByRole("alert")).getByRole("button", { name: "다시 시도" })));
    await waitFor(() => expect(within(gateRegion()).getByRole("list", { name: "검사 항목" })).not.toHaveAttribute("aria-busy"));
    await act(async () => void (await new Promise((resolve) => setTimeout(resolve, 50))));
    expect(within(gateRegion()).getAllByText(/^차단/).length).toBeGreaterThan(0);
    expect(repository.requestExport).toHaveBeenCalledTimes(1);
  });

  it("UNRENDERED_SECTIONS(경쟁 방어 경로) → cautionary role=status 문구 + 결과 첫 instanceId로 이동 · 다시 시도 없음", async () => {
    const requestExport = async () => Promise.reject(new ProjectRepositoryError("UNRENDERED_SECTIONS", "1", { sections: ["s-about"] }));
    await open(clean(), { requestExport });
    act(() => void fireEvent.click(html()));
    const status = await within(gateRegion()).findByText("구조 미리보기 섹션 1개가 있어 내보내지 않았습니다 — 실제 렌더가 있는 변형으로 바꾸거나 지운 뒤 다시 내보내세요");
    expect(status.closest('[role="status"]')).not.toBeNull();
    expect(within(gateRegion()).queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
    act(() => void fireEvent.click(within(gateRegion()).getByRole("button", { name: "첫 구조 미리보기 섹션으로 이동" })));
    await screen.findByRole("heading", { level: 2, name: "편집 · About" });
  });
});

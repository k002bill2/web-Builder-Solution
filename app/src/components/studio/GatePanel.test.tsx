import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProfileSeries } from "../../domain/profile";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { GATE_ROWS } from "../../engine/contracts/records";
import { passingDoc } from "../../engine/testing/gateKit";
import { sampleDoc, withSections } from "../../engine/testing/sampleDoc";
import { CAFE_PALETTE, sampleTheme } from "../../engine/testing/sampleTheme";
import { EDITOR_EVENT, type EditorEvent } from "../../features/studio/editorEvents";
import { GATE_ROW_NAMES } from "../../features/studio/gateView";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

afterEach(restoreViewport);

/** 문서 profileVersion 2 = sampleTheme 버전 — 게이트 테마가 있는 계열 */
const seriesOf = (palette = sampleTheme().profile.base.color_tokens): ProfileSeries => {
  const profile = { ...sampleTheme().profile, base: { ...sampleTheme().profile.base, color_tokens: palette } };
  return { profileId: "profile-1", latestVersion: 2, versions: [profile] } as unknown as ProfileSeries;
};
const SERIES = seriesOf();
/** <1024는 "검사" 탭이 숨어 있을 수 있다 — 영역·목록은 숨김 포함으로 찾는다 */
const gateRegion = () => screen.getByRole("region", { name: "품질 게이트", hidden: true });
const gateList = () => within(gateRegion()).getByRole("list", { name: "검사 항목", hidden: true });
const rowItem = (id: (typeof GATE_ROWS)[number]) => gateList().querySelector<HTMLElement>(`[data-gate-row="${id}"]`)!;
const rowButton = (name: string) => within(gateList()).getByRole("button", { name: new RegExp(`^${name}`) });

async function openGate(doc: PageDoc, width = 1280, series = SERIES) {
  const studio = await openStudio({ doc, width, series });
  await waitFor(() => expect(within(gateRegion()).queryByText("검사하는 중입니다")).not.toBeInTheDocument());
  return studio;
}

describe("게이트 8줄 표시 (SPEC 5.12 · E-S22~E-S25 · E-AC-25·27)", () => {
  it("진입 직후 자동 계산 — 8줄 GATE_ROWS 순서 · 줄마다 상태 단어 · 성능 예산 '측정 전'은 버튼 아님 + '생성기 연결 후 측정합니다'", async () => {
    await openGate(passingDoc());
    const items = within(gateList()).getAllByRole("listitem").filter((li) => li.hasAttribute("data-gate-row"));
    expect(items.map((li) => li.getAttribute("data-gate-row"))).toEqual([...GATE_ROWS]);
    for (const li of items) expect(li.textContent).toMatch(/통과|경고 \d+|차단 \d+|측정 전/);
    const perf = rowItem("performance");
    expect(perf.textContent).toContain("성능 예산측정 전");
    expect(within(perf).queryByRole("button")).not.toBeInTheDocument();
    expect(within(perf).getByText("생성기 연결 후 측정합니다")).toBeInTheDocument();
    // E-S22 통과 — 머리 Tag "통과" · 문제 줄 버튼 0
    expect(within(gateRegion()).getByText("통과", { selector: "span.font-semibold" })).toBeInTheDocument();
    expect(within(gateList()).queryAllByRole("button")).toHaveLength(0);
  });

  it("E-AC-25 조건 재현 — 대체텍스트 없음·SEO 설명 빈 값 = 차단 · SEO 제목 권장 초과 = 경고 · 대비 미달 = 차단 · 머리 Tag 개수", async () => {
    const doc = sampleDoc({ meta: { title: "가".repeat(80), description: "" } });
    await openGate(doc, 1280, seriesOf(sampleTheme({ palette: CAFE_PALETTE }).profile.base.color_tokens));
    expect(rowItem("alt-text").textContent).toMatch(/대체텍스트차단 \d+/);
    expect(rowItem("seo-meta").textContent).toMatch(/SEO 메타차단 1/);
    expect(rowItem("contrast").textContent).toMatch(/대비 AA차단 1/);
    expect(within(rowItem("seo-meta")).getByText(/원인 · 대체안 2건/)).toBeInTheDocument();
    expect(rowItem("heading-order").textContent).toContain("통과");
    // 머리 Tag = "차단 n · 경고 1"
    expect(within(gateRegion()).getByText(/^차단 \d+ · 경고 1$/)).toBeInTheDocument();
    // 문제 줄은 button, 통과 줄은 글자만
    expect(within(rowItem("alt-text")).getByRole("button")).toBeInTheDocument();
    expect(within(rowItem("heading-order")).queryByRole("button")).not.toBeInTheDocument();
  });

  it("E-AC-27 Q14 — 점은 모두 aria-hidden · 줄 이름표는 5.12 표 이름", async () => {
    await openGate(sampleDoc());
    const dots = gateList().querySelectorAll('[class*="bg-status-"]');
    expect(dots.length).toBeGreaterThanOrEqual(7);
    for (const dot of dots) expect(dot.getAttribute("aria-hidden")).toBe("true");
    for (const id of GATE_ROWS) expect(rowItem(id).textContent).toContain(GATE_ROW_NAMES[id]);
  });

  it("E-AC-28 재검사 — 편집 직후 목록 aria-busy + '편집 전 기준' 캡션 → 500ms 디바운스 뒤 해제", async () => {
    await openGate(passingDoc());
    act(() => void fireEvent.click(screen.getByRole("button", { name: /^페이지 정보/ })));
    const title = await screen.findByRole("textbox", { name: /^제목/ });
    act(() => void fireEvent.change(title, { target: { value: "" } }));
    expect(gateList()).toHaveAttribute("aria-busy", "true");
    expect(within(gateRegion()).getByText("편집 전 기준 결과입니다 · 다시 검사하는 중")).toBeInTheDocument();
    await waitFor(() => expect(gateList()).not.toHaveAttribute("aria-busy"), { timeout: 1500 });
    expect(within(gateRegion()).queryByText(/편집 전 기준/)).not.toBeInTheDocument();
    expect(rowItem("seo-meta").textContent).toMatch(/SEO 메타차단 1/);
  });

  it("테마(프로필 버전)가 없으면 계산하지 않고 '검사하는 중입니다' — 예외 0", async () => {
    await openStudio({ doc: sampleDoc(), series: undefined });
    expect(within(gateRegion()).getByText("검사하는 중입니다")).toBeInTheDocument();
  });
});

describe("줄 → 이동 · 툴바 '검사 · 내보내기' (E-AC-26 · E-S23 · E-S26)", () => {
  it("SEO 줄 → '페이지 정보' 선택 + 설명 입력칸 포커스", async () => {
    await openGate(sampleDoc({ meta: { title: "브랜드 홈", description: "" } }));
    act(() => void fireEvent.click(rowButton("SEO 메타")));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /^설명/ })));
    expect(screen.getByRole("heading", { level: 2, name: "편집 · 페이지 정보" })).toBeInTheDocument();
  });

  it("대체텍스트 줄(이미지 슬롯 — 입력칸 없음) → 그 섹션 선택 + 편집 패널 머리 포커스", async () => {
    await openGate(sampleDoc());
    act(() => void fireEvent.click(rowButton("대체텍스트")));
    const head = await screen.findByRole("heading", { level: 2, name: "편집 · Hero" });
    await waitFor(() => expect(document.activeElement).toBe(head));
  });

  it("글자 수 줄 → 그 섹션 선택 + 그 필드 포커스", async () => {
    const doc = sampleDoc();
    const about = doc.sections.find((s) => s.instanceId === "s-about")!;
    const long = withSections(passingDoc(), passingDoc().sections.map((s) => (s.instanceId === "s-about" ? { ...about, slots: { ...about.slots, heading: "" } } : s)));
    await openGate(long);
    act(() => void fireEvent.click(rowButton("글자 수")));
    await waitFor(() => expect(document.activeElement?.id).toBe("field-s-about-heading"));
    expect(screen.getByRole("heading", { level: 2, name: /^편집 · / }).textContent).not.toBe("편집 · Hero");
  });

  it("<1024 — 문제 줄 → '편집' 탭으로 바꾼 뒤 포커스", async () => {
    await openGate(sampleDoc({ meta: { title: "브랜드 홈", description: "" } }), 390);
    act(() => void fireEvent.click(screen.getByRole("tab", { name: "검사" })));
    act(() => void fireEvent.click(rowButton("SEO 메타")));
    await waitFor(() => expect(screen.getByRole("tab", { name: "편집" })).toHaveAttribute("aria-selected", "true"));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /^설명/ })));
  });

  it("툴바 '검사 · 내보내기'(≥1024) → h2 '품질 게이트' 포커스 + 요약 알림 1회 + gate_checked(개수만)", async () => {
    await openGate(sampleDoc({ meta: { title: "브랜드 홈", description: "" } }));
    const events: EditorEvent[] = [];
    const listen = (e: Event) => events.push((e as CustomEvent<EditorEvent>).detail);
    window.addEventListener(EDITOR_EVENT, listen);
    act(() => void fireEvent.click(screen.getByRole("button", { name: "검사 · 내보내기" })));
    window.removeEventListener(EDITOR_EVENT, listen);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2, name: "품질 게이트" })));
    expect(screen.getByRole("status", { name: "편집 알림" }).textContent).toMatch(/^품질 게이트 차단 \d+ — 첫 차단: 대체텍스트$/);
    expect(events).toEqual([expect.objectContaining({ name: "gate_checked", warn_count: 0 })]);
    expect(Object.keys(events[0]!).sort()).toEqual(["block_count", "name", "warn_count"]);
  });

  it("툴바 '검사'(<1024, 접근 이름 '검사 · 내보내기') → '검사' 탭 선택 + 요약 알림", async () => {
    await openGate(passingDoc(), 390);
    const button = screen.getByRole("button", { name: "검사 · 내보내기" });
    expect(button.textContent).toBe("검사");
    act(() => void fireEvent.click(button));
    await waitFor(() => expect(screen.getByRole("tab", { name: "검사" })).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByRole("status", { name: "편집 알림" }).textContent).toBe("품질 게이트 통과 — 내보내기 버튼으로 이동합니다");
  });
});

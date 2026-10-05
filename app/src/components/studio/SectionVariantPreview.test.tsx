import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/**
 * M2B-2c 이관 (SectionVariant.test "렌더러 없는 변형 … 구조 미리보기"에서 옮김): 30/30이면 변형 선택지(= 엔진 정의)가 모두 실렌더라
 * 접미어 분기(3.2 C · MQ-3)는 실데이터로 도달할 수 없다 → 부모 렌더러 목록에서 contact/booking만 뺀 목록을 주입해 같은 단언을 유지한다.
 */
const UNRENDERED = vi.hoisted(() => "contact/booking");
vi.mock("../../features/studio/renderedVariants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../features/studio/renderedVariants")>();
  return { RENDERED_VARIANTS: Object.freeze(actual.RENDERED_VARIANTS.filter((key) => key !== UNRENDERED)) };
});
afterEach(restoreViewport);

const editPanel = () => within(screen.getByRole("region", { name: /^편집 · / }));

describe("변형 교체 — 렌더러 없는 변형 접미어 (이관)", () => {
  it("렌더러 없는 변형 이름 뒤 ' · 구조 미리보기'(3.2 C · MQ-3) — 접근 이름에도 · 렌더러 있는 변형(문의 폼 · services 4변형)은 없음 · 머리 '변형:'은 그대로 · 전제: 주입 목록에만 없음", async () => {
    const actual = (await vi.importActual<typeof import("../../features/studio/renderedVariants")>("../../features/studio/renderedVariants")).RENDERED_VARIANTS;
    expect(actual).toContain(UNRENDERED);
    expect((await import("../../features/studio/renderedVariants")).RENDERED_VARIANTS).not.toContain(UNRENDERED);
    await openStudio();
    const nav = within(screen.getByRole("navigation", { name: "섹션" }));
    const open = async () => {
      const details = editPanel().getByText("변형 바꾸기").closest("details")!;
      await act(async () => {
        details.open = true;
        details.dispatchEvent(new Event("toggle"));
      });
      return within(await editPanel().findByRole("radiogroup", { name: "변형" }));
    };
    act(() => void fireEvent.click(nav.getByRole("button", { name: /^Services/ })));
    const services = await open();
    for (const name of ["카드 3개", "목록형", "카드 2열", "카드 벽돌형"]) expect(services.getByRole("radio", { name })).toBeInTheDocument();
    act(() => void fireEvent.click(nav.getByRole("button", { name: /^Contact/ })));
    const list = await open();
    expect(list.getByRole("radio", { name: "문의 폼" })).toBeInTheDocument();
    expect(list.getByRole("radio", { name: "예약 폼 · 구조 미리보기" })).toBeInTheDocument();
    const labels = list.getAllByRole("radio").map((r) => document.getElementById(r.getAttribute("aria-labelledby")!)!.textContent!);
    expect(labels.filter((label) => label.endsWith(" · 구조 미리보기"))).toHaveLength(1);
    expect(editPanel().getByText("변형: 문의 폼")).toBeInTheDocument();
  });
});

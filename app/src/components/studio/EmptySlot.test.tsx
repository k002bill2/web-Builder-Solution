import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** K7 빈 슬롯 (E-AC-24 · SPEC 5.6 · 5.7 · E-S21). 게이트 "글자 수" 줄 차단("Hero 제목이 비어 있습니다")은 a4 게이트 표시와 함께 — 이 레인은 캔버스·필드 수준 */
afterEach(restoreViewport);

const editPanel = () => within(screen.getByRole("region", { name: /^편집 · / }));

describe("빈 슬롯 (E-AC-24)", () => {
  it("글자를 모두 지우면 캔버스 자리표시 '제목을 입력하세요'(label-alternative) · 필수 오류는 blur 때만", async () => {
    const { frame } = await openStudio();
    const title = editPanel().getByRole("textbox", { name: /^제목/ });
    act(() => void fireEvent.change(title, { target: { value: "" } }));
    // 자리표시 그리기(글자·label-alternative)는 렌더 문서 — render/fallback/FallbackCanvas.test.tsx로 옮김. 부모는 빈 값을 render로 보낸다
    expect(frame.lastDoc().sections[1]!.slots.title).toBe("");
    // 입력 중에는 알리지 않는다
    expect(title).not.toHaveAttribute("aria-invalid");
    expect(editPanel().queryByText("필수 입력입니다")).toBeNull();
    act(() => void fireEvent.blur(title));
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription(expect.stringContaining("필수 입력입니다"));
    // 다시 채우면 자리표시가 실제 글자로
    act(() => void fireEvent.change(title, { target: { value: "새 제목" } }));
    expect(frame.lastDoc().sections[1]!.slots.title).toBe("새 제목");
  });

  it("선택 섹션이 아니어도 빈 글자 슬롯마다 자리표시 — 부제를 비우면 '부제를 입력하세요'", async () => {
    const { frame } = await openStudio();
    act(() => void fireEvent.change(editPanel().getByRole("textbox", { name: /^부제/ }), { target: { value: "  " } }));
    expect(frame.lastDoc().sections[1]!.slots.subtitle).toBe("  ");
  });
});

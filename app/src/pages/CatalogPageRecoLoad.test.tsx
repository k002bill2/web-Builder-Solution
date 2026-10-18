/**
 * RECO-AC-14(a) 번들 분류 근거 — 추천 화면 청크는 `tab=rec`일 때만, 적용 청크는 "이 추천 적용" 누름 뒤에만 받는다.
 * 로더 모듈(recoLoader·recoApplyLoader)을 감싸 호출 수를 센다(기본 = 실제 import). 검사기 크기 판정은 이 로드 조건을 증명하지 못한다(SPEC 5절).
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderApp } from "../test/renderApp";

const loads = vi.hoisted(() => ({ view: vi.fn(), apply: vi.fn() }));
vi.mock("../components/reco/recoLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../components/reco/recoLoader")>();
  loads.view.mockImplementation(actual.loadRecoView);
  return { loadRecoView: loads.view };
});
vi.mock("../components/reco/recoApplyLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../components/reco/recoApplyLoader")>();
  loads.apply.mockImplementation(actual.loadRecoApply);
  return { loadRecoApply: loads.apply };
});

describe("추천 번들 분류 근거 — tab=all 진입에 추천 청크 요청 0", () => {
  it("tab=all 0 → '추천 받기' 뒤 화면 청크 1 · 적용 청크는 '이 추천 적용' 누름 뒤에만", async () => {
    renderApp("/catalog?industry=medical&purpose=booking");
    await screen.findAllByRole("article");
    expect(loads.view).not.toHaveBeenCalled();
    expect(loads.apply).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "추천 받기" }));
    const region = await screen.findByRole("region", { name: "추천 결과" });
    const first = (await within(region).findAllByRole("article"))[0]!;
    expect(loads.view).toHaveBeenCalledTimes(1);
    await userEvent.click(within(first).getByRole("button", { name: "근거 펼치기" }));
    expect(loads.apply).not.toHaveBeenCalled();

    await userEvent.click(within(first).getByRole("button", { name: "이 추천 적용" }));
    await screen.findByRole("dialog");
    expect(loads.apply).toHaveBeenCalledTimes(1);
  });

  it("화면 청크 로드 실패면 결과 영역 alert + 다시 시도 → 카드", async () => {
    loads.view.mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module"));
    renderApp("/catalog?tab=rec&industry=medical&purpose=booking");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("추천을 불러오지 못했습니다.");
    await userEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    const region = await screen.findByRole("region", { name: "추천 결과" });
    expect(await within(region).findAllByRole("article")).not.toHaveLength(0);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(region).toHaveFocus();
  });

  it("QA D1 부수(E5): 적용 청크 재시도가 또 실패해도 포커스는 새 alert의 '다시 시도'에 남는다(BODY 0) → 세 번째에 대화상자", async () => {
    loads.apply.mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module"));
    loads.apply.mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module"));
    renderApp("/catalog?tab=rec&industry=medical&purpose=booking");
    const region = await screen.findByRole("region", { name: "추천 결과" });
    const first = (await within(region).findAllByRole("article"))[0]!;
    await userEvent.click(within(first).getByRole("button", { name: "이 추천 적용" }));
    await userEvent.click(within(await screen.findByRole("alert")).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(loads.apply).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(within(screen.getByRole("alert")).getByRole("button", { name: "다시 시도" })).toHaveFocus());
    await userEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});


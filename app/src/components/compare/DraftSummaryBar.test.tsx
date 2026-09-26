import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DraftStatus } from "../../domain/compareBoard";
import { confirmLabel } from "../../features/compare/draftLabels";
import { DraftSummaryBar } from "./DraftSummaryBar";

/** 역상 면 자식 규칙 (A11Y-01 4.2·9.2-3 · D-QA01): 밝은 면용 label-*·fill-* 금지 */
const LIGHT_SURFACE_CLASS = /(^|:)(text-label-|bg-fill-)/;

const UNCONFIRMED: DraftStatus = { kind: "unconfirmed", nextVersion: 1 };

function renderBar(
  canConfirm: { ok: true } | { ok: false; reason: string },
  status: DraftStatus = UNCONFIRMED,
  confirming = false,
) {
  render(
    <DraftSummaryBar
      pickedCount={2}
      total={10}
      warningCount={0}
      status={status}
      canConfirm={canConfirm}
      confirming={confirming}
      onShowDraft={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
}

describe("DraftSummaryBar — 역상 면", () => {
  it("'초안 보기'는 역상 쌍(secondary)이고 밝은 면용 클래스가 없다 (D-QA01)", () => {
    renderBar({ ok: true });
    const classes = [...screen.getByRole("button", { name: "초안 보기" }).classList];
    expect(classes).toEqual(expect.arrayContaining(["bg-inverse-fill-normal", "text-on-surface-inverse"]));
    expect(classes.filter((c) => LIGHT_SURFACE_CLASS.test(c))).toEqual([]);
  });

  it("aria-disabled '프로필 확정 (v1)'은 역상 비활성 쌍을 쓴다 (A11Y-AC-14)", () => {
    renderBar({ ok: false, reason: "Hero를 하나 고르면 확정할 수 있습니다" });
    const button = screen.getByRole("button", { name: "프로필 확정 (v1)" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    const classes = [...button.classList];
    expect(classes).toEqual(expect.arrayContaining(["aria-disabled:bg-inverse-fill-normal", "aria-disabled:text-inverse-label-disable"]));
    // primary 변형의 `disabled:` 쌍은 이 버튼(aria-disabled만 씀)에 적용되지 않는다 — aria-disabled 상태만 본다
    expect(classes.filter((c) => c.startsWith("aria-disabled:") && LIGHT_SURFACE_CLASS.test(c))).toEqual([]);
  });
});

/** D-V2F-01: 요약 바 확정 버튼은 패널과 같은 문구(confirmLabel)를 쓴다 — 접근 이름 = 보이는 글자 */
describe("DraftSummaryBar — 확정 버튼 문구 (D-V2F-01)", () => {
  const cases: readonly { readonly title: string; readonly status: DraftStatus; readonly confirming: boolean; readonly name: string }[] = [
    { title: "확정 전", status: UNCONFIRMED, confirming: false, name: "프로필 확정 (v1)" },
    { title: "v1 확정 뒤 변경", status: { kind: "changed", version: 1, nextVersion: 2 }, confirming: false, name: "새 버전으로 확정 (v2)" },
    { title: "확정 중", status: { kind: "changed", version: 1, nextVersion: 2 }, confirming: true, name: "확정 중…" },
  ];

  it.each(cases)("$title → '$name' (패널 confirmLabel과 같은 문자열)", ({ status, confirming, name }) => {
    renderBar({ ok: true }, status, confirming);
    expect(confirmLabel(status, confirming)).toBe(name);
    const button = screen.getByRole("button", { name });
    expect(button).toHaveTextContent(name);
    expect(button).not.toHaveAttribute("aria-label");
  });
});

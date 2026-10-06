import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GateList } from "../components/studio/GateList";
import type { GateReport, GateRowId } from "../engine/contracts/records";

/**
 * ER-AC-G1 가드 (EDITOR-REST SPEC r1 3.3) — 차단 줄마다 편집기 안에서 누를 수 있는 다음 행동이 1개 이상.
 * 줄 `state=block`인데 줄 안 버튼·링크가 0이면 실패. 대비 줄은 행동 2개(테마 바꾸기 · 프로필에서 보정).
 */
const IDS: readonly GateRowId[] = ["contrast", "alt-text", "heading-order", "required-sections", "motion-budget", "seo-meta", "text-length", "performance"];
const blockReport = {
  rows: IDS.map((id) => ({ id, state: "block", issues: [{ ruleId: "R-08", severity: "block", cause: "원인", alternative: "대체안" }] })),
} as unknown as GateReport;

describe("게이트 차단 줄 행동 가드 — ER-AC-G1", () => {
  it("모든 줄이 차단이어도 줄마다 행동 ≥ 1 · 대비 줄 = 행동 2개", () => {
    const contrastAction = (
      <>
        <button type="button">테마 바꾸기</button>
        <a href="/profile/p?v=1">프로필에서 보정</a>
      </>
    );
    const { container } = render(<GateList report={blockReport} stale={false} onRow={() => {}} contrastAction={contrastAction} />);
    const rows = [...container.querySelectorAll<HTMLElement>("[data-gate-row]")];
    expect(rows).toHaveLength(IDS.length);
    for (const row of rows) {
      expect(row.querySelectorAll("button, a[href]").length, row.dataset.gateRow).toBeGreaterThanOrEqual(1);
    }
    const contrast = rows.find((r) => r.dataset.gateRow === "contrast")!;
    expect([...contrast.querySelectorAll("button, a[href]")].map((e) => e.textContent)).toEqual(expect.arrayContaining(["테마 바꾸기", "프로필에서 보정"]));
  });
});

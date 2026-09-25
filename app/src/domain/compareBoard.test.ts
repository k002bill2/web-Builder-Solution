import { describe, expect, it } from "vitest";
import {
  COLUMN_LABELS,
  COMPARISON_ROWS,
  PICKABLE_ROW_IDS,
  draftStatusOf,
  emptyBoard,
  nextColumnLabel,
  type BoardColumn,
  type CompareBoard,
} from "./compareBoard";

const col = (referenceId: string, label: BoardColumn["label"]): BoardColumn => ({ referenceId, label });

describe("비교 보드 행 정의 (SPEC 2.3)", () => {
  it("12행이 SPEC 순서대로 있고 접근성·성능이 맨 끝이다", () => {
    expect(COMPARISON_ROWS.map((r) => r.id)).toEqual([
      "hero", "menu", "cta", "sectionCount", "palette", "font",
      "card", "imageRatio", "motion", "mobile", "footer", "quality",
    ]);
  });

  it("역할: 팔레트·폰트는 global, 섹션 수·접근성·성능은 info, 나머지는 pick", () => {
    const roles = Object.fromEntries(COMPARISON_ROWS.map((r) => [r.id, r.role]));
    expect(roles).toMatchObject({ palette: "global", font: "global", sectionCount: "info", quality: "info", hero: "pick" });
    expect(COMPARISON_ROWS.filter((r) => r.role === "pick")).toHaveLength(8);
  });

  it("필수 행은 Hero 하나다", () => {
    expect(COMPARISON_ROWS.filter((r) => r.required).map((r) => r.id)).toEqual(["hero"]);
  });

  it("선택 가능한 행은 info를 뺀 10개다", () => {
    expect(PICKABLE_ROW_IDS).toHaveLength(10);
    expect(PICKABLE_ROW_IDS).not.toContain("sectionCount");
    expect(PICKABLE_ROW_IDS).not.toContain("quality");
  });
});

describe("열 문자 할당 (SPEC 2.2)", () => {
  it("A~F 6개다", () => {
    expect(COLUMN_LABELS).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("비어 있는 가장 앞 문자를 준다 — B를 뺀 뒤 추가하면 B를 다시 받는다", () => {
    expect(nextColumnLabel([])).toBe("A");
    expect(nextColumnLabel([col("x", "A"), col("y", "B")])).toBe("C");
    expect(nextColumnLabel([col("x", "A"), col("z", "C")])).toBe("B");
  });

  it("6개가 차면 줄 문자가 없다", () => {
    const full = COLUMN_LABELS.map((label, i) => col(`r${i}`, label));
    expect(nextColumnLabel(full)).toBeUndefined();
  });
});

describe("확정 상태 태그 (SPEC 2.4·S-15·S-16)", () => {
  const base: CompareBoard = { ...emptyBoard("board-1", "2026-09-25T00:00:00.000Z"), revision: 4 };

  it("확정 기록이 없으면 확정 전", () => {
    expect(draftStatusOf(base)).toEqual({ kind: "unconfirmed", nextVersion: 1 });
  });

  it("확정한 revision 그대로면 vN 확정됨, 이후 바뀌면 변경됨 + 다음 버전", () => {
    const confirmed = { ...base, confirmed: { profileId: "p1", version: 1, revision: 4 } };
    expect(draftStatusOf(confirmed)).toEqual({ kind: "confirmed", version: 1 });
    expect(draftStatusOf({ ...confirmed, revision: 5 })).toEqual({ kind: "changed", version: 1, nextVersion: 2 });
  });
});

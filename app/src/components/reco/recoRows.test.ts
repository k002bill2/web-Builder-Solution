import { describe, expect, it } from "vitest";
import { PICKABLE_ROW_IDS, rowDef } from "../../domain/compareBoard";
import { RECO_ROW_IDS, rowShortLabel } from "./recoRows";

describe("추천 적용 행 표 = 비교 보드 선택 행 정의 (단일 정의 대조 가드)", () => {
  it("행 id·순서·짧은 이름이 PICKABLE_ROW_IDS·rowDef와 같다", () => {
    expect(RECO_ROW_IDS).toEqual(PICKABLE_ROW_IDS);
    for (const id of PICKABLE_ROW_IDS) expect(rowShortLabel(id)).toBe(rowDef(id).shortLabel);
  });
});

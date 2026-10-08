/** 지우기 대화상자 공용 문장 (P1C-SPEC 1.6 · P1D-SPEC 2절 PJ-7·PJ-9 = 같은 문장 재사용) */
import { describe, expect, it } from "vitest";
import { BUSY_TEXT, FAIL_TEXT } from "./dialogText";

describe("dialogText", () => {
  it("PJ-7 = 지우기 busy 문장 · PJ-9 = 지우기 실패 문장", () => {
    expect(BUSY_TEXT).toBe("다른 탭에서 편집 중이라 지우지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요");
    expect(FAIL_TEXT).toBe("지우지 못했습니다 — 다시 시도하세요");
  });
});
